import { supabase } from "@/lib/supabase";

type SearchParams = Promise<{ date?: string }>;

export default async function ManagerPage(props: {
  searchParams?: SearchParams;
}) {
  const resolvedParams = (await props.searchParams) || {};
  const selectedDate =
    resolvedParams.date || new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("checklist_date", selectedDate)
    .order("id", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Manager View</h1>
          <div className="rounded-xl border bg-white p-4">
            Error: {error.message}
          </div>
        </div>
      </main>
    );
  }

  const sections = ["Daily", "Nightly Closing", "Weekly"];
  const completedCount = data?.filter((item) => item.completed).length || 0;
  const totalCount = data?.length || 0;
  const incompleteCount = totalCount - completedCount;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <h1 className="text-3xl font-bold">Manager View</h1>
          <p className="text-gray-600 mt-1">
            Review completed and missed tasks by date
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <form className="rounded-2xl border bg-white p-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Checklist Date</label>
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="border rounded-lg px-3 py-2 text-lg"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg border bg-white px-4 py-2 text-lg"
          >
            View Date
          </button>
        </form>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-sm text-gray-500">Total Tasks</div>
            <div className="text-3xl font-bold">{totalCount}</div>
          </div>

          <div className="rounded-2xl border bg-white p-4">
            <div className="text-sm text-gray-500">Completed</div>
            <div className="text-3xl font-bold">{completedCount}</div>
          </div>

          <div className="rounded-2xl border bg-white p-4">
            <div className="text-sm text-gray-500">Incomplete</div>
            <div className="text-3xl font-bold">{incompleteCount}</div>
          </div>
        </div>

        {totalCount === 0 ? (
          <div className="rounded-2xl border bg-white p-6 text-lg">
            No checklist found for {selectedDate}.
          </div>
        ) : (
          <div className="space-y-8">
            {sections.map((section) => {
              const sectionItems =
                data?.filter((item) => item.task_section === section) || [];

              if (sectionItems.length === 0) return null;

              return (
                <section
                  key={section}
                  className="rounded-2xl border bg-white p-5"
                >
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

                        <div className="mt-2 text-base">
                          Status:{" "}
                          <span className="font-medium">
                            {item.completed ? "Completed" : "Incomplete"}
                          </span>
                        </div>

                        <div className="text-base text-gray-700">
                          Initials: {item.employee_initials || "—"}
                        </div>

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
        )}
      </div>
    </main>
  );
}