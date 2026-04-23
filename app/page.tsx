export const dynamic = "force-dynamic";

import ChecklistClient from "./ChecklistClient";
import { supabase } from "@/lib/supabase";

function getStartOfWeek(dateString: string) {
  const date = new Date(`${dateString}T12:00:00`);
  const day = date.getDay();
  const diff = date.getDate() - day;

  const start = new Date(date);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  return start;
}

function formatDateForDB(date: Date) {
  return date.toISOString().slice(0, 10);
}

function normalizeTaskName(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export default async function Home() {
  const now = new Date();

  const today = now.toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });

  const currentWeekStart = getStartOfWeek(today);
  const currentWeekStartStr = formatDateForDB(currentWeekStart);

  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  const previousWeekStartStr = formatDateForDB(previousWeekStart);

  const { data: existingDailyNightly, error: existingDailyNightlyError } =
    await supabase
      .from("checklist_items")
      .select("*")
      .eq("checklist_date", today)
      .in("task_section", ["Daily", "Nightly Closing"])
      .order("id", { ascending: true });

  if (existingDailyNightlyError) {
    console.error(
      "Error loading daily/nightly checklist items:",
      existingDailyNightlyError.message
    );
  }

  const { data: existingWeekly, error: existingWeeklyError } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("checklist_date", currentWeekStartStr)
    .eq("task_section", "Weekly")
    .order("id", { ascending: true });

  if (existingWeeklyError) {
    console.error(
      "Error loading weekly checklist items:",
      existingWeeklyError.message
    );
  }

  const { data: templates, error: templatesLoadError } = await supabase
    .from("task_templates")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (templatesLoadError) {
    console.error("Error loading task templates:", templatesLoadError.message);
  }

  const safeTemplates = templates ?? [];

  if (!existingDailyNightly || existingDailyNightly.length === 0) {
    const dailyNightlyItemsToInsert = safeTemplates
      .filter(
        (template) =>
          template.task_section === "Daily" ||
          template.task_section === "Nightly Closing"
      )
      .map((template) => ({
        checklist_date: today,
        task_name: template.task_name,
        task_type: template.task_type,
        task_section: template.task_section,
        completed: false,
        employee_initials: null,
        completed_at: null,
        is_rollover: false,
      }));

    if (dailyNightlyItemsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("checklist_items")
        .insert(dailyNightlyItemsToInsert);

      if (insertError) {
        console.error(
          "Error creating today's daily/nightly checklist:",
          insertError.message
        );
      }
    }
  }

  if (!existingWeekly || existingWeekly.length === 0) {
    const { data: previousWeekIncomplete, error: previousWeekError } =
      await supabase
        .from("checklist_items")
        .select("*")
        .eq("checklist_date", previousWeekStartStr)
        .eq("task_section", "Weekly")
        .eq("completed", false);

    if (previousWeekError) {
      console.error(
        "Error loading previous week's unfinished weekly items:",
        previousWeekError.message
      );
    }

    const previousWeekIncompleteItems = previousWeekIncomplete ?? [];

    const rolloverNameSet = new Set(
      previousWeekIncompleteItems.map((item) => normalizeTaskName(item.task_name))
    );

    const activeWeeklyTemplates = safeTemplates.filter(
      (template) => template.task_section === "Weekly"
    );

    const activeWeeklyNameSet = new Set(
      activeWeeklyTemplates.map((template) => normalizeTaskName(template.task_name))
    );

    const weeklyItemsToInsert = [
      ...activeWeeklyTemplates.map((template) => ({
        checklist_date: currentWeekStartStr,
        task_name: template.task_name,
        task_type: template.task_type,
        task_section: template.task_section,
        completed: false,
        employee_initials: null,
        completed_at: null,
        is_rollover: rolloverNameSet.has(normalizeTaskName(template.task_name)),
      })),
      ...previousWeekIncompleteItems
        .filter(
          (item) => !activeWeeklyNameSet.has(normalizeTaskName(item.task_name))
        )
        .map((item) => ({
          checklist_date: currentWeekStartStr,
          task_name: item.task_name,
          task_type: "weekly",
          task_section: "Weekly",
          completed: false,
          employee_initials: null,
          completed_at: null,
          is_rollover: true,
        })),
    ];

    if (weeklyItemsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("checklist_items")
        .insert(weeklyItemsToInsert);

      if (insertError) {
        console.error(
          "Error creating this week's weekly checklist:",
          insertError.message
        );
      }
    }
  }

  const { data: refreshedDailyNightly, error: refreshedDailyNightlyError } =
    await supabase
      .from("checklist_items")
      .select("*")
      .eq("checklist_date", today)
      .in("task_section", ["Daily", "Nightly Closing"])
      .order("id", { ascending: true });

  if (refreshedDailyNightlyError) {
    console.error(
      "Error reloading daily/nightly checklist items:",
      refreshedDailyNightlyError.message
    );
  }

  const { data: refreshedWeekly, error: refreshedWeeklyError } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("checklist_date", currentWeekStartStr)
    .eq("task_section", "Weekly")
    .order("id", { ascending: true });

  if (refreshedWeeklyError) {
    console.error(
      "Error reloading weekly checklist items:",
      refreshedWeeklyError.message
    );
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

  const { data: managerNote, error: managerNoteError } = await supabase
    .from("manager_notes")
    .select("*")
    .eq("note_date", today)
    .eq("is_active", true)
    .maybeSingle();

  if (managerNoteError) {
    console.error("Error loading manager note:", managerNoteError.message);
  }

  const initialItems = [
    ...(refreshedDailyNightly ?? []),
    ...(refreshedWeekly ?? []),
  ];

  return (
    <ChecklistClient
      initialItems={initialItems}
      teamMembers={teamMembers ?? []}
      taskTemplates={taskTemplates ?? []}
      managerNote={managerNote ?? null}
    />
  );
}