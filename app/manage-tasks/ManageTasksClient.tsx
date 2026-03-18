"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/LogoutButton";
import AutoLogout from "@/components/AutoLogout";

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
  const [isRegenerating, setIsRegenerating] = useState(false);

  const [originalNames, setOriginalNames] = useState<Record<number, string>>(
    Object.fromEntries(initialTasks.map((t) => [t.id, t.task_name]))
  );

  const [newTask, setNewTask] = useState({
    task_name: "",
    task_section: "Daily",
    sort_order: initialTasks.length + 1,
    weekday: "",
  });

  const getEasternTodayAndWeekday = () => {
    const now = new Date();

    const today = now.toLocaleDateString("en-CA", {
      timeZone: "America/New_York",
    });

    const weekdayName = now.toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
    });

    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    return {
      today,
      weekday: weekdayMap[weekdayName],
    };
  };

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
    const { today } = getEasternTodayAndWeekday();

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
      setMessage(`Error saving ${task.task_name}`);
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
      setMessage("Saved template, but could not update today's checklist.");
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

    const { error } = await supabase
      .from("task_templates")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage("Error deleting task");
      return;
    }

    setTasks((prev) => prev.filter((t) => t.id !== id));
    setMessage(`Deleted: ${task?.task_name}`);
  };

  const addTask = async () => {
    if (!newTask.task_name.trim()) {
      setMessage("Enter a task name.");
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
      [...prev, data as TaskTemplate].sort(
        (a, b) => a.sort_order - b.sort_order
      )
    );

    setNewTask({
      task_name: "",
      task_section: "Daily",
      sort_order: tasks.length + 2,
      weekday: "",
    });

    setMessage(`Added: ${data.task_name}`);
  };

  const regenerateTodayChecklist = async () => {
    if (isRegenerating) return;

    const confirmed = window.confirm(
      "This will erase today's checklist and rebuild it. Continue?"
    );

    if (!confirmed) return;

    setIsRegenerating(true);
    setMessage("Regenerating...");

    try {
      const { today, weekday } = getEasternTodayAndWeekday();

      await supabase
        .from("checklist_items")
        .delete()
        .eq("checklist_date", today);

      const { data: templates } = await supabase
        .from("task_templates")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });

      const filtered = templates?.filter((task) => {
        if (task.task_section !== "Weekly") return true;
        return task.weekday === weekday;
      });

      const rows = filtered?.map((task) => ({
        checklist_date: today,
        task_name: task.task_name,
        task_type: task.task_type,
        task_section: task.task_section,
        completed: false,
        employee_initials: null,
        completed_at: null,
      }));

      await supabase.from("checklist_items").insert(rows || []);

      setMessage("Checklist regenerated!");

      setTimeout(() => {
        window.location.href = "/";
      }, 800);
    } finally {
      setIsRegenerating(false);
    }
  };

  const navButtons = (
    <div className="flex flex-wrap gap-2">
      <a
        href="/"
        className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 shadow-sm hover:bg-slate-800"
      >
        Checklist
      </a>

      <a
        href="/manager"
        className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 shadow-sm hover:bg-slate-800"
      >
        History
      </a>

      <LogoutButton />

      <button
        onClick={regenerateTodayChecklist}
        disabled={isRegenerating}
        className={`rounded-xl border px-4 py-2 text-sm font-medium shadow-sm ${
          isRegenerating
            ? "cursor-not-allowed border-slate-700 bg-slate-800 text-slate-500"
            : "border-blue-700 bg-blue-950/40 text-blue-200 hover:bg-blue-900/50"
        }`}
      >
        {isRegenerating ? "Regenerating..." : "Regenerate Today"}
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-50">Edit Tasks</h1>
            <p className="mt-1 text-slate-300">
              Edit and organize checklist tasks
            </p>
          </div>
          {navButtons}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <AutoLogout />

        {message && (
          <div className="mb-4 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100">
            {message}
          </div>
        )}

        <section className="mb-6 rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-sm sm:p-5">
          <h2 className="mb-4 text-xl font-semibold text-slate-50 sm:text-2xl">
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
              className="rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-400"
            />

            <select
              value={newTask.task_section}
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, task_section: e.target.value }))
              }
              className="rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
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
              className="rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
            />

            <select
              value={newTask.weekday}
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, weekday: e.target.value }))
              }
              className="rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
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
              className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-2 font-medium text-slate-100 shadow-sm hover:bg-slate-800"
            >
              Add Task
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-sm sm:p-5">
          <h2 className="mb-4 text-xl font-semibold text-slate-50 sm:text-2xl">
            Current Tasks
          </h2>

          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-slate-700 bg-slate-800 p-4"
              >
                <div className="grid gap-4 md:grid-cols-6">
                  <input
                    type="text"
                    value={task.task_name}
                    onChange={(e) =>
                      updateLocalTask(task.id, "task_name", e.target.value)
                    }
                    className="rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 md:col-span-2"
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
                    className="rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
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
                    className="rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
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
                    className="rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
                  >
                    <option value="">Weekday</option>
                    {weekdayOptions.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>

                  <label className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100">
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
                    className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-2 font-medium text-slate-100 shadow-sm hover:bg-slate-700"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="rounded-xl border border-red-700 bg-red-950/40 px-4 py-2 font-medium text-red-300 shadow-sm hover:bg-red-900/50"
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