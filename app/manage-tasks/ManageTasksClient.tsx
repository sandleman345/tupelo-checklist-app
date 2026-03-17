"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/AppShell";

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
  const [originalNames, setOriginalNames] = useState<Record<number, string>>(
    Object.fromEntries(initialTasks.map((task) => [task.id, task.task_name]))
  );

  const [newTask, setNewTask] = useState({
    task_name: "",
    task_section: "Daily",
    sort_order: initialTasks.length + 1,
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
    const today = new Date().toISOString().split("T")[0];
    const oldTaskName = originalNames[task.id] || task.task_name;
    const newTaskType = task.task_section === "Weekly" ? "weekly" : "daily";

    const { error: templateError } = await supabase
      .from("task_templates")
      .update({
        task_name: task.task_name,
        task_type: newTaskType,
        task_section: task.task_section,
        active: task.active,
        sort_order: task.sort_order,
        weekday: task.task_section === "Weekly" ? task.weekday : null,
      })
      .eq("id", task.id);

    if (templateError) {
      setMessage(`Error saving ${task.task_name}: ${templateError.message}`);
      return;
    }

    const { error: checklistError } = await supabase
      .from("checklist_items")
      .update({
        task_name: task.task_name,
        task_type: newTaskType,
        task_section: task.task_section,
      })
      .eq("checklist_date", today)
      .eq("task_name", oldTaskName);

    if (checklistError) {
      setMessage(
        `Saved template, but could not update today's checklist: ${checklistError.message}`
      );
      return;
    }

    setOriginalNames((prev) => ({
      ...prev,
      [task.id]: task.task_name,
    }));

    setMessage(`Saved: ${task.task_name}`);
  };

  const deleteTask = async (id: number) => {
    const task = tasks.find((t) => t.id === id);

    const { error } = await supabase.from("task_templates").delete().eq("id", id);

    if (error) {
      setMessage(`Error deleting task: ${error.message}`);
      return;
    }

    setTasks((prev) => prev.filter((t) => t.id !== id));
    setMessage(`Deleted: ${task?.task_name || "task"}`);
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
      setMessage(`Error adding task: ${error.message}`);
      return;
    }

    const createdTask = data as TaskTemplate;

    setTasks((prev) =>
      [...prev, createdTask].sort((a, b) => a.sort_order - b.sort_order)
    );

    setOriginalNames((prev) => ({
      ...prev,
      [createdTask.id]: createdTask.task_name,
    }));

    setNewTask({
      task_name: "",
      task_section: "Daily",
      sort_order: tasks.length + 2,
      weekday: "",
    });

    setMessage(`Added: ${createdTask.task_name}`);
  };

  const regenerateTodayChecklist = async () => {
    const confirmed = window.confirm(
      "This will erase today's current checklist progress and rebuild it from the templates. Continue?"
    );

    if (!confirmed) return;

    setMessage("Regenerating today's checklist...");

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const weekday = now.getDay();

    const { error: deleteError } = await supabase
      .from("checklist_items")
      .delete()
      .eq("checklist_date", today);

    if (deleteError) {
      setMessage(`Error deleting today's checklist: ${deleteError.message}`);
      return;
    }

    const { data: templates, error: templateError } = await supabase
      .from("task_templates")
      .select("task_name, task_type, task_section, sort_order, weekday")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (templateError) {
      setMessage(`Error loading task templates: ${templateError.message}`);
      return;
    }

    if (!templates || templates.length === 0) {
      setMessage("No active templates found.");
      return;
    }

    const filteredTemplates = templates.filter((task) => {
      if (task.task_section !== "Weekly") return true;
      return task.weekday === weekday;
    });

    const rowsToInsert = filteredTemplates.map((task) => ({
      checklist_date: today,
      task_name: task.task_name,
      task_type: task.task_type,
      task_section: task.task_section,
      completed: false,
      employee_initials: null,
      completed_at: null,
    }));

    const { error: insertError } = await supabase
      .from("checklist_items")
      .insert(rowsToInsert);

    if (insertError) {
      setMessage(`Error rebuilding today's checklist: ${insertError.message}`);
      return;
    }

    setMessage("Today's checklist has been regenerated successfully.");
    window.location.href = "/";
  };

  const navButtons = (
    <div className="flex flex-wrap gap-2">
      <a
        href="/"
        className="rounded-xl border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
      >
        Back to Checklist
      </a>
      <a
        href="/manager"
        className="rounded-xl border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
      >
        Manager View
      </a>
      <button
        onClick={regenerateTodayChecklist}
        className="rounded-xl border bg-blue-50 px-4 py-2 text-sm font-medium shadow-sm hover:bg-blue-100"
      >
        Regenerate Today&apos;s Checklist
      </button>
    </div>
  );

  return (
    <AppShell
      title="Manage Tasks"
      subtitle="Add, edit, delete, and organize checklist tasks"
      rightSlot={navButtons}
    >
      {message && (
        <div className="mb-6 rounded-2xl border bg-white px-4 py-3 text-sm text-gray-900 shadow-sm">
          {message}
        </div>
      )}

      <section className="mb-6 rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 sm:text-2xl">
          Add New Task
        </h2>

        <div className="grid gap-4 md:grid-cols-5">
          <input
            type="text"
            placeholder="Task name"
            value={newTask.task_name}
            onChange={(e) =>
              setNewTask((prev) => ({ ...prev, task_name: e.target.value }))
            }
            className="rounded-xl border px-3 py-2 text-gray-900"
          />

          <select
            value={newTask.task_section}
            onChange={(e) =>
              setNewTask((prev) => ({ ...prev, task_section: e.target.value }))
            }
            className="rounded-xl border px-3 py-2 text-gray-900"
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
              setNewTask((prev) => ({
                ...prev,
                sort_order: Number(e.target.value),
              }))
            }
            className="rounded-xl border px-3 py-2 text-gray-900"
          />

          <select
            value={newTask.weekday}
            onChange={(e) =>
              setNewTask((prev) => ({ ...prev, weekday: e.target.value }))
            }
            className="rounded-xl border px-3 py-2 text-gray-900"
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
            className="rounded-xl border bg-white px-4 py-2 font-medium text-gray-900 shadow-sm hover:bg-gray-50"
          >
            Add Task
          </button>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 sm:text-2xl">
          Current Tasks
        </h2>

        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-2xl border bg-gray-50 p-4">
              <div className="grid gap-4 md:grid-cols-6">
                <input
                  type="text"
                  value={task.task_name}
                  onChange={(e) =>
                    updateLocalTask(task.id, "task_name", e.target.value)
                  }
                  className="rounded-xl border bg-white px-3 py-2 text-gray-900 md:col-span-2"
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
                  className="rounded-xl border bg-white px-3 py-2 text-gray-900"
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
                  className="rounded-xl border bg-white px-3 py-2 text-gray-900"
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
                  className="rounded-xl border bg-white px-3 py-2 text-gray-900"
                >
                  <option value="">Weekday</option>
                  {weekdayOptions.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>

                <label className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-gray-900">
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

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => saveTask(task)}
                  className="rounded-xl border bg-white px-4 py-2 font-medium text-gray-900 shadow-sm hover:bg-gray-50"
                >
                  Save
                </button>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 font-medium text-red-700 shadow-sm hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}