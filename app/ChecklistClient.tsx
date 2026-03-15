"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type ChecklistItem = {
  id: number;
  checklist_date: string;
  task_name: string;
  task_type: string;
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
const completedCount = items.filter((item) => item.completed).length;
const totalCount = items.length;
const progressPercent = totalCount
  ? Math.round((completedCount / totalCount) * 100)
  : 0;

  const updateItem = async (
    id: number,
    field: keyof ChecklistItem,
    value: string | boolean | null
  ) => {
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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
        <h1 className="text-3xl font-bold">Tupelo Tea Checklist</h1>
<div className="mt-4">
  <div className="flex justify-between text-sm text-gray-600 mb-1">
    <span>Daily Progress</span>
    <span>
      {completedCount} / {totalCount}
    </span>
  </div>

  <div className="w-full bg-gray-200 rounded-full h-4">
    <div
      className="bg-green-500 h-4 rounded-full transition-all"
      style={{ width: `${progressPercent}%` }}
    ></div>
  </div>
</div>
        <p className="text-gray-600">
          Check tasks and enter initials
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {sections.map((section) => {
          const sectionItems = items.filter(
            (item) => item.task_section === section
          );

          if (sectionItems.length === 0) return null;

          return (
            <section key={section} className="bg-white border rounded-2xl p-5">
              <h2 className="text-2xl font-semibold mb-4">{section}</h2>

              <div className="space-y-4">
                {sectionItems.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-xl p-4 bg-gray-50"
                  >
                    <div className="text-xl font-semibold">
                      {item.task_name}
                    </div>

                    <div className="flex flex-col gap-4 mt-4 sm:flex-row sm:items-center sm:justify-between">

                      <label className="flex items-center gap-3 text-lg">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "completed",
                              e.target.checked
                            )
                          }
                          className="h-7 w-7"
                        />
                        Completed
                      </label>

                      <input
                        type="text"
                        placeholder="Initials"
                        value={item.employee_initials || ""}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "employee_initials",
                            e.target.value.toUpperCase()
                          )
                        }
                        className="border rounded-lg px-3 py-2 text-lg w-28"
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