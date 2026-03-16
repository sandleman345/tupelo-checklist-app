"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

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
    if (section === "Daily") return "text-blue-600";
    if (section === "Nightly Closing") return "text-amber-600";
    if (section === "Weekly") return "text-green-600";
    return "text-gray-700";
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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
        <h1 className="text-3xl font-bold">Tupelo Tea Checklist</h1>
        <p className="text-gray-600">Check tasks and enter initials</p>

        <div className="mt-2 text-sm text-gray-500">
          Checklist Date: {checklistDate}
        </div>

        {isReadOnly && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This checklist is from a previous day and is now read-only.
          </div>
        )}

        <div className="mt-3">
          <a
            href="/manager"
            className="inline-flex items-center rounded-xl border bg-white px-4 py-2 text-base font-medium shadow-sm"
          >
            Manager View
          </a>
        </div>

        <div className="mt-5 space-y-4">
          {sections.map((section) => {
            const stats = getSectionStats(section);
            if (stats.total === 0) return null;

            return (
              <div key={section}>
                <div className="mb-1 flex justify-between text-sm text-gray-600">
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
                    className={`h-4 rounded-full transition-all ${getColor(
                      section
                    )}`}
                    style={{ width: `${stats.percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-6">
        {sections.map((section) => {
          const sectionItems = items.filter(
            (item) => item.task_section === section
          );

          if (sectionItems.length === 0) return null;

          return (
            <section key={section} className="rounded-2xl border bg-white p-5">
              <button
                type="button"
                onClick={() => toggleSection(section)}
                className={`mb-4 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-2xl font-semibold ${getHeaderColor(
                  section
                )}`}
              >
                <span>
                  {openSections[section] ? "▼" : "▶"}{" "}
                  {section === "Weekly"
                    ? `Weekly (${getWeekday()})`
                    : section}
                </span>

                <span className="text-sm text-gray-500">
                  {sectionItems.length} tasks
                </span>
              </button>

              {openSections[section] ? (
                <div className="space-y-4">
                  {sectionItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border bg-gray-50 p-4"
                    >
                      <div className="text-xl font-semibold">
                        {item.task_name}
                      </div>

                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <label className="flex items-center gap-3 text-lg">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            disabled={isReadOnly}
                            onChange={(e) =>
                              updateItem(item.id, "completed", e.target.checked)
                            }
                            className="h-7 w-7"
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
                          className="w-28 rounded-lg border px-3 py-2 text-lg disabled:bg-gray-100"
                          maxLength={5}
                        />
                      </div>

                      <div className="mt-3 text-gray-600">
                        Status: {item.completed ? "Completed" : "Not completed"}
                      </div>

                      {item.completed_at && (
                        <div className="text-sm text-gray-500">
                          Completed at:{" "}
                          {new Date(item.completed_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </main>
  );
}