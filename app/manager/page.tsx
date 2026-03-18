export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/LogoutButton";
import AutoLogout from "@/components/AutoLogout";

type SearchParams = Promise<{ date?: string }>;

export default async function ManagerPage(props: {
  searchParams?: SearchParams;
}) {
  const resolvedParams = (await props.searchParams) || {};

  const now = new Date();

  const today = now.toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });

  const selectedDate = resolvedParams.date || today;

  const { data: items, error } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("checklist_date", selectedDate)
    .order("id", { ascending: true });

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

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-50">
                Checklist History
              </h1>
              <p className="mt-1 text-slate-300">
                Viewing checklist for {selectedDate}
              </p>
            </div>
            {navButtons}
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4 text-slate-100 shadow-sm">
            Error: {error.message}
          </div>
        </div>
      </main>
    );
  }

  const safeItems = items || [];
  const total = safeItems.length;
  const completed = safeItems.filter((i) => i.completed).length;
  const incomplete = total - completed;
  const missedTasks = safeItems.filter((i) => !i.completed);

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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-50">
              Checklist History
            </h1>
            <p className="mt-1 text-slate-300">
              Viewing checklist for {selectedDate}
            </p>
          </div>
          {navButtons}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <AutoLogout />

        <form className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-sm sm:flex-row sm:items-end">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-100">
              Choose Date
            </label>
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              max={today}
              className="rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 shadow-sm hover:bg-slate-800"
          >
            View Date
          </button>
        </form>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4 text-center shadow-sm">
            <div className="text-sm font-medium text-slate-300">Total Tasks</div>
            <div className="mt-1 text-3xl font-bold text-slate-50">{total}</div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4 text-center shadow-sm">
            <div className="text-sm font-medium text-slate-300">Completed</div>
            <div className="mt-1 text-3xl font-bold text-green-400">
              {completed}
            </div>
          </div>

          <a
            href="#missed-tasks"
            className="rounded-2xl border border-slate-700 bg-slate-900 p-4 text-center shadow-sm transition hover:bg-slate-800"
          >
            <div className="text-sm font-medium text-slate-300">Incomplete</div>
            <div className="mt-1 text-3xl font-bold text-red-400">
              {incomplete}
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Jump to missed tasks
            </div>
          </a>
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

        <section
          id="missed-tasks"
          className="mb-6 rounded-2xl border border-red-900 bg-red-950/20 p-5 shadow-sm"
        >
          <h2 className="text-2xl font-bold text-red-300">Missed Tasks</h2>
          <p className="mt-1 text-slate-300">
            Tasks not completed for {selectedDate}
          </p>

          {missedTasks.length === 0 ? (
            <div className="mt-4 rounded-xl border border-green-800 bg-green-950/30 p-4 text-green-300">
              No missed tasks. Everything was completed.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {missedTasks.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-700 bg-slate-900 p-4"
                >
                  <div className="text-lg font-semibold text-slate-50">
                    {item.task_name}
                  </div>

                  <div className="mt-1 text-sm text-slate-300">
                    Section: {item.task_section}
                  </div>

                  <div className="mt-1 text-sm text-red-300">
                    Status: Not completed
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {total === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-sm">
            No checklist found for {selectedDate}.
          </div>
        ) : (
          <div className="space-y-4">
            {safeItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-sm"
              >
                <div className="text-lg font-semibold text-slate-50">
                  {item.task_name}
                </div>

                <div className="mt-2 text-sm text-slate-300 sm:text-base">
                  Section: {item.task_section}
                </div>

                <div className="mt-1 text-sm text-slate-300 sm:text-base">
                  Status: {item.completed ? "Completed" : "Not completed"}
                </div>

                {item.employee_initials && (
                  <div className="mt-1 text-sm text-slate-300 sm:text-base">
                    By: {item.employee_initials}
                  </div>
                )}

                {item.completed_at && (
                  <div className="mt-1 text-sm text-slate-400">
                    Completed at: {new Date(item.completed_at).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}