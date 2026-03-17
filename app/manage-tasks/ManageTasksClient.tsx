"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type TaskTemplate = {
  id: number;
  task_name: string;
  task_section: string | null;
  active: boolean;
  sort_order: number;
  weekday: number | null;
};

const weekdayOptions = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

export default function ManageTasksClient({
  initialTasks,
}: {
  initialTasks: TaskTemplate[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [message, setMessage] = useState("");

  const updateLocalTask = (
    id: number,
    field: keyof TaskTemplate,
    value: string | number | boolean | null
  ) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const saveTask = async (task: TaskTemplate) => {
    const { error } = await supabase
      .from("task_templates")
      .update(task)
      .eq("id", task.id);

    setMessage(error ? "Error saving" : `Saved: ${task.task_name}`);
  };

  const deleteTask = async (id: number) => {
    await supabase.from("task_templates").delete().eq("id", id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="border-b bg-white px-6 py-5">
        <h1 className="text-3xl font-bold">Manage Tasks</h1>

        <p className="mt-1 text-gray-700">
          Edit and organize checklist tasks
        </p>

        <div className="mt-3 flex gap-3">
          <a
            href="/"
            className="rounded-xl border bg-white px-4 py-2 font-medium"
          >
            Checklist
          </a>

          <a
            href="/manager"
            className="rounded-xl border bg-white px-4 py-2 font-medium"
          >
            Manager
          </a>
        </div>

        {message && (
          <div className="mt-4 rounded-xl border bg-white px-4 py-3 text-gray-800">
            {message}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="rounded-xl border bg-white p-4"
          >
            <input
              value={task.task_name}
              onChange={(e) =>
                updateLocalTask(task.id, "task_name", e.target.value)
              }
              className="w-full rounded-lg border px-3 py-2 text-gray-800"
            />

            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <select
                value={task.task_section || ""}
                onChange={(e) =>
                  updateLocalTask(task.id, "task_section", e.target.value)
                }
                className="rounded-lg border px-3 py-2"
              >
                <option>Daily</option>
                <option>Nightly Closing</option>
                <option>Weekly</option>
              </select>

              <input
                type="number"
                value={task.sort_order}
                onChange={(e) =>
                  updateLocalTask(
                    task.id,
                    "sort_order",
                    Number(e.target.value)
                  )
                }
                className="rounded-lg border px-3 py-2"
              />

              <select
                value={task.weekday ?? ""}
                onChange={(e) =>
                  updateLocalTask(
                    task.id,
                    "weekday",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
                className="rounded-lg border px-3 py-2"
              >
                <option value="">Weekday</option>
                {weekdayOptions.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 text-gray-800">
                <input
                  type="checkbox"
                  checked={task.active}
                  onChange={(e) =>
                    updateLocalTask(task.id, "active", e.target.checked)
                  }
                />
                Active
              </label>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => saveTask(task)}
                className="rounded-lg border px-4 py-2 font-medium"
              >
                Save
              </button>

              <button
                onClick={() => deleteTask(task.id)}
                className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}