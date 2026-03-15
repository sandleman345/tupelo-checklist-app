import ChecklistClient from "./ChecklistClient";
import { supabase } from "@/lib/supabase";

export default async function Home() {
  const today = new Date().toISOString().split("T")[0];

  const existingChecklist = await supabase
    .from("checklist_items")
    .select("id")
    .eq("checklist_date", today)
    .limit(1);

  if (existingChecklist.error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Supabase Error</h1>
        <p>{existingChecklist.error.message}</p>
      </div>
    );
  }

  if (!existingChecklist.data || existingChecklist.data.length === 0) {
    const { data: templates, error: templateError } = await supabase
      .from("task_templates")
      .select("task_name, task_type, task_section, sort_order")
      const today = new Date();
const weekday = today.getDay();

const { data: templates } = await supabase
  .from("task_templates")
  .select("*")
  .eq("active", true)
  .or(`weekday.is.null,weekday.eq.${weekday}`)
  .order("sort_order", { ascending: true });
      .order("sort_order", { ascending: true });

    if (templateError) {
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Template Error</h1>
          <p>{templateError.message}</p>
        </div>
      );
    }

    if (templates && templates.length > 0) {
      const rowsToInsert = templates.map((task) => ({
        checklist_date: today,
        task_name: task.task_name,
        task_type: task.task_type,
        task_section: task.task_section,
        completed: false,
      }));

      const { error: insertError } = await supabase
        .from("checklist_items")
        .insert(rowsToInsert);

      if (insertError) {
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Insert Error</h1>
            <p>{insertError.message}</p>
          </div>
        );
      }
    }
  }

  const { data, error } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("checklist_date", today)
    .order("id", { ascending: true });

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Supabase Error</h1>
        <p>{error.message}</p>
      </div>
    );
  }

  return <ChecklistClient initialItems={data || []} />;
}