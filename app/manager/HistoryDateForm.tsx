"use client";

import { useEffect, useState } from "react";

type Props = {
  selectedDate: string;
  today: string;
};

export default function HistoryDateForm({ selectedDate, today }: Props) {
  const [dateValue, setDateValue] = useState(selectedDate);

  useEffect(() => {
    setDateValue(selectedDate);
  }, [selectedDate]);

  return (
    <form className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-sm sm:flex-row sm:items-end">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-100">
          Choose Date
        </label>
        <input
          id="history-date"
          type="date"
          name="date"
          value={dateValue}
          max={today}
          onChange={(e) => setDateValue(e.target.value)}
          className="rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
        />
      </div>

      <button
        type="button"
        onClick={() => {
          const input = document.getElementById(
            "history-date"
          ) as HTMLInputElement | null;

          if (!input) return;

          if (typeof input.showPicker === "function") {
            input.showPicker();
          } else {
            input.focus();
            input.click();
          }
        }}
        className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 shadow-sm hover:bg-slate-800"
      >
        Open Calendar
      </button>

      <button
        type="submit"
        className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 shadow-sm hover:bg-slate-800"
      >
        View Date
      </button>
    </form>
  );
}