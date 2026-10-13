"use client";

import { formatMoney } from "@/lib/utils";

export type CategorySlice = {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  total: number;
};

export default function CategoryDonut({
  slices,
  totalLabel,
  totalValue,
}: {
  slices: CategorySlice[];
  totalLabel: string;
  totalValue: number;
}) {
  const size = 220;
  const stroke = 26;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const grandTotal = slices.reduce((s, c) => s + c.total, 0);

  let offsetAccum = 0;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-rule dark:text-rule-dark"
            strokeWidth={stroke}
          />
          {grandTotal > 0 &&
            slices.map((s) => {
              const fraction = s.total / grandTotal;
              const dash = fraction * circumference;
              const gap = circumference - dash;
              const dashoffset = -offsetAccum;
              offsetAccum += dash;
              return (
                <circle
                  key={s.categoryId}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={dashoffset}
                  strokeLinecap="butt"
                />
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <span className="text-xs uppercase tracking-wide text-ink-soft dark:text-rule">
            {totalLabel}
          </span>
          <span className="font-mono tabular text-xl font-semibold text-ink dark:text-paper mt-1">
            {formatMoney(totalValue)}
          </span>
        </div>
      </div>

      {slices.length > 0 && (
        <ul className="w-full grid grid-cols-2 gap-x-4 gap-y-2">
          {slices.map((s) => {
            const pct = grandTotal > 0 ? Math.round((s.total / grandTotal) * 1000) / 10 : 0;
            return (
              <li key={s.categoryId} className="flex items-center gap-2 text-sm min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="truncate text-ink dark:text-paper">{s.name}</span>
                <span className="ml-auto font-mono tabular text-ink-soft dark:text-rule flex-shrink-0">
                  {pct}%
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
