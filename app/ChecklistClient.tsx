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
  const [toastMessage, setToastMessage] = useState("");
  const [bigPraiseMessage, setBigPraiseMessage] = useState("");
  const [completionEntryCount, setCompletionEntryCount] = useState(0);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Daily: false,
    "Nightly Closing": false,
    Weekly: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const now = new Date();

  const today = now.toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });

  const weekdayName = now.toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
  });

  const checklistDate = initialItems[0]?.checklist_date || today;
  const isReadOnly = checklistDate !== today;

  const weeklyMessages = [
    "Nice work!",
    "Thank you!",
    "Weekly task complete!",
    "Great job staying on top of it!",
    "Awesome — that helps a lot.",
    "You’re keeping the shop running strong.",
    "Great attention to detail!",
  ];

  const praiseMessages = [
    "Awesome job!",
    "Way to go!",
    "Fantastic work!",
    "You’re crushing it!",
    "Excellent momentum!",
    "Nice hustle!",
    "Great teamwork!",
    "Outstanding effort!",
    "You’re on fire!",
    "Keep it up!",
    "Boom! Nice work!",
    "That’s how it’s done!",
    "Wonderful job!",
    "Great energy!",
    "Sharp work!",
    "You nailed it!",
    "Super job!",
    "Beautiful work!",
    "Strong finish!",
    "That was excellent!",
    "You’re doing great!",
    "Rockstar move!",
    "Impressive work!",
    "Big win!",
    "Love the consistency!",
    "A job well done!",
    "Great pace!",
    "You’ve got this!",
    "Very nicely done!",
    "Fantastic effort!",
    "That helped a lot!",
    "Amazing attention to detail!",
    "Great follow-through!",
    "Top-notch work!",
    "Excellent focus!",
    "Really well done!",
    "You’re making it happen!",
    "Great consistency!",
    "That’s a win!",
    "Awesome momentum!",
    "You’re unstoppable!",
    "Excellent progress!",
    "Huge help!",
    "That was strong work!",
    "You’re doing awesome!",
    "Fantastic job today!",
    "Great dedication!",
    "Excellent execution!",
    "That looked great!",
    "Powerful work!",
    "Great commitment!",
    "That’s the spirit!",
    "Quality work!",
    "So well done!",
    "You’re shining!",
    "Excellent contribution!",
    "Nice attention to detail!",
    "Great rhythm!",
    "That was smooth!",
    "You handled that perfectly!",
    "Strong effort!",
    "Very impressive!",
    "You’re making a difference!",
    "Keep the streak going!",
    "That’s real teamwork!",
    "Exceptional effort!",
    "Love that energy!",
    "Clean work!",
    "Brilliant job!",
    "Great store pride!",
    "Wonderful effort!",
    "That was a big help!",
    "Excellent follow-up!",
    "High five!",
    "You’re building momentum!",
    "This is great work!",
    "Nice consistency!",
    "That was spot on!",
    "Awesome follow-through!",
    "You’re doing fantastic!",
    "That’s the way!",
    "Perfectly done!",
    "Incredible job!",
    "Strong job today!",
    "Great attention!",
    "You’re really helping!",
    "Impressive pace!",
    "That’s a solid win!",
    "You’ve got real momentum!",
    "Very strong work!",
    "You’re on a roll!",
    "Excellent teamwork!",
    "Great care and effort!",
    "That deserves a cheer!",
    "Phenomenal job!",
    "That was excellent work!",
    "You’re keeping things moving!",
    "What a great job!",
    "That was worth celebrating!",
    "Fantastic teamwork!",
    "Great work out there!",
    "You’re doing an amazing job!",
  ];

  const showWeeklyToast = () => {
    const randomMessage =
      weeklyMessages[Math.floor(Math.random() * weeklyMessages.length)];

    setToastMessage(randomMessage);

    setTimeout(() => {
      setToastMessage("");
    }, 2500);
  };

  const showBigPraise = () => {
    const randomMessage =
      praiseMessages[Math.floor(Math.random() * praiseMessages.length)];

    setBigPraiseMessage(randomMessage);

    setTimeout(() => {
      setBigPraiseMessage("");
    }, 2200);
  };

  const updateInitials = async (id: number, initialsValue: string) => {
    if (isReadOnly) return;

    const previousItem = items.find((item) => item.id === id);

    const cleanedInitials = initialsValue.toUpperCase().trim();
    const isCompleted = cleanedInitials.length > 0;
    const completedAt = isCompleted ? new Date().toISOString() : null;

    const updatedItems = items.map((item) =>
      item.id === id
        ? {
            ...item,
            employee_initials: cleanedInitials || null,
            completed: isCompleted,
            completed_at: completedAt,
          }
        : item
    );

    setItems(updatedItems);

    const becameCompleted =
      previousItem && !previousItem.completed && isCompleted;

    if (
      previousItem &&
      previousItem.task_section === "Weekly" &&
      !previousItem.completed &&
      isCompleted
    ) {
      showWeeklyToast();
    }

    if (becameCompleted) {
      setCompletionEntryCount((prev) => {
        const nextCount = prev + 1;

        if (nextCount % 5 === 0) {
          showBigPraise();
        }

        return nextCount;
      });
    }

    await supabase
      .from("checklist_items")
      .update({
        employee_initials: cleanedInitials || null,
        completed: isCompleted,
        completed_at: completedAt,
      })
      .eq("id", id);
  };

  const sections = ["Daily", "Nightly Closing", "Weekly"];

  const getSectionStats = (section: string) => {
    const sectionItems = items.filter((item) => item.task_section === section);
    const completed = sectionItems.filter((item) => item.completed).length;
    const total = sectionItems.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percent };
  };

  const getBarColor = (section: string) => {
    if (section === "Daily") return "bg-blue-600";
    if (section === "Nightly Closing") return "bg-amber-500";
    if (section === "Weekly") return "bg-green-600";
    return "bg-gray-500";
  };

  const getHeaderColor = (section: string) => {
    if (section === "Daily") return "text-blue-800";
    if (section === "Nightly Closing") return "text-amber-800";
    if (section === "Weekly") return "text-green-800";
    return "text-gray-900";
  };

  const getSectionCardColor = (section: string) => {
    if (section === "Daily") return "bg-blue-50 border-blue-200";
    if (section === "Nightly Closing") return "bg-amber-50 border-amber-200";
    if (section === "Weekly") return "bg-green-50 border-green-200";
    return "bg-white border-gray-200";
  };

  const getCompletedTextColor = (section: string | null) => {
    if (section === "Daily") return "text-blue-800";
    if (section === "Nightly Closing") return "text-amber-800";
    if (section === "Weekly") return "text-green-800";
    return "text-gray-900";
  };

  const getCompletedCardColor = (
    section: string | null,
    completed: boolean
  ) => {
    if (!completed) return "border-gray-200 bg-white";
    if (section === "Daily") return "border-blue-200 bg-blue-50";
    if (section === "Nightly Closing") return "border-amber-200 bg-amber-50";
    if (section === "Weekly") return "border-green-200 bg-green-50";
    return "border-gray-200 bg-gray-50";
  };

  const getWeekday = () => weekdayName;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
        <h1 className="text-3xl font-bold text-gray-900">Tupelo Tea Checklist</h1>
        <p className="text-gray-800">
          Enter initials in Completed By when a task is done
        </p>

        <div className="mt-2 text-sm text-gray-800">
          Checklist Date: {checklistDate}
        </div>

        {isReadOnly && (
          <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            This checklist is from a previous day and is now read-only.
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="/manager"
            className="rounded-xl border bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
          >
            Manager View
          </a>

          <a
            href="/manage-tasks"
            className="rounded-xl border bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
          >
            Manage Tasks
          </a>
        </div>

        <div className="mt-5 space-y-4">
          {sections.map((section) => {
            const stats = getSectionStats(section);
            if (stats.total === 0) return null;

            return (
              <div key={section}>
                <div className="mb-1 flex justify-between text-sm font-medium text-gray-900">
                  <span>
                    {section === "Weekly"
                      ? `Weekly (${getWeekday()}) Progress`
                      : `${section} Progress`}
                  </span>
                  <span>
                    {stats.completed} / {stats.total}
                  </span>
                </div>

                <div className="h-4 w-full rounded-full bg-gray-200">
                  <div
                    className={`h-4 rounded-full transition-all ${getBarColor(
                      section
                    )}`}
                    style={{ width: `${stats.percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-6">
        {sections.map((section) => {
          const sectionItems = items.filter(
            (item) => item.task_section === section
          );

          if (sectionItems.length === 0) return null;

          return (
            <section
              key={section}
              className={`rounded-2xl border p-5 shadow-sm ${getSectionCardColor(
                section
              )}`}
            >
              <button
                type="button"
                onClick={() => toggleSection(section)}
                className={`mb-4 flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left text-2xl font-semibold ${getHeaderColor(
                  section
                )}`}
              >
                <span>
                  {openSections[section] ? "▼" : "▶"}{" "}
                  {section === "Weekly" ? `Weekly (${getWeekday()})` : section}
                </span>

                <span className="text-sm text-gray-800">
                  {sectionItems.length} tasks
                </span>
              </button>

              {openSections[section] ? (
                <div className="space-y-4">
                  {sectionItems.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-4 ${getCompletedCardColor(
                        item.task_section,
                        item.completed
                      )}`}
                    >
                      <div className="text-xl font-semibold text-gray-950">
                        {item.task_name}
                      </div>

                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div
                          className={`text-lg font-medium ${
                            item.completed
                              ? getCompletedTextColor(item.task_section)
                              : "text-gray-900"
                          }`}
                        >
                          {item.completed ? "Completed" : "Not completed"}
                        </div>

                        <input
                          type="text"
                          placeholder="Completed By"
                          value={item.employee_initials || ""}
                          disabled={isReadOnly}
                          onChange={(e) =>
                            updateInitials(item.id, e.target.value)
                          }
                          className="w-36 rounded-xl border border-gray-300 bg-white px-3 py-2 text-lg text-gray-950 disabled:bg-gray-100"
                          maxLength={5}
                        />
                      </div>

                      {item.completed_at && (
                        <div className="mt-3 text-sm text-gray-800">
                          Completed at:{" "}
                          {new Date(item.completed_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900 shadow-lg">
          {toastMessage}
        </div>
      )}

      {bigPraiseMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="mx-6 max-w-2xl rounded-3xl border-2 border-green-300 bg-white px-8 py-8 text-center shadow-2xl">
            <div className="text-3xl font-bold text-green-700 sm:text-5xl">
              {bigPraiseMessage}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}