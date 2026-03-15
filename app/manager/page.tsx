import { supabase } from "@/lib/supabase";

type SearchParams = Promise<{ date?: string }>;

export default async function ManagerPage(props: {
  searchParams?: SearchParams;
}) {

  const resolvedParams = (await props.searchParams) || {};
  const selectedDate =
    resolvedParams.date || new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("checklist_date", selectedDate)
    .order("id", { ascending: true });

  const sections = ["Daily", "Nightly Closing", "Weekly"];
  const missedTasks = data?.filter((item) => !item.completed) || [];

  return (
    <main className="min-h-screen bg-gray-50">

      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-5">

          <h1 className="text-3xl font-bold">Manager View</h1>
          <p className="text-gray-600 mt-1">
            Review completed and missed tasks
          </p>

          <div className="mt-3">
            <a
              href="/"
              className="inline-flex items-center rounded-xl border bg-white px-4 py-2 text-base font-medium shadow-sm"
            >
              Back to Checklist
            </a>
          </div>

        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">

        {missedTasks.length > 0 && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-5">

            <h2 className="text-2xl font-semibold text-red-700 mb-4">
              Missed Tasks
            </h2>

            <div className="space-y-3">
              {missedTasks.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-red-200 bg-white p-4"
                >
                  <div className="text-lg font-semibold">
                    {item.task_name}
                  </div>

                  <div className="text-sm text-gray-600">
                    Section: {item.task_section}
                  </div>
                </div>
              ))}
            </div>

          </section>
        )}

        {sections.map((section) => {

          const sectionItems =
            data?.filter((item) => item.task_section === section) || [];

          if (sectionItems.length === 0) return null;

          return (
            <section key={section} className="rounded-2xl border bg-white p-5">

              <h2 className="text-2xl font-semibold mb-4">{section}</h2>

              <div className="space-y-3">
                {sectionItems.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 ${
                      item.completed
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >

                    <div className="text-xl font-semibold">
                      {item.task_name}
                    </div>

                    <div>Status: {item.completed ? "Completed" : "Incomplete"}</div>

                    <div>Initials: {item.employee_initials || "—"}</div>

                    <div className="text-sm text-gray-500">
                      Completed at:{" "}
                      {item.completed_at
                        ? new Date(item.completed_at).toLocaleString()
                        : "—"}
                    </div>

                  </div>
                ))}
              </div>

            </section>
          );
        })}

      </div>
    </main>
  );
}