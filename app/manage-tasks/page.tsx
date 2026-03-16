import ManageTasksClient from "./ManageTasksClient";
import { supabase } from "@/lib/supabase";

export default async function ManageTasksPage() {
  const { data, error } = await supabase
    .from("task_templates")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold mb-4">Manage Tasks</h1>
          <div className="rounded-xl border bg-white p-4">
            Error: {error.message}
          </div>
        </div>
      </main>
    );
  }

  return <ManageTasksClient initialTasks={data || []} />;
}