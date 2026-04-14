"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const TEA_FACTS = [
  {
    category: "Tea Fact",
    text: "Green tea and black tea come from the same plant. The difference is how the leaves are processed.",
  },
  {
    category: "Health Note",
    text: "Tea contains antioxidants that may support heart health and reduce inflammation.",
  },
  {
    category: "Brewing Tip",
    text: "Green tea should be brewed at lower temperatures to avoid bitterness.",
  },
  {
    category: "Tea History",
    text: "Tea was discovered in China over 4,000 years ago.",
  },
  {
    category: "Customer Tip",
    text: "Herbal teas are naturally caffeine-free and great for evening relaxation.",
  },
  {
    category: "Global",
    text: "Tea is the second most consumed beverage in the world.",
  },
];

type ChecklistItem = {
  id: number;
  checklist_date: string;
  task_name: string;
  task_section: string | null;
  completed: boolean;
  employee_initials: string | null;
  completed_at: string | null;
  source_weekday: number | null;
  is_rollover?: boolean | null;
};

type TeamMember = {
  id: string;
  initials: string;
  name: string | null;
  active: boolean;
  sort_order: number;
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

type TaskTemplate = {
  id: number;
  task_name: string;
  task_type: string | null;
  task_section: string | null;
  active: boolean;
  sort_order: number | null;
  weekday: number | null;
};

type ChecklistClientProps = {
  initialItems: ChecklistItem[];
  teamMembers: TeamMember[];
  taskTemplates: TaskTemplate[];
};

const SECTION_ORDER = ["Daily", "Nightly Closing", "Weekly"] as const;

function formatDisplayDate(dateString: string) {
  const date = new Date(`${dateString}T12:00:00`);

  const dayName = date.toLocaleDateString("en-US", {
    weekday: "long",
  });

  const month = date.toLocaleDateString("en-US", {
    month: "long",
  });

  const day = date.getDate();

  const getOrdinal = (n: number) => {
    if (n > 3 && n < 21) return "th";

    switch (n % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  return `🌿 ${dayName}, ${month} ${day}${getOrdinal(day)}`;
}

const getTeaFactForToday = (offset = 0) => {
  const today = new Date().toISOString().slice(0, 10);
  const baseIndex = new Date(today).getDate() % TEA_FACTS.length;
  const index = (baseIndex + offset) % TEA_FACTS.length;
  return TEA_FACTS[index];
};

export default function ChecklistClient({
  initialItems,
  teamMembers,
}: ChecklistClientProps) {
  const [teaFactOffset, setTeaFactOffset] = useState(0);
  const todayFact = getTeaFactForToday(teaFactOffset);

  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [toastMessage, setToastMessage] = useState("");
  const [bigPraiseMessage, setBigPraiseMessage] = useState("");
  const [completionEntryCount, setCompletionEntryCount] = useState(0);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [celebrationTheme, setCelebrationTheme] = useState<CelebrationTheme>({
    border: "border-green-400",
    text: "text-green-300",
    bg: "bg-slate-900/95",
  });

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Daily: false,
    "Nightly Closing": false,
    Weekly: false,
  });

  const visibleTeamMembers = useMemo(() => {
    return [...teamMembers]
      .filter((member) => member.active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [teamMembers]);

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

  const hourInEastern = Number(
    now.toLocaleString("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      hour12: false,
    })
  );

  const accentStyles = [
    { symbol: "🍃", color: "text-green-300" },
    { symbol: "✦", color: "text-amber-300" },
    { symbol: "❈", color: "text-lime-300" },
    { symbol: "✷", color: "text-rose-300" },
    { symbol: "✺", color: "text-sky-300" },
    { symbol: "❋", color: "text-emerald-300" },
  ];

  const accentIndex =
    Number(
      now.toLocaleDateString("en-US", {
        timeZone: "America/New_York",
        day: "numeric",
      })
    ) % accentStyles.length;

  const todayAccent = accentStyles[accentIndex];
  const checklistDate = today;
  const isReadOnly = false;

  const totalTasks = items.length;
  const completedTasks = items.filter((item) => item.completed).length;
  const incompleteTasks = totalTasks - completedTasks;

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
    { border: "border-green-400", text: "text-green-300", bg: "bg-slate-900/95" },
    { border: "border-blue-400", text: "text-blue-300", bg: "bg-slate-900/95" },
    { border: "border-amber-400", text: "text-amber-300", bg: "bg-slate-900/95" },
    { border: "border-purple-400", text: "text-purple-300", bg: "bg-slate-900/95" },
    { border: "border-pink-400", text: "text-pink-300", bg: "bg-slate-900/95" },
  ];

  const playCelebrationSound = () => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

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
      // ignore audio issues
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
      celebrationThemes[Math.floor(Math.random() * celebrationThemes.length)];

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
      celebrationThemes[Math.floor(Math.random() * celebrationThemes.length)];
    const randomMessage =
      completionMessages[Math.floor(Math.random() * completionMessages.length)];

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
    if (!previousItem) return;

    const cleanedInitials = initialsValue.toUpperCase().trim();
    const isCompleted = cleanedInitials.length > 0;
    const completedAt = isCompleted ? new Date().toISOString() : null;
    const previousItems = items;

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

    const becameCompleted = !previousItem.completed && isCompleted;

    if (
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

    const { error } = await supabase
      .from("checklist_items")
      .update({
        employee_initials: cleanedInitials || null,
        completed: isCompleted,
        completed_at: completedAt,
      })
      .eq("id", id);

    if (error) {
      setItems(previousItems);
      alert(`Could not save initials: ${error.message}`);
      console.error("Failed to update checklist item:", error);
    }
  };

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
    if (section === "Daily") return "text-blue-200";
    if (section === "Nightly Closing") return "text-amber-200";
    if (section === "Weekly") return "text-green-200";
    return "text-slate-100";
  };

  const getSectionGlow = (section: string) => {
    if (section === "Daily") return "shadow-blue-950/40";
    if (section === "Nightly Closing") return "shadow-amber-950/40";
    if (section === "Weekly") return "shadow-green-950/40";
    return "shadow-black/30";
  };

  const getSectionBorder = (section: string) => {
    if (section === "Daily") return "border-blue-400/25";
    if (section === "Nightly Closing") return "border-amber-300/25";
    if (section === "Weekly") return "border-green-400/25";
    return "border-white/10";
  };

  const getTabGlow = (section: string, isOpen: boolean) => {
    if (!isOpen) return "shadow-black/20";
    if (section === "Daily") return "shadow-blue-500/25";
    if (section === "Nightly Closing") return "shadow-amber-400/25";
    if (section === "Weekly") return "shadow-green-500/25";
    return "shadow-white/20";
  };

  const getTabOpenBackground = (section: string, isOpen: boolean) => {
    if (!isOpen) return "bg-white/10";
    if (section === "Daily") return "bg-blue-500/15";
    if (section === "Nightly Closing") return "bg-amber-400/15";
    if (section === "Weekly") return "bg-green-500/15";
    return "bg-white/15";
  };

  const getCompletedTextColor = (section: string | null) => {
    if (section === "Daily") return "text-blue-200";
    if (section === "Nightly Closing") return "text-amber-200";
    if (section === "Weekly") return "text-green-200";
    return "text-slate-100";
  };

  const getCompletedCardColor = (item: ChecklistItem) => {
    if (item.task_section === "Weekly" && item.is_rollover) {
      return item.completed
        ? "border-red-300/40 bg-red-500/10"
        : "border-red-400/50 bg-red-500/12";
    }

    if (!item.completed) {
      return "border-white/10 bg-white/5";
    }

    if (item.task_section === "Daily") return "border-blue-300/25 bg-blue-500/10";
    if (item.task_section === "Nightly Closing") {
      return "border-amber-300/25 bg-amber-400/10";
    }
    if (item.task_section === "Weekly") return "border-green-300/25 bg-green-500/10";
    return "border-white/10 bg-white/5";
  };

  const getSelectedMemberButtonClasses = (section: string | null) => {
    if (section === "Daily") {
      return "border-blue-300 bg-blue-500 text-white scale-105 shadow-lg shadow-blue-900/30";
    }
    if (section === "Nightly Closing") {
      return "border-amber-200 bg-amber-400 text-slate-950 scale-105 shadow-lg shadow-amber-900/30";
    }
    if (section === "Weekly") {
      return "border-green-300 bg-green-500 text-white scale-105 shadow-lg shadow-green-900/30";
    }
    return "border-slate-300 bg-slate-300 text-slate-950 scale-105";
  };

  return (
    <main className="relative min-h-screen overflow-hidden text-slate-100">
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

        @keyframes background-breathe {
          0% {
            transform: scale(1) translate3d(0, 0, 0);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.04) translate3d(0, -6px, 0);
            opacity: 1;
          }
          100% {
            transform: scale(1) translate3d(0, 0, 0);
            opacity: 0.9;
          }
        }

        @keyframes orb-drift-left {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(-12px, 10px, 0) scale(1.05);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes orb-drift-right {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(12px, -10px, 0) scale(1.05);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
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

        .background-breathe {
          animation: background-breathe 18s ease-in-out infinite;
          transform-origin: center;
          will-change: transform, opacity;
        }

        .orb-drift-left {
          animation: orb-drift-left 22s ease-in-out infinite;
          will-change: transform;
        }

        .orb-drift-right {
          animation: orb-drift-right 26s ease-in-out infinite;
          will-change: transform;
        }
      `}</style>

      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="background-breathe absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900" />
        <div className="orb-drift-left absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_40%)]" />
        <div className="orb-drift-right absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_40%)]" />
      </div>

      <div className="relative z-10">
        <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/55 px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-2">
              <span className={`text-lg ${todayAccent.color}`}>
                {todayAccent.symbol}
              </span>

              <h1 className="text-3xl font-bold text-slate-50 drop-shadow-sm">
                Tupelo Tea Checklist
              </h1>

              <span className={`text-lg ${todayAccent.color}`}>
                {todayAccent.symbol}
              </span>
            </div>

            <p className="text-slate-300">
              Tap your initials to complete each task
            </p>

            <div className="mt-2 text-sm text-slate-300">
              {formatDisplayDate(checklistDate)}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="/manager"
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 shadow-lg shadow-black/20 backdrop-blur-md transition hover:bg-white/15"
              >
                History
              </a>

              <a
                href="/manage-tasks"
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 shadow-lg shadow-black/20 backdrop-blur-md transition hover:bg-white/15"
              >
                Edit Tasks
              </a>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/10 px-4 py-2 text-center shadow-xl shadow-black/20 backdrop-blur-xl">
                <div className="text-sm font-medium text-slate-300">Total Tasks</div>
                <div className="mt-0.5 text-2xl font-bold text-slate-50">
                  {totalTasks}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 px-4 py-2 text-center shadow-xl shadow-black/20 backdrop-blur-xl">
                <div className="text-sm font-medium text-slate-300">Completed</div>
                <div className="mt-0.5 text-2xl font-bold text-green-300">
                  {completedTasks}
                </div>
              </div>

              <a
                href="#checklist-sections"
                className="rounded-3xl border border-white/10 bg-white/10 px-4 py-2 text-center shadow-xl shadow-black/20 backdrop-blur-xl transition hover:bg-white/15"
              >
                <div className="text-sm font-medium text-slate-300">Incomplete</div>
                <div className="mt-0.5 text-2xl font-bold text-red-300">
                  {incompleteTasks}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Jump to checklist
                </div>
              </a>
            </div>
          </div>
        </div>

        <div
          id="checklist-sections"
          className="mx-auto max-w-5xl space-y-8 px-4 py-6"
        >
          <div className="rounded-3xl border border-amber-300/30 bg-amber-500/10 p-4 shadow-xl shadow-black/15 backdrop-blur-xl">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <div className="text-lg font-semibold text-amber-200">
                ☕ Today’s Tea Fact
              </div>

              <div className="flex items-center gap-2">
                <div className="rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
                  {todayFact.category}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setTeaFactOffset((prev) => (prev + 1) % TEA_FACTS.length)
                  }
                  className="rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200 transition hover:bg-amber-400/20"
                >
                  New Tea Fact
                </button>
              </div>
            </div>

            <div className="text-base text-slate-100">{todayFact.text}</div>

            <div className="mt-2 text-xs text-slate-300">
              A quick tea tip for the team today.
            </div>
          </div>

          {SECTION_ORDER.map((section) => {
            const sectionItems = items
              .filter((item) => item.task_section === section)
              .sort((a, b) => {
                const aRollover = a.is_rollover ? 1 : 0;
                const bRollover = b.is_rollover ? 1 : 0;
                return bRollover - aRollover;
              });

            if (sectionItems.length === 0) return null;

            const stats = getSectionStats(section);
            const remainingCount = sectionItems.filter((item) => !item.completed).length;
            const isSectionComplete =
              sectionItems.length > 0 && remainingCount === 0;

            return (
              <section
                key={section}
                className={`rounded-[28px] border bg-white/10 p-5 shadow-2xl backdrop-blur-2xl ${getSectionBorder(
                  section
                )} ${getSectionGlow(section)}`}
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section)}
                  className={`mb-4 flex w-full items-center justify-between rounded-[22px] border px-4 py-4 text-left text-2xl font-semibold shadow-xl backdrop-blur-xl transition duration-200 hover:-translate-y-[1px] ${getHeaderColor(
                    section
                  )} ${getSectionBorder(section)} ${getTabOpenBackground(
                    section,
                    openSections[section]
                  )} ${getTabGlow(section, openSections[section])}`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm ${
                        openSections[section]
                          ? "border-white/20 bg-white/10"
                          : "border-white/10 bg-black/10"
                      }`}
                    >
                      {openSections[section] ? "▼" : "▶"}
                    </span>

                    <span>{section}</span>
                  </span>

                  <span className="text-sm text-slate-300">
                    {remainingCount} left
                  </span>
                </button>

                <div className="mb-4">
                  <div className="mb-1 flex justify-between text-sm font-medium text-slate-200">
                    <span>Progress</span>
                    <span>
                      {stats.completed} / {stats.total}
                    </span>
                  </div>

                  <div className="h-4 w-full rounded-full bg-slate-900/60">
                    <div
                      className={`h-4 rounded-full transition-all ${getBarColor(
                        section
                      )}`}
                      style={{ width: `${stats.percent}%` }}
                    />
                  </div>
                </div>

                {openSections[section] && (
                  <div className="space-y-4">
                    {section === "Weekly" &&
                      sectionItems.some(
                        (item) => item.is_rollover && !item.completed
                      ) && (
                        <div className="rounded-2xl border border-red-400/45 bg-red-500/12 px-4 py-3 text-sm font-semibold text-red-200">
                          Rolled over from last week — must be completed first.
                        </div>
                      )}

                    {isSectionComplete ? (
                      <div className="rounded-2xl border border-green-400/30 bg-green-500/10 px-4 py-4 text-sm font-semibold text-green-200">
                        {section} complete ✅
                      </div>
                    ) : null}

                    {sectionItems.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-3xl border p-4 shadow-lg shadow-black/15 backdrop-blur-xl ${getCompletedCardColor(
                          item
                        )}`}
                      >
                        {section === "Weekly" && item.is_rollover && (
                          <div className="mb-3 inline-flex rounded-full border border-red-300/40 bg-red-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-200">
                            {item.completed
                              ? "Rolled Over · Completed"
                              : "Rolled Over · High Priority"}
                          </div>
                        )}

                        <div className="text-xl font-semibold text-slate-50">
                          {item.task_name}
                        </div>

                        <div className="mt-4 flex flex-col gap-4">
                          <div
                            className={`text-lg font-medium ${
                              item.completed
                                ? getCompletedTextColor(item.task_section)
                                : "text-slate-100"
                            }`}
                          >
                            {item.completed ? "Completed" : "Not completed"}
                          </div>

                          {item.completed && item.employee_initials && (
                            <div className="text-sm text-slate-300">
                              Completed by: {item.employee_initials}
                            </div>
                          )}

                          {item.completed && item.completed_at && (
                            <div className="text-sm text-slate-300">
                              Completed at:{" "}
                              {new Date(item.completed_at).toLocaleString()}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-3">
                            {visibleTeamMembers.map((member) => {
                              const isSelected =
                                item.employee_initials === member.initials;

                              return (
                                <button
                                  key={member.id}
                                  type="button"
                                  title={member.name || member.initials}
                                  disabled={isReadOnly}
                                  onClick={() =>
                                    updateInitials(
                                      item.id,
                                      isSelected ? "" : member.initials
                                    )
                                  }
                                  className={`flex h-16 w-16 items-center justify-center rounded-full border-2 text-xl font-bold tracking-wide transition-all ${
                                    isSelected
                                      ? getSelectedMemberButtonClasses(
                                          item.task_section
                                        )
                                      : "border-white/10 bg-white/10 text-slate-100 shadow-lg shadow-black/10 backdrop-blur-md hover:bg-white/15"
                                  } ${isReadOnly ? "opacity-70" : ""}`}
                                >
                                  {member.initials}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-green-400/25 bg-slate-900/90 px-4 py-3 text-sm font-medium text-green-300 shadow-2xl shadow-black/30 backdrop-blur-xl">
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
                } backdrop-blur-xl`}
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
      </div>
    </main>
  );
}