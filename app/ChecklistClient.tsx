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
  employee_name: string | null;
  employee_initials: string | null;
  completed_at: string | null;
};

export default function ChecklistClient({
  initialItems,
}: {
  initialItems: ChecklistItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const updateItem = (
    id: number,
    field: keyof ChecklistItem,
    value: string | boolean | null
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const saveItem = async (item: ChecklistItem) => {
    setSavingId(item.id);
    setMessage("");

    const completedAt = item.completed ? new Date().toISOString() : null;

    const { error } = await supabase
      .from("checklist_items")
      .update({
        completed: item.completed,
        employee_initials: item.employee_initials,
        completed_at: completedAt,
      })
      .eq("id", item.id);

    if (error) {
      setMessage(`Error saving "${item.task_name}"`);
    } else {
      setMessage(`Saved: ${item.task_name}`);
      updateItem(item.id, "completed_at", completedAt);
    }

    setSavingId(null);
  };

  const sections = ["Daily", "Nightly Closing", "Weekly"];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-bold">Tupelo Tea Checklist</h1>
          <p className="text-base md:text-lg text-gray-600 mt-1">
            Check off tasks and add employee initials
          </p>

          {message && (
            <div className="mt-3 rounded-xl border bg-green-50 px-4 py-3 text-base">
              {message}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8">
        <div className="space-y-8">
          {sections.map((section) => {
            const sectionItems = items.filter(
              (item) => item.task_section === section
            );

            if (sectionItems.length === 0) return null;

            return (
              <section
                key={section}
                className="rounded-3xl border bg-white p-4 shadow-sm md:p-6"
              >
                <h2 className="text-2xl md:text-3xl font-semibold mb-5">
                  {section}
                </h2>

                <div className="space-y-4">
                  {sectionItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border bg-gray-50 p-4 md:p-5"
                    >
                      <div className="text-xl md:text-2xl font-semibold leading-snug">
                        {item.task_name}
                      </div>

                      <div className="text-sm md:text-base text-gray-600 mt-1 mb-4">
                        {item.checklist_date}
                      </div>

                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <label className="flex items-center gap-3 text-lg md:text-xl font-medium">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={(e) =>
                              updateItem(item.id, "completed", e.target.checked)
                            }
                            className="h-7 w-7 md:h-8 md:w-8"
                          />
                          <span>Completed</span>
                        </label>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                            className="h-12 md:h-14 w-32 md:w-36 rounded-xl border bg-white px-4 text-lg md:text-xl"
                            maxLength={5}
                          />

                          <button
                            onClick={() => saveItem(item)}
                            disabled={savingId === item.id}
                            className="h-12 md:h-14 rounded-xl border bg-white px-6 text-lg md:text-xl font-medium shadow-sm"
                          >
                            {savingId === item.id ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 text-base md:text-lg text-gray-700">
                        Status: {item.completed ? "Completed" : "Not completed"}
                      </div>

                      {item.completed_at && (
                        <div className="mt-1 text-sm md:text-base text-gray-500">
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
      </div>
    </main>
  );
}