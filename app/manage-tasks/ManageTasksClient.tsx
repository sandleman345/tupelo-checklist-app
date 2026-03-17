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
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const weekday = now.getDay();

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
      <a href="/" className="rounded-xl border px-4 py-2 text-sm">
        Checklist
      </a>

      <a href="/manager" className="rounded-xl border px-4 py-2 text-sm">
        Manager
      </a>

      <button
        onClick={regenerateTodayChecklist}
        disabled={isRegenerating}
        className={`rounded-xl border px-4 py-2 text-sm ${
          isRegenerating
            ? "bg-gray-200 text-gray-500"
            : "bg-blue-50 hover:bg-blue-100"
        }`}
      >
        {isRegenerating ? "Regenerating..." : "Regenerate Today"}
      </button>
    </div>
  );

  return (
    <AppShell
      title="Manage Tasks"
      subtitle="Edit and organize checklist tasks"
      rightSlot={navButtons}
    >
      {message && (
        <div className="mb-4 rounded-xl border bg-white px-4 py-2">
          {message}
        </div>
      )}

      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-xl border bg-white p-4">
            <input
              value={task.task_name}
              onChange={(e) =>
                updateLocalTask(task.id, "task_name", e.target.value)
              }
              className="w-full border px-3 py-2"
            />

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => saveTask(task)}
                className="border px-3 py-1"
              >
                Save
              </button>

              <button
                onClick={() => deleteTask(task.id)}
                className="border px-3 py-1 text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}