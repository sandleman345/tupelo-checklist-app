"use client";

export default function ManagerControls() {
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href="/"
        className="rounded-xl border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
      >
        Back to Checklist
      </a>

      <a
        href="/manage-tasks"
        className="rounded-xl border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
      >
        Manage Tasks
      </a>
    </div>
  );
}
