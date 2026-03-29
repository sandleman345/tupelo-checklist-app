export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/LogoutButton";
import AutoLogout from "@/components/AutoLogout";
import HistoryDateForm from "./HistoryDateForm";

type SearchParams = Promise<{ date?: string; mode?: string }>;

type TeamMember = {
  id: string;
  initials: string;
  name: string | null;
  active: boolean;
  sort_order: number;
};

type ChecklistItem = {
  id: number;
  checklist_date: string;
  task_name: string;
  task_section: string | null;
  completed: boolean;
  employee_initials: string | null;
  completed_at: string | null;
  is_rollover?: boolean | null;
};

const formatCompletedAt = (value: string | null) => {
  if (!value) return "";
  return new Date(value).toLocaleString();
};

const getStartOfWeek = (dateString: string) => {
  const date = new Date(`${dateString}T12:00:00`);
  const day = date.getDay();
  const diff = date.getDate() - day;

  const start = new Date(date);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  return start;
};

const formatDisplayDate = (dateString: string) => {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatWeekLabel = (dateString: string) => {
  return `Week of ${formatDisplayDate(dateString)}`;
};

const formatDateForDB = (date: Date) => date.toISOString().slice(0, 10);

export default async function ManagerPage(props: {
  searchParams?: SearchParams;
}) {
  const resolvedParams = (await props.searchParams) || {};

  const now = new Date();

  const today = now.toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });

  const selectedDate = resolvedParams.date || today;
  const isSevenDayMode = resolvedParams.mode === "7d";
  const isThisWeekMode = resolvedParams.mode === "week";

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayStr = yesterday.toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const sevenDaysAgoStr = sevenDaysAgo.toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });

  const startOfSelectedWeek = getStartOfWeek(selectedDate);
  const startOfSelectedWeekStr = formatDateForDB(startOfSelectedWeek);

  const startOfCurrentWeek = getStartOfWeek(today);
  const startOfCurrentWeekStr = formatDateForDB(startOfCurrentWeek);

  let items: ChecklistItem[] = [];
  let errorMessage = "";

  if (isSevenDayMode) {
    const { data, error } = await supabase
      .from("checklist_items")
      .select("*")
      .order("checklist_date", { ascending: false })
      .order("id", { ascending: true })
      .gte("checklist_date", sevenDaysAgoStr)
      .lte("checklist_date", today);

    if (error) {
      errorMessage = error.message;
    } else {
      items = (data || []) as ChecklistItem[];
    }
  } else if (isThisWeekMode) {
    const { data, error } = await supabase
      .from("checklist_items")
      .select("*")
      .order("checklist_date", { ascending: false })
      .order("id", { ascending: true })
      .gte("checklist_date", startOfCurrentWeekStr)
      .lte("checklist_date", today);

    if (error) {
      errorMessage = error.message;
    } else {
      items = (data || []) as ChecklistItem[];
    }
  } else {
    const { data: dailyNightlyData, error: dailyNightlyError } = await supabase
      .from("checklist_items")
      .select("*")
      .order("id", { ascending: true })
      .eq("checklist_date", selectedDate)
      .in("task_section", ["Daily", "Nightly Closing"]);

    const { data: weeklyData, error: weeklyError } = await supabase
      .from("checklist_items")
      .select("*")
      .order("id", { ascending: true })
      .eq("checklist_date", startOfSelectedWeekStr)
      .eq("task_section", "Weekly");

    if (dailyNightlyError) {
      errorMessage = dailyNightlyError.message;
    } else if (weeklyError) {
      errorMessage = weeklyError.message;
    } else {
      items = [
        ...((dailyNightlyData || []) as ChecklistItem[]),
        ...((weeklyData || []) as ChecklistItem[]),
      ];
    }
  }

  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  const navButtons = (
    <div className="flex flex-wrap gap-2">
      <a
        href="/"
        className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 shadow-sm hover:bg-slate-800"
      >
        Back to Checklist
      </a>

      <a
        href="/manage-tasks"
        className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 shadow-sm hover:bg-slate-800"
      >
        Edit Tasks
      </a>

      <LogoutButton />
    </div>
  );

  const subtitle = isSevenDayMode
    ? `Viewing last 7 days (${formatDisplayDate(sevenDaysAgoStr)} to ${formatDisplayDate(today)})`
    : isThisWeekMode
    ? `Viewing this week (${formatWeekLabel(startOfCurrentWeekStr)})`
    : `Viewing ${formatDisplayDate(selectedDate)} with ${formatWeekLabel(startOfSelectedWeekStr)}`;

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-50">
                Checklist History
              </h1>
              <p className="mt-1 text-slate-300">{subtitle}</p>
            </div>
            {navButtons}
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4 text-slate-100 shadow-sm">
            Error: {errorMessage}
          </div>
        </div>
      </main>
    );
  }

  const safeItems = items;
  const total = safeItems.length;
  const completed = safeItems.filter((i) => i.completed).length;
  const incomplete = total - completed;

  const missedTasks = safeItems.filter((i) => !i.completed);
  const completedTasks = safeItems.filter((i) => i.completed);

  const missedDaily = missedTasks.filter((item) => item.task_section === "Daily");
  const missedNightly = missedTasks.filter(
    (item) => item.task_section === "Nightly Closing"
  );
  const missedWeekly = missedTasks
    .filter((item) => item.task_section === "Weekly")
    .sort((a, b) => Number(b.is_rollover) - Number(a.is_rollover));

  const completedDaily = completedTasks.filter(
    (item) => item.task_section === "Daily"
  );
  const completedNightly = completedTasks.filter(
    (item) => item.task_section === "Nightly Closing"
  );
  const completedWeekly = completedTasks
    .filter((item) => item.task_section === "Weekly")
    .sort((a, b) => Number(b.is_rollover) - Number(a.is_rollover));

  const initialsCounts: Record<string, number> = {};

  safeItems.forEach((item) => {
    if (item.completed && item.employee_initials) {
      const key = item.employee_initials.trim().toUpperCase();

      if (!initialsCounts[key]) {
        initialsCounts[key] = 0;
      }

      initialsCounts[key] += 1;
    }
  });

  const typedTeamMembers: TeamMember[] = (teamMembers || []) as TeamMember[];

  const memberStats = typedTeamMembers
    .map((member) => ({
      id: member.id,
      initials: member.initials,
      name: member.name,
      count: initialsCounts[member.initials] || 0,
    }))
    .filter((member) => member.count > 0)
    .sort((a, b) => b.count - a.count);

  const unknownInitials = Object.keys(initialsCounts).filter(
    (initials) => !typedTeamMembers.some((member) => member.initials === initials)
  );

  const unknownMemberStats = unknownInitials
    .map((initials) => ({
      id: initials,
      initials,
      name: null,
      count: initialsCounts[initials],
    }))
    .sort((a, b) => b.count - a.count);

  const allMemberStats = [...memberStats, ...unknownMemberStats];
  const topPerformer = allMemberStats[0];

  const lastCompletedTask = [...completedTasks]
    .filter((item) => item.completed_at)
    .sort(
      (a, b) =>
        new Date(b.completed_at || "").getTime() -
        new Date(a.completed_at || "").getTime()
    )[0];

  const sections = ["Daily", "Nightly Closing", "Weekly"];

  const getSectionStats = (section: string) => {
    const sectionItems = safeItems.filter((i) => i.task_section === section);
    const completedCount = sectionItems.filter((i) => i.completed).length;
    const totalCount = sectionItems.length;
    const percent = totalCount
      ? Math.round((completedCount / totalCount) * 100)
      : 0;

    return {
      completed: completedCount,
      total: totalCount,
      percent,
    };
  };

  const getColor = (section: string) => {
    if (section === "Daily") return "bg-blue-500";
    if (section === "Nightly Closing") return "bg-amber-400";
    if (section === "Weekly") return "bg-green-500";
    return "bg-slate-500";
  };

  const getHeaderColor = (section: string) => {
    if (section === "Daily") return "text-blue-300";
    if (section === "Nightly Closing") return "text-amber-300";
    if (section === "Weekly") return "text-green-300";
    return "text-slate-100";
  };

  const groupedByDate = safeItems.reduce<Record<string, ChecklistItem[]>>(
    (acc, item) => {
      if (!acc[item.checklist_date]) {
        acc[item.checklist_date] = [];
      }
      acc[item.checklist_date].push(item);
      return acc;
    },
    {}
  );

  const sortedDates = Object.keys(groupedByDate).sort((a, b) =>
    b.localeCompare(a)
  );

  const TaskCard = ({
    item,
    statusColor,
  }: {
    item: ChecklistItem;
    statusColor: "green" | "red";
  }) => (
    <div
      className={`rounded-xl border bg-slate-900 p-4 ${
        item.task_section === "Weekly" && item.is_rollover
          ? "border-red-500/40"
          : "border-slate-700"
      }`}
    >
      {item.task_section === "Weekly" && item.is_rollover && (
        <div className="mb-2 inline-flex rounded-full border border-red-400/40 bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-200">
          Rolled Over
        </div>
      )}

      <div className="text-lg font-semibold text-slate-50">{item.task_name}</div>

      <div className="mt-1 text-sm text-slate-300">
        {item.task_section === "Weekly"
          ? formatWeekLabel(item.checklist_date)
          : `Date: ${formatDisplayDate(item.checklist_date)}`}
      </div>

      <div className="mt-1 text-sm text-slate-300">
        Section: {item.task_section}
      </div>

      <div
        className={`mt-1 text-sm ${
          statusColor === "green" ? "text-green-300" : "text-red-300"
        }`}
      >
        Status: {statusColor === "green" ? "Completed" : "Not completed"}
      </div>

      {item.employee_initials && (
        <div className="mt-1 text-sm text-slate-300">
          By: {item.employee_initials}
        </div>
      )}

      {item.completed_at && (
        <div className="mt-1 text-sm text-slate-400">
          Completed at: {formatCompletedAt(item.completed_at)}
        </div>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-50">
              Checklist History
            </h1>

            <div className="mt-1 space-y-1">
              <p className="text-slate-300">{subtitle}</p>
              <p className="text-xs text-slate-400">
                Daily & Nightly = selected date · Weekly = start of that week
              </p>
            </div>
          </div>
          {navButtons}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <AutoLogout />

        <div className="mb-6">
          <HistoryDateForm selectedDate={selectedDate} today={today} />
        </div>

        <div className="mb-6 inline-flex rounded-2xl border border-slate-700 bg-slate-900 p-1 shadow-sm">
          <a
            href={`/manager?date=${today}`}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              !isSevenDayMode && !isThisWeekMode && selectedDate === today
                ? "bg-blue-500 text-white shadow"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            Today
          </a>

          <a
            href={`/manager?date=${yesterdayStr}`}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              !isSevenDayMode && !isThisWeekMode && selectedDate === yesterdayStr
                ? "bg-blue-500 text-white shadow"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            Yesterday
          </a>

          <a
            href="/manager?mode=week"
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              isThisWeekMode
                ? "bg-blue-500 text-white shadow"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            This Week
          </a>

          <a
            href="/manager?mode=7d"
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              isSevenDayMode
                ? "bg-blue-500 text-white shadow"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            7 Days
          </a>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-center shadow-sm">
            <div className="text-sm font-medium text-slate-300">Total Tasks</div>
            <div className="mt-0.5 text-2xl font-bold text-slate-50">
              {total}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-center shadow-sm">
            <div className="text-sm font-medium text-slate-300">Completed</div>
            <div className="mt-0.5 text-2xl font-bold text-green-400">
              {completed}
            </div>
          </div>

          <a
            href="#missed-tasks"
            className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-center shadow-sm transition hover:bg-slate-800"
          >
            <div className="text-sm font-medium text-slate-300">Incomplete</div>
            <div className="mt-0.5 text-2xl font-bold text-red-400">
              {incomplete}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Jump to missed tasks
            </div>
          </a>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">
              Team Activity
            </h2>
            <div className="text-sm text-slate-400">
              {isSevenDayMode
                ? "Last 7 Days"
                : isThisWeekMode
                ? formatWeekLabel(startOfCurrentWeekStr)
                : formatDisplayDate(selectedDate)}
            </div>
          </div>

          {topPerformer && (
            <div className="mb-3 rounded-xl border border-yellow-500 bg-yellow-900/20 px-4 py-2 text-sm text-yellow-300">
              🥇 Top Contributor: {topPerformer.name || topPerformer.initials} (
              {topPerformer.count} {topPerformer.count === 1 ? "task" : "tasks"})
            </div>
          )}

          {lastCompletedTask && (
            <div className="mb-3 rounded-xl border border-sky-500 bg-sky-900/20 px-4 py-2 text-sm text-sky-300">
              Last Activity: {lastCompletedTask.employee_initials || "Unknown"}{" "}
              completed {lastCompletedTask.task_name} at{" "}
              {new Date(lastCompletedTask.completed_at || "").toLocaleTimeString(
                [],
                {
                  hour: "numeric",
                  minute: "2-digit",
                }
              )}
            </div>
          )}

          {allMemberStats.length === 0 ? (
            <div className="text-sm text-slate-400">
              No completed task activity recorded for this view.
            </div>
          ) : (
            <div className="space-y-3">
              {allMemberStats.map((member, index) => (
                <div
                  key={member.id}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                    index === 0
                      ? "border-yellow-500 bg-yellow-900/10"
                      : "border-slate-600 bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-500 bg-slate-700 text-sm font-bold text-slate-100">
                      {member.initials}
                    </div>

                    <div>
                      <div className="text-sm font-medium text-slate-100">
                        {member.name || member.initials}
                      </div>
                      <div className="text-xs text-slate-400">
                        {member.initials}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-bold text-green-400">
                      {member.count}
                    </div>
                    <div className="text-xs text-slate-400">
                      {member.count === 1 ? "task" : "tasks"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6 grid gap-4">
          {sections.map((section) => {
            const stats = getSectionStats(section);
            if (stats.total === 0) return null;

            return (
              <div
                key={section}
                className="rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h2
                    className={`text-lg font-semibold sm:text-xl ${getHeaderColor(
                      section
                    )}`}
                  >
                    {section}
                  </h2>

                  <div className="text-sm font-medium text-slate-300">
                    {stats.completed} / {stats.total}
                  </div>
                </div>

                <div className="h-4 w-full rounded-full bg-slate-800">
                  <div
                    className={`h-4 rounded-full transition-all ${getColor(
                      section
                    )}`}
                    style={{ width: `${stats.percent}%` }}
                  />
                </div>

                <div className="mt-2 text-sm text-slate-300">
                  {stats.percent}% complete
                </div>
              </div>
            );
          })}
        </div>

        <details
          id="missed-tasks"
          className="mb-6 rounded-2xl border border-red-900 bg-red-950/20 p-5 shadow-sm"
        >
          <summary className="cursor-pointer list-none text-2xl font-bold text-red-300">
            <div className="flex items-center justify-between">
              <span>Missed Tasks</span>
              <span className="text-sm font-medium text-slate-300">
                {missedTasks.length} tasks
              </span>
            </div>
          </summary>

          <p className="mt-2 text-slate-300">
            {isSevenDayMode
              ? `Tasks not completed from ${formatDisplayDate(sevenDaysAgoStr)} to ${formatDisplayDate(today)}`
              : isThisWeekMode
              ? `Tasks not completed for ${formatWeekLabel(startOfCurrentWeekStr)}`
              : `Tasks not completed for ${formatDisplayDate(selectedDate)} with ${formatWeekLabel(startOfSelectedWeekStr)}`}
          </p>

          {missedTasks.length === 0 ? (
            <div className="mt-4 rounded-xl border border-green-800 bg-green-950/30 p-4 text-green-300">
              No missed tasks. Everything was completed.
            </div>
          ) : (
            <div className="mt-4 space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-semibold text-green-300">
                  Weekly · Week of {formatDisplayDate(startOfSelectedWeekStr)}
                </h3>
                {missedWeekly.some((i) => i.is_rollover) && (
                  <div className="mb-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200">
                    ⚠ Rollover tasks must be completed first
                  </div>
                )}
                {missedWeekly.length === 0 ? (
                  <div className="text-sm text-slate-400">
                    No missed weekly tasks.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {missedWeekly.map((item) => (
                      <TaskCard
                        key={`${item.checklist_date}-${item.id}`}
                        item={item}
                        statusColor="red"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-lg font-semibold text-blue-300">
                  Daily · {formatDisplayDate(selectedDate)}
                </h3>
                {missedDaily.length === 0 ? (
                  <div className="text-sm text-slate-400">No missed daily tasks.</div>
                ) : (
                  <div className="space-y-3">
                    {missedDaily.map((item) => (
                      <TaskCard
                        key={`${item.checklist_date}-${item.id}`}
                        item={item}
                        statusColor="red"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-lg font-semibold text-amber-300">
                  Nightly · {formatDisplayDate(selectedDate)}
                </h3>
                {missedNightly.length === 0 ? (
                  <div className="text-sm text-slate-400">
                    No missed nightly closing tasks.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {missedNightly.map((item) => (
                      <TaskCard
                        key={`${item.checklist_date}-${item.id}`}
                        item={item}
                        statusColor="red"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </details>

        <details className="mb-6 rounded-2xl border border-green-900 bg-green-950/10 p-5 shadow-sm">
          <summary className="cursor-pointer list-none text-2xl font-bold text-green-300">
            <div className="flex items-center justify-between">
              <span>Completed Tasks</span>
              <span className="text-sm font-medium text-slate-300">
                {completedTasks.length} tasks
              </span>
            </div>
          </summary>

          <p className="mt-2 text-slate-300">
            {isSevenDayMode
              ? `Tasks completed from ${formatDisplayDate(sevenDaysAgoStr)} to ${formatDisplayDate(today)}`
              : isThisWeekMode
              ? `Tasks completed for ${formatWeekLabel(startOfCurrentWeekStr)}`
              : `Tasks completed for ${formatDisplayDate(selectedDate)} with ${formatWeekLabel(startOfSelectedWeekStr)}`}
          </p>

          {completedTasks.length === 0 ? (
            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-4 text-slate-300">
              No completed tasks for this view.
            </div>
          ) : (
            <div className="mt-4 space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-semibold text-green-300">
                  Weekly · Week of {formatDisplayDate(startOfSelectedWeekStr)}
                </h3>
                {completedWeekly.some((i) => i.is_rollover) && (
                  <div className="mb-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200">
                    ⚠ Includes rollover tasks from previous week
                  </div>
                )}
                {completedWeekly.length === 0 ? (
                  <div className="text-sm text-slate-400">
                    No completed weekly tasks.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedWeekly.map((item) => (
                      <TaskCard
                        key={`${item.checklist_date}-${item.id}`}
                        item={item}
                        statusColor="green"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-lg font-semibold text-blue-300">
                  Daily · {formatDisplayDate(selectedDate)}
                </h3>
                {completedDaily.length === 0 ? (
                  <div className="text-sm text-slate-400">
                    No completed daily tasks.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedDaily.map((item) => (
                      <TaskCard
                        key={`${item.checklist_date}-${item.id}`}
                        item={item}
                        statusColor="green"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-lg font-semibold text-amber-300">
                  Nightly · {formatDisplayDate(selectedDate)}
                </h3>
                {completedNightly.length === 0 ? (
                  <div className="text-sm text-slate-400">
                    No completed nightly closing tasks.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedNightly.map((item) => (
                      <TaskCard
                        key={`${item.checklist_date}-${item.id}`}
                        item={item}
                        statusColor="green"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </details>

        {(isSevenDayMode || isThisWeekMode) && sortedDates.length > 0 && (
          <details className="rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-sm">
            <summary className="cursor-pointer list-none text-2xl font-bold text-slate-100">
              <div className="flex items-center justify-between">
                <span>Daily Breakdown</span>
                <span className="text-sm font-medium text-slate-300">
                  {sortedDates.length} dates
                </span>
              </div>
            </summary>

            <div className="mt-4 space-y-4">
              {sortedDates.map((date) => {
                const dateItems = groupedByDate[date];
                const dateCompleted = dateItems.filter((i) => i.completed).length;
                const dateTotal = dateItems.length;
                const datePercent = dateTotal
                  ? Math.round((dateCompleted / dateTotal) * 100)
                  : 0;

                return (
                  <div
                    key={date}
                    className="rounded-xl border border-slate-700 bg-slate-800 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-lg font-semibold text-slate-100">
                        {formatDisplayDate(date)}
                      </div>
                      <div className="text-sm text-slate-300">
                        {dateCompleted} / {dateTotal}
                      </div>
                    </div>

                    <div className="h-3 w-full rounded-full bg-slate-700">
                      <div
                        className="h-3 rounded-full bg-blue-500"
                        style={{ width: `${datePercent}%` }}
                      />
                    </div>

                    <div className="mt-2 text-sm text-slate-300">
                      {datePercent}% complete
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        )}
      </div>
    </main>
  );
}