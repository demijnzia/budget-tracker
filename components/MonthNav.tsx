"use client";

import { monthLabel } from "@/lib/utils";

export default function MonthNav({
  year,
  month,
  onChange,
}: {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}) {
  function shift(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    onChange(y, m);
  }

  const isCurrentMonth = (() => {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() === month;
  })();

  return (
    <div className="flex items-center justify-between">
      <button
        aria-label="Previous month"
        onClick={() => shift(-1)}
        className="w-9 h-9 flex items-center justify-center rounded-full text-ink dark:text-paper hover:bg-ink/5 dark:hover:bg-paper/10 transition-colors"
      >
        ‹
      </button>
      <span className="font-serif text-lg font-semibold text-ink dark:text-paper">
        {monthLabel(year, month)}
        {isCurrentMonth && (
          <span className="ml-2 align-middle text-[10px] font-sans font-medium uppercase tracking-wide text-credit border border-credit/40 rounded-full px-2 py-0.5">
            current
          </span>
        )}
      </span>
      <button
        aria-label="Next month"
        onClick={() => shift(1)}
        className="w-9 h-9 flex items-center justify-center rounded-full text-ink dark:text-paper hover:bg-ink/5 dark:hover:bg-paper/10 transition-colors"
      >
        ›
      </button>
    </div>
  );
}
