import { supabase } from "@/lib/supabase";

export default async function ManagerPage() {
  const today = new Date().toISOString().split("T")[0];

  const { data: items } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("checklist_date", today);

  const total = items?.length || 0;
  const completed = items?.filter((i) => i.completed).length || 0;
  const incomplete = total - completed;

  const sections = ["Daily", "Nightly Closing", "Weekly"];

  const getSectionStats = (section: string) => {
    const sectionItems = items?.filter((i) => i.task_section === section) || [];
    const completed = sectionItems.filter((i) => i.completed).length;
    const total = sectionItems.length;

    return { completed, total };
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="border-b bg-white px-6 py-5">
        <h1 className="text-3xl font-bold">Manager Dashboard</h1>

        <p className="mt-1 text-gray-700">
          View today’s checklist progress
        </p>

        <div className="mt-2 text-sm text-gray-700">
          Date: {today}
        </div>

        <div className="mt-4 flex gap-3 flex-wrap">
          <a
            href="/"
            className="rounded-xl border bg-white px-4 py-2 font-medium shadow-sm"
          >
            Back to Checklist
          </a>

          <a
            href="/manage-tasks"
            className="rounded-xl border bg-white px-4 py-2 font-medium shadow-sm"
          >
            Manage Tasks
          </a>
        </div>
      </div>

      {/* STATS */}
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border bg-white p-4 text-center">
            <div className="text-sm text-gray-700">Total Tasks</div>
            <div className="text-3xl font-bold">{total}</div>
          </div>

          <div className="rounded-xl border bg-white p-4 text-center">
            <div className="text-sm text-gray-700">Completed</div>
            <div className="text-3xl font-bold text-green-600">
              {completed}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 text-center">
            <div className="text-sm text-gray-700">Incomplete</div>
            <div className="text-3xl font-bold text-red-600">
              {incomplete}
            </div>
          </div>
        </div>

        {/* SECTION BREAKDOWN */}
        <div className="space-y-4">
          {sections.map((section) => {
            const stats = getSectionStats(section);
            if (stats.total === 0) return null;

            return (
              <div
                key={section}
                className="rounded-xl border bg-white p-5"
              >
                <h2 className="text-xl font-semibold text-gray-800">
                  {section}
                </h2>

                <div className="mt-2 text-gray-700">
                  {stats.completed} of {stats.total} completed
                </div>
              </div>
            );
          })}
        </div>

        {/* TASK LIST */}
        <div className="space-y-4">
          {items?.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border bg-white p-4"
            >
              <div className="text-lg font-semibold text-gray-800">
                {item.task_name}
              </div>

              <div className="text-gray-700">
                Section: {item.task_section}
              </div>

              <div className="text-gray-700">
                Status:{" "}
                {item.completed ? "Completed" : "Not completed"}
              </div>

              {item.employee_initials && (
                <div className="text-gray-700">
                  By: {item.employee_initials}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}