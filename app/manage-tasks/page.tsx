export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import ManageTasksClient from "./ManageTasksClient";

export default async function ManageTasksPage() {
  const { data, error } = await supabase
    .from("task_templates")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return (
      <div className="p-6 text-gray-900">Error loading tasks: {error.message}</div>
    );
  }

  return <ManageTasksClient initialTasks={data || []} />;
}