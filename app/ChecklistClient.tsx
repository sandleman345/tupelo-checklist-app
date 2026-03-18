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

type ConfettiPiece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  rotate: number;
};

type CelebrationTheme = {
  border: string;
  text: string;
  bg: string;
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
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [celebrationTheme, setCelebrationTheme] = useState<CelebrationTheme>({
    border: "border-green-400",
    text: "text-green-300",
    bg: "bg-slate-900",
  });

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

  const hourInEastern = Number(
    now.toLocaleString("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      hour12: false,
    })
  );

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

  const morningPraiseMessages = [
    "Great start to the day!",
    "Morning momentum!",
    "You’re off to a strong start!",
    "Excellent opening energy!",
    "Way to kick things off!",
    "Bright start, great work!",
    "Strong morning pace!",
    "You’re setting the tone!",
    "Fantastic start today!",
    "Nice morning win!",
  ];

  const afternoonPraiseMessages = [
    "Strong momentum!",
    "You’re keeping it moving!",
    "Fantastic pace this afternoon!",
    "You’re doing great out there!",
    "Way to keep the energy up!",
    "Great midday push!",
    "Excellent follow-through!",
    "You’re in the groove!",
    "Nice afternoon win!",
    "Keep it rolling!",
  ];

  const eveningPraiseMessages = [
    "Finishing strong!",
    "Great job closing it out!",
    "Excellent evening effort!",
    "You’re ending the day strong!",
    "Strong finish!",
    "Way to keep pushing!",
    "Fantastic closeout energy!",
    "You’re wrapping this up beautifully!",
    "Great evening momentum!",
    "What a strong finish!",
  ];

  const anytimePraiseMessages = [
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

  const celebrationThemes: CelebrationTheme[] = [
    {
      border: "border-green-400",
      text: "text-green-300",
      bg: "bg-slate-900",
    },
    {
      border: "border-blue-400",
      text: "text-blue-300",
      bg: "bg-slate-900",
    },
    {
      border: "border-amber-400",
      text: "text-amber-300",
      bg: "bg-slate-900",
    },
    {
      border: "border-purple-400",
      text: "text-purple-300",
      bg: "bg-slate-900",
    },
    {
      border: "border-pink-400",
      text: "text-pink-300",
      bg: "bg-slate-900",
    },
  ];

  const playCelebrationSound = () => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;

      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        1320,
        audioContext.currentTime + 0.12
      );

      gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.04,
        audioContext.currentTime + 0.02
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + 0.28
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch {
      // ignore audio failures
    }
  };

  const getSmartPraiseMessage = () => {
    let timeBasedPool = anytimePraiseMessages;

    if (hourInEastern < 12) {
      timeBasedPool = [...morningPraiseMessages, ...anytimePraiseMessages];
    } else if (hourInEastern < 17) {
      timeBasedPool = [...afternoonPraiseMessages, ...anytimePraiseMessages];
    } else {
      timeBasedPool = [...eveningPraiseMessages, ...anytimePraiseMessages];
    }

    return timeBasedPool[Math.floor(Math.random() * timeBasedPool.length)];
  };

  const showWeeklyToast = () => {
    const randomMessage =
      weeklyMessages[Math.floor(Math.random() * weeklyMessages.length)];

    setToastMessage(randomMessage);

    setTimeout(() => {
      setToastMessage("");
    }, 2500);
  };

  const launchConfetti = (count = 28) => {
    const pieces: ConfettiPiece[] = Array.from({ length: count }, (_, index) => ({
      id: Date.now() + index,
      left: Math.random() * 100,
      delay: Math.random() * 0.35,
      duration: 1.8 + Math.random() * 1.4,
      rotate: Math.floor(Math.random() * 360),
    }));

    setConfettiPieces(pieces);

    setTimeout(() => {
      setConfettiPieces([]);
    }, 3200);
  };

  const showBigPraise = () => {
    const randomMessage = getSmartPraiseMessage();
    const randomTheme =
      celebrationThemes[
        Math.floor(Math.random() * celebrationThemes.length)
      ];

    setCelebrationTheme(randomTheme);
    setBigPraiseMessage(randomMessage);
    launchConfetti(28);
    playCelebrationSound();

    setTimeout(() => {
      setBigPraiseMessage("");
    }, 2200);
  };

  const showAllTasksCompletePraise = () => {
    const completionMessages = [
      "🎉 ALL TASKS COMPLETE 🎉",
      "Everything is complete!",
      "Checklist finished — amazing work!",
      "100% complete — fantastic job!",
      "You did it — all tasks are done!",
    ];

    const randomTheme =
      celebrationThemes[
        Math.floor(Math.random() * celebrationThemes.length)
      ];

    const randomMessage =
      completionMessages[
        Math.floor(Math.random() * completionMessages.length)
      ];

    setCelebrationTheme(randomTheme);
    setBigPraiseMessage(randomMessage);
    launchConfetti(42);
    playCelebrationSound();

    setTimeout(() => {
      setBigPraiseMessage("");
    }, 2800);
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

      const allNowCompleted = updatedItems.every((item) => item.completed);
      if (allNowCompleted && updatedItems.length > 0) {
        showAllTasksCompletePraise();
      }
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
    if (section === "Daily") return "bg-blue-500";
    if (section === "Nightly Closing") return "bg-amber-400";
    if (section === "Weekly") return "bg-green-500";
    return "bg-slate-500";
  };

  const getHeaderColor = (section: string) => {
    if (section === "Daily") return "text-blue-300";
    if (section === "Nightly Closing") return "text-amber-300";
    if (section === "Weekly") return "text-green-300";
    return "text-slate-100";
  };

  const getSectionCardColor = (section: string) => {
    if (section === "Daily") return "bg-slate-900 border-blue-900";
    if (section === "Nightly Closing") return "bg-slate-900 border-amber-900";
    if (section === "Weekly") return "bg-slate-900 border-green-900";
    return "bg-slate-900 border-slate-700";
  };

  const getCompletedTextColor = (section: string | null) => {
    if (section === "Daily") return "text-blue-300";
    if (section === "Nightly Closing") return "text-amber-300";
    if (section === "Weekly") return "text-green-300";
    return "text-slate-100";
  };

  const getCompletedCardColor = (
    section: string | null,
    completed: boolean
  ) => {
    if (!completed) return "border-slate-700 bg-slate-800";
    if (section === "Daily") return "border-blue-700 bg-blue-950/60";
    if (section === "Nightly Closing") return "border-amber-700 bg-amber-950/50";
    if (section === "Weekly") return "border-green-700 bg-green-950/50";
    return "border-slate-700 bg-slate-700";
  };

  const getWeekday = () => weekdayName;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <style jsx>{`
        @keyframes praise-pop {
          0% {
            opacity: 0;
            transform: scale(0.86) translateY(14px);
          }
          18% {
            opacity: 1;
            transform: scale(1.04) translateY(0);
          }
          78% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          100% {
            opacity: 0;
            transform: scale(0.96) translateY(-8px);
          }
        }

        @keyframes confetti-fall {
          0% {
            opacity: 0;
            transform: translateY(-20px) rotate(0deg);
          }
          10% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(240px) rotate(540deg);
          }
        }

        .praise-pop {
          animation: praise-pop 2.2s ease-out forwards;
        }

        .all-complete-pop {
          animation: praise-pop 2.8s ease-out forwards;
        }

        .confetti-piece {
          position: absolute;
          top: -10px;
          width: 10px;
          height: 18px;
          border-radius: 3px;
          animation-name: confetti-fall;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }

        .confetti-0 {
          background: #60a5fa;
        }
        .confetti-1 {
          background: #4ade80;
        }
        .confetti-2 {
          background: #fbbf24;
        }
        .confetti-3 {
          background: #f87171;
        }
        .confetti-4 {
          background: #a78bfa;
        }
        .confetti-5 {
          background: #f472b6;
        }
      `}</style>

      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950 px-6 py-4">
        <h1 className="text-3xl font-bold text-slate-50">Tupelo Tea Checklist</h1>
        <p className="text-slate-300">
          Enter initials in Completed By when a task is done
        </p>

        <div className="mt-2 text-sm text-slate-300">
          Checklist Date: {checklistDate}
        </div>

        {isReadOnly && (
          <div className="mt-3 rounded-xl border border-amber-700 bg-amber-950/50 px-4 py-3 text-sm text-amber-200">
            This checklist is from a previous day and is now read-only.
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="/manager"
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 shadow-sm hover:bg-slate-800"
          >
            History
          </a>

          <a
            href="/manage-tasks"
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 shadow-sm hover:bg-slate-800"
          >
            Edit Tasks
          </a>
        </div>

        <div className="mt-5 space-y-4">
          {sections.map((section) => {
            const stats = getSectionStats(section);
            if (stats.total === 0) return null;

            return (
              <div key={section}>
                <div className="mb-1 flex justify-between text-sm font-medium text-slate-100">
                  <span>
                    {section === "Weekly"
                      ? `Weekly (${getWeekday()}) Progress`
                      : `${section} Progress`}
                  </span>
                  <span>
                    {stats.completed} / {stats.total}
                  </span>
                </div>

                <div className="h-4 w-full rounded-full bg-slate-800">
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
                className={`mb-4 flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-left text-2xl font-semibold ${getHeaderColor(
                  section
                )}`}
              >
                <span>
                  {openSections[section] ? "▼" : "▶"}{" "}
                  {section === "Weekly" ? `Weekly (${getWeekday()})` : section}
                </span>

                <span className="text-sm text-slate-300">
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
                      <div className="text-xl font-semibold text-slate-50">
                        {item.task_name}
                      </div>

                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div
                          className={`text-lg font-medium ${
                            item.completed
                              ? getCompletedTextColor(item.task_section)
                              : "text-slate-100"
                          }`}
                        >
                          {item.completed ? "Completed" : "Not completed"}
                        </div>

                        <input
                          type="text"
                          inputMode="text"
                          autoCapitalize="characters"
                          autoCorrect="off"
                          spellCheck={false}
                          placeholder="Completed By"
                          value={item.employee_initials || ""}
                          disabled={isReadOnly}
                          onChange={(e) =>
                            updateInitials(item.id, e.target.value)
                          }
                          className="h-16 w-48 rounded-2xl border-2 border-slate-500 bg-slate-950 px-4 py-3 text-center text-2xl font-bold tracking-widest text-slate-50 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none disabled:bg-slate-800"
                          maxLength={5}
                        />
                      </div>

                      {item.completed_at && (
                        <div className="mt-3 text-sm text-slate-300">
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
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-green-700 bg-slate-900 px-4 py-3 text-sm font-medium text-green-300 shadow-lg">
          {toastMessage}
        </div>
      )}

      {(bigPraiseMessage || confettiPieces.length > 0) && (
        <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-black/30" />

          {confettiPieces.map((piece, index) => (
            <div
              key={piece.id}
              className={`confetti-piece confetti-${index % 6}`}
              style={{
                left: `${piece.left}%`,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
                transform: `rotate(${piece.rotate}deg)`,
              }}
            />
          ))}

          {bigPraiseMessage && (
            <div
              className={`relative mx-6 max-w-2xl rounded-3xl border-2 px-8 py-8 text-center shadow-2xl ${
                bigPraiseMessage.includes("ALL TASKS COMPLETE") ||
                bigPraiseMessage.includes("Everything is complete") ||
                bigPraiseMessage.includes("100% complete")
                  ? `all-complete-pop ${celebrationTheme.border} ${celebrationTheme.bg}`
                  : `praise-pop ${celebrationTheme.border} ${celebrationTheme.bg}`
              }`}
            >
              <div
                className={`text-3xl font-bold sm:text-5xl ${celebrationTheme.text}`}
              >
                {bigPraiseMessage}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}