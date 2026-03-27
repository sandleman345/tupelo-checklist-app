export const dynamic = "force-dynamic";

import ChecklistClient from "./ChecklistClient";
import { supabase } from "@/lib/supabase";

export default async function Home() {
  const now = new Date();

  const today = now.toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });

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

  const currentWeekday = weekdayMap[weekdayName];

  const { data: existingItems, error: existingItemsError } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("checklist_date", today)
    .order("id", { ascending: true });

  if (existingItemsError) {
    console.error("Error loading checklist items:", existingItemsError.message);
  }

  if (!existingItems || existingItems.length === 0) {
    const { data: templates, error: templatesLoadError } = await supabase
      .from("task_templates")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    if (templatesLoadError) {
      console.error("Error loading task templates:", templatesLoadError.message);
    }

    const itemsToInsert =
      templates
        ?.filter((template) => {
          if (template.task_section !== "Weekly") return true;
          return template.weekday === currentWeekday;
        })
        .map((template) => ({
          checklist_date: today,
          task_name: template.task_name,
          task_type: template.task_type,
          task_section: template.task_section,
          completed: false,
          employee_initials: null,
          completed_at: null,
        })) ?? [];

    if (itemsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("checklist_items")
        .insert(itemsToInsert);

      if (insertError) {
        console.error("Error creating today's checklist:", insertError.message);
      }
    }
  }

  const { data: initialItems, error: itemsError } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("checklist_date", today)
    .order("id", { ascending: true });

  if (itemsError) {
    console.error("Error loading checklist items:", itemsError.message);
  }

  const { data: teamMembers, error: teamError } = await supabase
    .from("team_members")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (teamError) {
    console.error("Error loading team members:", teamError.message);
  }

  const { data: taskTemplates, error: templatesError } = await supabase
    .from("task_templates")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (templatesError) {
    console.error("Error loading task templates:", templatesError.message);
  }

  return (
    <ChecklistClient
      initialItems={initialItems ?? []}
      teamMembers={teamMembers ?? []}
      taskTemplates={taskTemplates ?? []}
    />
  );
}