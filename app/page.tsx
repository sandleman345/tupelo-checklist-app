export const dynamic = "force-dynamic";

import ChecklistClient from "./ChecklistClient";
import { supabase } from "@/lib/supabase";

export default async function Home() {
  const now = new Date();

  // ✅ Eastern Time date
  const today = now.toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });

  // ✅ Eastern Time weekday (clean version)
  const weekdayName = now.toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
  });

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const weekday = weekdayMap[weekdayName];

  let { data: items, error } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("checklist_date", today)
    .order("id", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Checklist Error</h1>
          <p className="mt-2 text-gray-800">{error.message}</p>
        </div>
      </main>
    );
  }

  // ✅ AUTO CREATE TODAY'S CHECKLIST
  if (!items || items.length === 0) {
    const { data: templates, error: templateError } = await supabase
      .from("task_templates")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (templateError) {
      return (
        <main className="min-h-screen bg-gray-50 p-6">
          <div className="mx-auto max-w-4xl rounded-2xl border bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">Template Error</h1>
            <p className="mt-2 text-gray-800">{templateError.message}</p>
          </div>
        </main>
      );
    }

    const filteredTemplates = templates?.filter((task) => {
      if (task.task_section !== "Weekly") return true;
      return task.weekday === weekday;
    });

    const rowsToInsert = filteredTemplates?.map((task) => ({
      checklist_date: today,
      task_name: task.task_name,
      task_type: task.task_type,
      task_section: task.task_section,
      completed: false,
      employee_initials: null,
      completed_at: null,
    }));

    const { error: insertError } = await supabase
      .from("checklist_items")
      .insert(rowsToInsert || []);

    if (insertError) {
      return (
        <main className="min-h-screen bg-gray-50 p-6">
          <div className="mx-auto max-w-4xl rounded-2xl border bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">Create Error</h1>
            <p className="mt-2 text-gray-800">{insertError.message}</p>
          </div>
        </main>
      );
    }

    // ✅ Reload after insert
    const reload = await supabase
      .from("checklist_items")
      .select("*")
      .eq("checklist_date", today)
      .order("id", { ascending: true });

    items = reload.data || [];
  }

  return <ChecklistClient initialItems={items || []} />;
}