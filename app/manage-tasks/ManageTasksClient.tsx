"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type TaskTemplate = {
  id: number;
  task_name: string;
  task_type: string;
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
  const [newTask, setNewTask] = useState({
    task_name: "",
    task_type: "daily",
    task_section: "Daily",
    sort_order: tasks.length + 1,
    weekday: "",
  });

  const updateLocalTask = (
    id: number,
    field: keyof TaskTemplate,
    value: string | number | boolean | null
  ) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, [field]: value } : task))
    );
  };

  const saveTask = async (task: TaskTemplate) => {
    const { error } = await supabase
      .from("task_templates")
      .update({
        task_name: task.task_name,
        task_type: task.task_type,
        task_section: task.task_section,
        active: task.active,
        sort_order: task.sort_order,
        weekday: task.task_section === "Weekly" ? task.weekday : null,
      })
      .eq("id", task.id);

    setMessage(error ? `Error saving ${task.task_name}` : `Saved: ${task.task_name}`);
  };

  const deleteTask = async (id: number) => {
    const task = tasks.find((t) => t.id === id);
    const { error } = await supabase.from("task_templates").delete().eq("id", id);

    if (!error) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setMessage(`Deleted: ${task?.task_name || "task"}`);
    } else {
      setMessage("Error deleting task");
    }
  };

  const addTask = async () => {
    if (!newTask.task_name.trim()) {
      setMessage("Please enter a task name.");
      return;
    }

    const weekdayValue =
      newTask.task_section === "Weekly" && newTask.weekday !== ""
        ? Number(newTask.weekday)
        : null;

    const { data, error } = await supabase
      .from("task_templates")
      .insert({
        task_name: newTask.task_name,
        task_type: newTask.task_section === "Weekly" ? "weekly" : "daily",
        task_section: newTask.task_section,
        active: true,
        sort_order: Number(newTask.sort_order),
        weekday: weekdayValue,
      })
      .select()
      .single();

    if (error) {
      setMessage("Error adding task");
      return;
    }

    setTasks((prev) =>
      [...prev, data as TaskTemplate].sort((a, b) => a.sort_order - b.sort_order)
    );

    setNewTask({
      task_name: "",
      task_type: "daily",
      task_section: "Daily",
      sort_order: tasks.length + 2,
      weekday: "",
    });

    setMessage(`Added: ${data.task_name}`);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5">
          <h1 className="text-3xl font-bold">Manage Tasks</h1>
          <p className="mt-1 text-gray-600">
            Add, edit, delete, and organize checklist tasks
          </p>

          <div className="mt-3 flex gap-3">
            <a
              href="/"
              className="inline-flex items-center rounded-xl border bg-white px-4 py-2 text-base font-medium shadow-sm"
            >
              Back to Checklist
            </a>

            <a
              href="/manager"
              className="inline-flex items-center rounded-xl border bg-white px-4 py-2 text-base font-medium shadow-sm"
            >
              Manager View
            </a>
          </div>

          {message && (
            <div className="mt-4 rounded-xl border bg-white px-4 py-3 text-sm">
              {message}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="text-2xl font-semibold mb-4">Add New Task</h2>

          <div className="grid gap-4 md:grid-cols-5">
            <input
              type="text"
              placeholder="Task name"
              value={newTask.task_name}
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, task_name: e.target.value }))
              }
              className="rounded-lg border px-3 py-2"
            />

            <select
              value={newTask.task_section}
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, task_section: e.target.value }))
              }
              className="rounded-lg border px-3 py-2"
            >
              <option>Daily</option>
              <option>Nightly Closing</option>
              <option>Weekly</option>
            </select>

            <input
              type="number"
              placeholder="Sort order"
              value={newTask.sort_order}
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, sort_order: Number(e.target.value) }))
              }
              className="rounded-lg border px-3 py-2"
            />

            <select
              value={newTask.weekday}
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, weekday: e.target.value }))
              }
              className="rounded-lg border px-3 py-2"
              disabled={newTask.task_section !== "Weekly"}
            >
              <option value="">Weekday</option>
              {weekdayOptions.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>

            <button
              onClick={addTask}
              className="rounded-lg border bg-white px-4 py-2 font-medium"
            >
              Add Task
            </button>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5">
          <h2 className="text-2xl font-semibold mb-4">Current Tasks</h2>

          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-xl border bg-gray-50 p-4">
                <div className="grid gap-4 md:grid-cols-6">
                  <input
                    type="text"
                    value={task.task_name}
                    onChange={(e) =>
                      updateLocalTask(task.id, "task_name", e.target.value)
                    }
                    className="rounded-lg border px-3 py-2 md:col-span-2"
                  />

                  <select
                    value={task.task_section || ""}
                    onChange={(e) => {
                      const section = e.target.value;
                      updateLocalTask(task.id, "task_section", section);
                      updateLocalTask(
                        task.id,
                        "task_type",
                        section === "Weekly" ? "weekly" : "daily"
                      );
                      if (section !== "Weekly") {
                        updateLocalTask(task.id, "weekday", null);
                      }
                    }}
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
                      updateLocalTask(task.id, "sort_order", Number(e.target.value))
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
                    disabled={task.task_section !== "Weekly"}
                    className="rounded-lg border px-3 py-2"
                  >
                    <option value="">Weekday</option>
                    {weekdayOptions.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>

                  <label className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
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
                    className="rounded-lg border bg-white px-4 py-2 font-medium"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 font-medium text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}