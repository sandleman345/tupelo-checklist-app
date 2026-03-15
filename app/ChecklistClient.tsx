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

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const progressPercent = totalCount
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  const sections = ["Daily", "Nightly Closing", "Weekly"];

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

        <div className="mt-4">
          <div className="mb-1 flex justify-between text-sm text-gray-600">
            <span>Daily Progress</span>
            <span>
              {completedCount} / {totalCount}
            </span>
          </div>

          <div className="h-4 w-full rounded-full bg-gray-200">
            <div
              className="h-4 rounded-full bg-green-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
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
              <h2 className="mb-4 text-2xl font-semibold">{section}</h2>

              <div className="space-y-4">
                {sectionItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border bg-gray-50 p-4"
                  >
                    <div className="text-xl font-semibold">{item.task_name}</div>

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
            </section>
          );
        })}
      </div>
    </main>
  );
}