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
    <main className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Tupelo Tea Checklist</h1>
      <p className="text-sm text-gray-600 mb-6">
        Check off tasks and add employee initials.
      </p>

      {message && (
        <div className="mb-4 rounded-lg border p-3 text-sm">{message}</div>
      )}

      <div className="space-y-8">
        {sections.map((section) => {
          const sectionItems = items.filter(
            (item) => item.task_section === section
          );

          if (sectionItems.length === 0) return null;

          return (
            <section key={section} className="border rounded-2xl p-5 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">{section}</h2>

              <div className="space-y-4">
                {sectionItems.map((item) => (
                  <div key={item.id} className="border rounded-xl p-4">
                    <div className="font-semibold text-lg">{item.task_name}</div>

                    <div className="text-sm text-gray-600 mb-3">
                      {item.task_type} | {item.checklist_date}
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={(e) =>
                            updateItem(item.id, "completed", e.target.checked)
                          }
                        />
                        <span>Completed</span>
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
                        className="border rounded-md px-3 py-2 w-32"
                        maxLength={5}
                      />

                      <button
                        onClick={() => saveItem(item)}
                        disabled={savingId === item.id}
                        className="border rounded-md px-4 py-2"
                      >
                        {savingId === item.id ? "Saving..." : "Save"}
                      </button>
                    </div>

                    <div className="text-sm text-gray-500 mt-3">
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