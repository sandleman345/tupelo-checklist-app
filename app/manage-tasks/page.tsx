export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import ManageTasksClient from "./ManageTasksClient";

export default async function ManageTasksPage() {
  const { data: tasks, error: tasksError } = await supabase
    .from("task_templates")
    .select("*")
    .order("sort_order", { ascending: true });

  if (tasksError) {
    return (
      <div className="p-6 text-gray-900">
        Error loading tasks: {tasksError.message}
      </div>
    );
  }

  const { data: teamMembers, error: teamError } = await supabase
    .from("team_members")
    .select("*")
    .order("sort_order", { ascending: true });

  if (teamError) {
    return (
      <div className="p-6 text-gray-900">
        Error loading team members: {teamError.message}
      </div>
    );
  }

  return (
    <ManageTasksClient
      initialTasks={tasks || []}
      initialTeamMembers={teamMembers || []}
    />
  );
}