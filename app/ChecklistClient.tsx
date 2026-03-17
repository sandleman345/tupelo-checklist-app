"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/AppShell";

type ChecklistItem = {
  id: number;
  checklist_date: string;
  task_name: string;
  task_section: string | null;
  completed: boolean;
  employee_initials: string | null;
  completed_at: string | null;
};

export default function ChecklistClient({
  initialItems,
}: {
  initialItems: ChecklistItem[];
}) {
  const [items, setItems] = useState(initialItems);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Daily: true,
    "Nightly Closing": false,
    Weekly: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const today = new Date().toISOString().split("T")[0];
  const checklistDate = initialItems[0]?.checklist_date || today;
  const isReadOnly = checklistDate !== today;

  const updateItem = async (
    id: number,
    field: keyof ChecklistItem,
    value: string | boolean | null
  ) => {
    if (isReadOnly) return;

    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );

    setItems(updatedItems);

    const item = updatedItems.find((i) => i.id === id);
    if (!item) return;

    const completedAt = item.completed ? new Date().toISOString() : null;

    await supabase
      .from("checklist_items")
      .update({
        completed: item.completed,
        employee_initials: item.employee_initials,
        completed_at: completedAt,
      })
      .eq("id", id);
  };

  const sections = ["Daily", "Nightly Closing", "Weekly"];

  const getSectionStats = (section: string) => {
    const sectionItems = items.filter((item) => item.task_section === section);
    const completed = sectionItems.filter((item) => item.completed).length;
    const total = sectionItems.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percent };
  };

  const getColor = (section: string) => {
    if (section === "Daily") return "bg-blue-500";
    if (section === "Nightly Closing") return "bg-amber-500";
    if (section === "Weekly") return "bg-green-500";
    return "bg-gray-500";
  };

  const getHeaderColor = (section: string) => {
    if (section === "Daily") return "text-blue-700";
    if (section === "Nightly Closing") return "text-amber-700";
    if (section === "Weekly") return "text-green-700";
    return "text-gray-900";
  };

  const getWeekday = () => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[new Date().getDay()];
  };

  const navButtons = (
    <div className="flex flex-wrap gap-2">
      <a
        href="/manager"
        className="rounded-xl border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
      >
        Manager View
      </a>
      <a
        href="/manage-tasks"
        className="rounded-xl border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
      >
        Manage Tasks
      </a>
    </div>
  );

  return (
    <AppShell
      title="Tupelo Tea Checklist"
      subtitle={`Checklist Date: ${checklistDate}`}
      rightSlot={navButtons}
    >
      {isReadOnly && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This checklist is from a previous day and is now read-only.
        </div>
      )}

      <div className="mb-6 grid gap-4">
        {sections.map((section) => {
          const stats = getSectionStats(section);
          if (stats.total === 0) return null;

          return (
            <div key={section} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between text-sm font-medium text-gray-800">
                <span>
                  {section === "Weekly"
                    ? `Weekly (${getWeekday()}) Progress`
                    : `${section} Progress`}
                </span>
                <span>
                  {stats.completed} / {stats.total}
                </span>
              </div>

              <div className="h-4 w-full rounded-full bg-gray-200">
                <div
                  className={`h-4 rounded-full transition-all ${getColor(section)}`}
                  style={{ width: `${stats.percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-6">
        {sections.map((section) => {
          const sectionItems = items.filter(
            (item) => item.task_section === section
          );

          if (sectionItems.length === 0) return null;

          return (
            <section key={section} className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
              <button
                type="button"
                onClick={() => toggleSection(section)}
                className={`mb-4 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-xl font-semibold sm:text-2xl ${getHeaderColor(
                  section
                )}`}
              >
                <span>
                  {openSections[section] ? "▼" : "▶"}{" "}
                  {section === "Weekly" ? `Weekly (${getWeekday()})` : section}
                </span>

                <span className="text-sm font-medium text-gray-700">
                  {sectionItems.length} tasks
                </span>
              </button>

              {openSections[section] && (
                <div className="space-y-4">
                  {sectionItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border bg-gray-50 p-4"
                    >
                      <div className="text-lg font-semibold text-gray-900 sm:text-xl">
                        {item.task_name}
                      </div>

                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <label className="flex items-center gap-3 text-base font-medium text-gray-900 sm:text-lg">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            disabled={isReadOnly}
                            onChange={(e) =>
                              updateItem(item.id, "completed", e.target.checked)
                            }
                            className="h-6 w-6"
                          />
                          Completed
                        </label>

                        <input
                          type="text"
                          placeholder="Initials"
                          value={item.employee_initials || ""}
                          disabled={isReadOnly}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "employee_initials",
                              e.target.value.toUpperCase()
                            )
                          }
                          className="w-28 rounded-xl border bg-white px-3 py-2 text-base text-gray-900 disabled:bg-gray-100 sm:text-lg"
                          maxLength={5}
                        />
                      </div>

                      <div className="mt-3 text-sm text-gray-800 sm:text-base">
                        Status: {item.completed ? "Completed" : "Not completed"}
                      </div>

                      {item.completed_at && (
                        <div className="mt-1 text-sm text-gray-700">
                          Completed at:{" "}
                          {new Date(item.completed_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}