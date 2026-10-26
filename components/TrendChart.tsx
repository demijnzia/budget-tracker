"use client";

import { formatMoney } from "@/lib/utils";

export type MonthPoint = { year: number; month: number; total: number };

function niceMax(value: number): { max: number; step: number } {
  if (value <= 0) return { max: 100, step: 25 };
  const rough = value / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const frac = rough / pow;
  const step = (frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10) * pow;
  return { max: Math.ceil(value / step) * step, step };
}

export default function TrendChart({
  months,
  selected,
  onSelect,
}: {
  months: MonthPoint[];
  selected: { year: number; month: number };
  onSelect: (year: number, month: number) => void;
}) {
  const W = 640;
  const H = 260;
  const left = 52;
  const right = 12;
  const top = 16;
  const bottom = 32;
  const plotW = W - left - right;
  const plotH = H - top - bottom;

  const peak = Math.max(0, ...months.map((m) => m.total / 100));
  const { max, step } = niceMax(peak);
  const ticks: number[] = [];
  for (let v = 0; v <= max + 0.001; v += step) ticks.push(v);

  const slot = plotW / months.length;
  const barW = Math.min(34, slot * 0.62);
  const y = (v: number) => top + plotH - (v / max) * plotH;

  const label = (m: MonthPoint) =>
    new Date(m.year, m.month, 1).toLocaleDateString(undefined, { month: "short" });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label="Monthly spending for the last 12 months"
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

      {months.map((m, i) => {
        const cx = left + slot * i + slot / 2;
        const h = (m.total / 100 / max) * plotH;
        const isSel = m.year === selected.year && m.month === selected.month;
        return (
          <g
            key={`${m.year}-${m.month}`}
            role="button"
            tabIndex={0}
            aria-label={`${label(m)} ${m.year}: ${formatMoney(m.total)}`}
            aria-pressed={isSel}
            onClick={() => onSelect(m.year, m.month)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(m.year, m.month);
              }
            }}
            className="cursor-pointer outline-none focus-visible:[&>rect:first-child]:stroke-gold"
          >
            {/* wide invisible target so thin bars are easy to tap */}
            <rect x={cx - slot / 2} y={top} width={slot} height={plotH + bottom} fill="transparent" />
            <rect
              x={cx - barW / 2}
              y={y(m.total / 100)}
              width={barW}
              height={Math.max(h, m.total > 0 ? 2 : 0)}
              rx={2}
              className={isSel ? "fill-gold" : "fill-ink-soft/40 dark:fill-rule/50"}
            />
            {isSel && m.total > 0 && (
              <text
                x={cx}
                y={y(m.total / 100) - 6}
                textAnchor="middle"
                className="fill-ink dark:fill-paper"
                fontSize={11}
                fontWeight={600}
                fontFamily="var(--font-mono)"
              >
                {Math.round(m.total / 100).toLocaleString()}
              </text>
            )}
            <text
              x={cx}
              y={H - 10}
              textAnchor="middle"
              className={isSel ? "fill-ink dark:fill-paper" : "fill-ink-soft dark:fill-rule"}
              fontSize={11}
              fontWeight={isSel ? 600 : 400}
            >
              {label(m)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
