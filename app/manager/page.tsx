"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ChecklistHistoryItem = {
  id: number;
  checklist_date: string;
  task_name: string;
  task_section: string | null;
  completed: boolean;
  employee_initials: string | null;
  completed_at: string | null;
  is_rollover?: boolean | null;
};

function formatDisplayDate(dateString: string) {
  const date = new Date(`${dateString}T12:00:00`);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getTodayEastern() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });
}

export default function ManagerPage() {
  const today = getTodayEastern();

  const [selectedDate, setSelectedDate] = useState(today);
  const [items, setItems] = useState<ChecklistHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [managerNoteText, setManagerNoteText] = useState("");
  const [isNoteActive, setIsNoteActive] = useState(true);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteStatus, setNoteStatus] = useState("");

  useEffect(() => {
    const loadPageData = async () => {
      setLoading(true);

      const { data: checklistItems, error: checklistError } = await supabase
        .from("checklist_items")
        .select("*")
        .eq("checklist_date", selectedDate)
        .order("task_section", { ascending: true })
        .order("id", { ascending: true });

      if (checklistError) {
        console.error("Error loading manager checklist history:", checklistError);
        setItems([]);
      } else {
        setItems(checklistItems ?? []);
      }

      const { data: managerNote, error: noteError } = await supabase
        .from("manager_notes")
        .select("*")
        .eq("note_date", selectedDate)
        .maybeSingle();

      if (noteError) {
        console.error("Error loading manager note:", noteError);
        setManagerNoteText("");
        setIsNoteActive(true);
      } else {
        setManagerNoteText(managerNote?.note_text ?? "");
        setIsNoteActive(managerNote?.is_active ?? true);
      }

      setLoading(false);
    };

    loadPageData();
  }, [selectedDate]);

  const completedItems = useMemo(() => {
    return items.filter((item) => item.completed);
  }, [items]);

  const employeeTallies = useMemo(() => {
    const tallyMap: Record<string, number> = {};

    completedItems.forEach((item) => {
      const initials = item.employee_initials?.trim().toUpperCase();

      if (!initials) return;

      tallyMap[initials] = (tallyMap[initials] || 0) + 1;
    });

    return Object.entries(tallyMap)
      .map(([initials, count]) => ({ initials, count }))
      .sort((a, b) => b.count - a.count || a.initials.localeCompare(b.initials));
  }, [completedItems]);

  const groupedItems = useMemo(() => {
    return {
      Weekly: items.filter((item) => item.task_section === "Weekly"),
      Daily: items.filter((item) => item.task_section === "Daily"),
      "Nightly Closing": items.filter(
        (item) => item.task_section === "Nightly Closing"
      ),
    };
  }, [items]);

  const saveManagerNote = async () => {
    setNoteSaving(true);
    setNoteStatus("");

    const cleanedText = managerNoteText.trim();

    const { error } = await supabase.from("manager_notes").upsert(
      {
        note_date: selectedDate,
        note_text: cleanedText || null,
        is_active: isNoteActive,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "note_date" }
    );

    if (error) {
      console.error("Error saving manager note:", error);
      setNoteStatus(`Could not save note: ${error.message}`);
      setNoteSaving(false);
      return;
    }

    setNoteStatus("Manager note saved.");
    setNoteSaving(false);
  };

  const sectionOrder = ["Weekly", "Daily", "Nightly Closing"] as const;

  const getSectionBorder = (section: string) => {
    if (section === "Daily") return "border-blue-400/25";
    if (section === "Nightly Closing") return "border-amber-300/25";
    if (section === "Weekly") return "border-green-400/25";
    return "border-white/10";
  };

  const getSectionText = (section: string) => {
    if (section === "Daily") return "text-blue-200";
    if (section === "Nightly Closing") return "text-amber-200";
    if (section === "Weekly") return "text-green-200";
    return "text-slate-100";
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-slate-50">Manager Page</h1>
              <p className="mt-1 text-slate-300">
                Review tasks, employee tallies, and manage the daily note banner.
              </p>
            </div>

            <Link
              href="/"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/15"
            >
              Back to Checklist
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-sky-300/30 bg-sky-500/10 p-5 shadow-xl shadow-black/15 backdrop-blur-xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xl font-semibold text-sky-200">
                Daily Manager Note
              </div>
              <div className="mt-1 text-sm text-slate-300">
                This note appears in the banner on the checklist page for the selected day.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-300">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-slate-100 outline-none"
              />
            </div>
          </div>

          <textarea
            value={managerNoteText}
            onChange={(e) => setManagerNoteText(e.target.value)}
            rows={4}
            placeholder="Type today's note for the team..."
            className="w-full rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-slate-100 outline-none placeholder:text-slate-400"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={isNoteActive}
                onChange={(e) => setIsNoteActive(e.target.checked)}
                className="h-4 w-4"
              />
              Show this note on checklist
            </label>

            <button
              type="button"
              onClick={saveManagerNote}
              disabled={noteSaving}
              className="rounded-2xl border border-sky-300/30 bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-500/30 disabled:opacity-70"
            >
              {noteSaving ? "Saving..." : "Save Manager Note"}
            </button>
          </div>

          {noteStatus && (
            <div className="mt-3 text-sm text-sky-100">{noteStatus}</div>
          )}
        </div>

        <div className="rounded-3xl border border-emerald-300/25 bg-emerald-500/10 p-5 shadow-xl shadow-black/15 backdrop-blur-xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xl font-semibold text-emerald-200">
                Employee Initials Report
              </div>
              <div className="mt-1 text-sm text-slate-300">
                Completed task totals for {formatDisplayDate(selectedDate)}.
              </div>
            </div>

            <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-slate-200">
              Completed: {completedItems.length} / {items.length}
            </div>
          </div>

          {loading ? (
            <div className="text-slate-300">Loading tallies...</div>
          ) : employeeTallies.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-slate-300">
              No completed tasks with initials for this date yet.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {employeeTallies.map((employee) => (
                <div
                  key={employee.initials}
                  className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-2xl font-bold text-emerald-100">
                      {employee.initials}
                    </div>

                    <div className="rounded-full border border-emerald-300/30 bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-200">
                      {employee.count} tasks
                    </div>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-300/70"
                      style={{
                        width: `${Math.max(
                          8,
                          Math.round((employee.count / completedItems.length) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl shadow-black/15 backdrop-blur-xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xl font-semibold text-slate-50">
                Task History for {formatDisplayDate(selectedDate)}
              </div>
              <div className="mt-1 text-sm text-slate-300">
                Completed tasks show initials and time stamps.
              </div>
            </div>

            <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-slate-200">
              Total tasks: {items.length}
            </div>
          </div>

          {loading ? (
            <div className="text-slate-300">Loading...</div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-slate-300">
              No checklist items found for this date.
            </div>
          ) : (
            <div className="space-y-6">
              {sectionOrder.map((section) => {
                const sectionItems = groupedItems[section];
                if (!sectionItems.length) return null;

                return (
                  <section
                    key={section}
                    className={`rounded-3xl border p-4 ${getSectionBorder(
                      section
                    )} bg-white/5`}
                  >
                    <div
                      className={`mb-4 text-lg font-semibold ${getSectionText(
                        section
                      )}`}
                    >
                      {section}
                    </div>

                    <div className="space-y-3">
                      {sectionItems.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="text-base font-semibold text-slate-50">
                                {item.task_name}
                              </div>

                              {item.is_rollover && section === "Weekly" && (
                                <div className="mt-2 inline-flex rounded-full border border-red-300/40 bg-red-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-200">
                                  Rolled Over
                                </div>
                              )}
                            </div>

                            <div
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                item.completed
                                  ? "border border-green-300/30 bg-green-500/15 text-green-200"
                                  : "border border-amber-300/30 bg-amber-400/15 text-amber-200"
                              }`}
                            >
                              {item.completed ? "Completed" : "Not completed"}
                            </div>
                          </div>

                          <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                            <div>Initials: {item.employee_initials || "—"}</div>
                            <div>
                              Completed at:{" "}
                              {item.completed_at
                                ? new Date(item.completed_at).toLocaleString()
                                : "—"}
                            </div>
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
      </div>
    </main>
  );
}