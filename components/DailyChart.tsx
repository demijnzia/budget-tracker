"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/utils";

function niceMax(value: number): { max: number; step: number } {
  if (value <= 0) return { max: 100, step: 25 };
  const rough = value / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const frac = rough / pow;
  const step = (frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10) * pow;
  return { max: Math.ceil(value / step) * step, step };
}

export default function DailyChart({
  year,
  month,
  days,
}: {
  year: number;
  month: number;
  days: { date: string; total: number }[]; // total in cents, only days with spending
}) {
  const count = new Date(year, month + 1, 0).getDate();
  const totals = Array.from({ length: count }, () => 0);
  for (const d of days) totals[Number(d.date.slice(8, 10)) - 1] = d.total;

  const peakIdx = totals.reduce((best, v, i) => (v > totals[best] ? i : best), 0);
  const [picked, setPicked] = useState<number | null>(null);
  const sel = picked !== null && picked < count ? picked : totals[peakIdx] > 0 ? peakIdx : null;

  const W = 420;
  const H = 240;
  const left = 52;
  const right = 12;
  const top = 12;
  const bottom = 30;
  const plotW = W - left - right;
  const plotH = H - top - bottom;

  const { max, step } = niceMax(Math.max(0, ...totals.map((t) => t / 100)));
  const ticks: number[] = [];
  for (let v = 0; v <= max + 0.001; v += step) ticks.push(v);

  const slot = plotW / count;
  const barW = Math.max(3, Math.min(18, slot * 0.7));
  const y = (v: number) => top + plotH - (v / max) * plotH;
  const dayName = (i: number) =>
    new Date(year, month, i + 1).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  return (
    <div>
      <p className="text-sm text-ink dark:text-paper mb-2 min-h-5" aria-live="polite">
        {sel !== null ? (
          <>
            {dayName(sel)}:{" "}
            <span className="font-mono tabular font-semibold">{formatMoney(totals[sel])}</span>
          </>
        ) : (
          "No spending this month."
        )}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-[520px] mx-auto h-auto"
        role="img"
        aria-label="Spending for each day of the month"
      >
        {ticks.map((v) => (
          <g key={v}>
            <line
              x1={left}
              x2={W - right}
              y1={y(v)}
              y2={y(v)}
              className="stroke-rule dark:stroke-rule-dark"
              strokeWidth={1}
            />
            <text
              x={left - 8}
              y={y(v) + 4}
              textAnchor="end"
              className="fill-ink-soft dark:fill-rule"
              fontSize={11}
              fontFamily="var(--font-mono)"
            >
              {v.toLocaleString()}
            </text>
          </g>
        ))}

        {totals.map((t, i) => {
          const cx = left + slot * i + slot / 2;
          const h = (t / 100 / max) * plotH;
          const isSel = i === sel;
          const showLabel = i === 0 || (i + 1) % 5 === 0 || i === count - 1;
          return (
            <g
              key={i}
              role="button"
              tabIndex={0}
              aria-label={`${dayName(i)}: ${formatMoney(t)}`}
              aria-pressed={isSel}
              onClick={() => setPicked(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setPicked(i);
                }
              }}
              className="cursor-pointer outline-none focus-visible:[&>rect:first-child]:stroke-gold"
            >
              <rect x={cx - slot / 2} y={top} width={slot} height={plotH + bottom} fill="transparent" />
              <rect
                x={cx - barW / 2}
                y={y(t / 100)}
                width={barW}
                height={Math.max(h, t > 0 ? 2 : 0)}
                rx={1.5}
                className={isSel ? "fill-gold" : "fill-ink-soft/40 dark:fill-rule/50"}
              />
              {showLabel && (
                <text
                  x={cx}
                  y={H - 10}
                  textAnchor="middle"
                  className={isSel ? "fill-ink dark:fill-paper" : "fill-ink-soft dark:fill-rule"}
                  fontSize={11}
                >
                  {i + 1}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
