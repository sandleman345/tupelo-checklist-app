export const dynamic = "force-dynamic";

import AutoLogout from "@/components/AutoLogout";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/AppShell";
import LogoutButton from "@/components/LogoutButton";

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
        className="rounded-xl border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
      >
        Back to Checklist
      </a>

      <a
        href="/manage-tasks"
        className="rounded-xl border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
      >
        Manage Tasks
      </a>

      <LogoutButton />
    </div>
  );

  if (error) {
    return (
      <AppShell
        title="Checklist History"
        subtitle={`Viewing checklist for ${selectedDate}`}
        rightSlot={navButtons}
      >
        <div className="rounded-2xl border bg-white p-4 text-gray-900 shadow-sm">
          Error: {error.message}
        </div>
      </AppShell>
    );
  }

  const total = items?.length || 0;
  const completed = items?.filter((i) => i.completed).length || 0;
  const incomplete = total - completed;

  const sections = ["Daily", "Nightly Closing", "Weekly"];

  const getSectionStats = (section: string) => {
    const sectionItems = items?.filter((i) => i.task_section === section) || [];
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
    if (section === "Nightly Closing") return "bg-amber-500";
    if (section === "Weekly") return "bg-green-500";
    return "bg-gray-500";
  };

  const getHeaderColor = (section: string) => {
    if (section === "Daily") return "text-blue-700";
    if (section === "Nightly Closing") return "text-amber-700";
    if (section === "Weekly") return "text-green-700";
    return "text-gray-900";
  };

  return (
    <AppShell
  title="Manager Dashboard"
  subtitle={`Viewing checklist for ${selectedDate}`}
  rightSlot={navButtons}
>
  <AutoLogout />

  <form className="mb-6 flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">
            Choose Date
          </label>
          <input
            type="date"
            name="date"
            defaultValue={selectedDate}
            max={today}
            className="rounded-xl border bg-white px-3 py-2 text-gray-900"
          />
        </div>

        <button
          type="submit"
          className="rounded-xl border bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
        >
          View Date
        </button>
      </form>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4 text-center shadow-sm">
          <div className="text-sm font-medium text-gray-800">Total Tasks</div>
          <div className="mt-1 text-3xl font-bold text-gray-900">{total}</div>
        </div>

        <div className="rounded-2xl border bg-white p-4 text-center shadow-sm">
          <div className="text-sm font-medium text-gray-800">Completed</div>
          <div className="mt-1 text-3xl font-bold text-green-700">
            {completed}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 text-center shadow-sm">
          <div className="text-sm font-medium text-gray-800">Incomplete</div>
          <div className="mt-1 text-3xl font-bold text-red-700">
            {incomplete}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4">
        {sections.map((section) => {
          const stats = getSectionStats(section);
          if (stats.total === 0) return null;

          return (
            <div
              key={section}
              className="rounded-2xl border bg-white p-4 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <h2
                  className={`text-lg font-semibold sm:text-xl ${getHeaderColor(
                    section
                  )}`}
                >
                  {section}
                </h2>

                <div className="text-sm font-medium text-gray-800">
                  {stats.completed} / {stats.total}
                </div>
              </div>

              <div className="h-4 w-full rounded-full bg-gray-200">
                <div
                  className={`h-4 rounded-full transition-all ${getColor(
                    section
                  )}`}
                  style={{ width: `${stats.percent}%` }}
                />
              </div>

              <div className="mt-2 text-sm text-gray-800">
                {stats.percent}% complete
              </div>
            </div>
          );
        })}
      </div>

      {total === 0 ? (
        <div className="rounded-2xl border bg-white p-6 text-gray-900 shadow-sm">
          No checklist found for {selectedDate}.
        </div>
      ) : (
        <div className="space-y-4">
          {items?.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border bg-white p-4 shadow-sm"
            >
              <div className="text-lg font-semibold text-gray-900">
                {item.task_name}
              </div>

              <div className="mt-2 text-sm text-gray-800 sm:text-base">
                Section: {item.task_section}
              </div>

              <div className="mt-1 text-sm text-gray-800 sm:text-base">
                Status: {item.completed ? "Completed" : "Not completed"}
              </div>

              {item.employee_initials && (
                <div className="mt-1 text-sm text-gray-800 sm:text-base">
                  By: {item.employee_initials}
                </div>
              )}

              {item.completed_at && (
                <div className="mt-1 text-sm text-gray-700">
                  Completed at: {new Date(item.completed_at).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}