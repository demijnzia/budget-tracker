"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import MonthNav from "@/components/MonthNav";
import TrendChart, { MonthPoint } from "@/components/TrendChart";
import { formatMoney, iconFor } from "@/lib/utils";

type Report = {
  months: MonthPoint[];
  days: { date: string; total: number }[];
  categories: { name: string; icon: string; color: string; total: number }[];
};

const monthIndex = (y: number, m: number) => y * 12 + m;

export default function ReportsPage() {
  const now = new Date();
  const [sel, setSel] = useState({ year: now.getFullYear(), month: now.getMonth() });
  // The chart shows 12 months ending here. It only moves when you pick a month outside it.
  const [end, setEnd] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = useCallback(
    (year: number, month: number) => {
      setSel({ year, month });
      const idx = monthIndex(year, month);
      const endIdx = monthIndex(end.year, end.month);
      if (idx > endIdx) setEnd({ year, month });
      else if (idx < endIdx - 11) {
        const first = idx + 11;
        setEnd({ year: Math.floor(first / 12), month: first % 12 });
      }
    },
    [end]
  );

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetch(
      `/api/reports?year=${sel.year}&month=${sel.month}&endYear=${end.year}&endMonth=${end.month}`
    )
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => !cancelled && setReport(data))
      .catch(() => !cancelled && setError("Couldn't load the report. Check the database connection and try again."));
    return () => {
      cancelled = true;
    };
  }, [sel, end]);

  const monthTotal = report ? report.categories.reduce((s, c) => s + c.total, 0) : 0;
  const label = new Date(sel.year, sel.month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const weekday = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short" });
  };

  return (
    <main className="min-h-screen ledger-bg">
      <div className="max-w-2xl mx-auto px-4 pb-16 pt-6">
        <header className="flex items-baseline justify-between mb-5">
          <h1 className="font-serif text-2xl font-semibold text-ink dark:text-paper">Spending report</h1>
          <Link
            href="/"
            className="text-xs uppercase tracking-wide text-ink-soft dark:text-rule border border-rule dark:border-rule-dark rounded-full px-3 py-1.5 hover:border-ink dark:hover:border-paper transition-colors"
          >
            Back to ledger
          </Link>
        </header>

        <div className="bg-card dark:bg-card-dark border border-rule dark:border-rule-dark rounded-2xl px-4 py-4 mb-5">
          <MonthNav year={sel.year} month={sel.month} onChange={choose} />
        </div>

        {error && (
          <div className="bg-debit/10 border border-debit/30 text-debit text-sm rounded-xl px-4 py-3 mb-5">
            {error}
          </div>
        )}

        {!error && !report && (
          <p className="text-center text-ink-soft dark:text-rule py-10 text-sm">Loading…</p>
        )}

        {report && (
          <div className="flex flex-col gap-5">
            <section className="bg-card dark:bg-card-dark border border-rule dark:border-rule-dark rounded-2xl px-4 py-4">
              <h2 className="font-serif text-lg font-semibold text-ink dark:text-paper">
                Monthly spending
              </h2>
              <p className="text-sm text-ink-soft dark:text-rule mb-3">
                Last 12 months. Tap a bar to see that month below.
              </p>
              <TrendChart
                months={report.months}
                selected={sel}
                onSelect={(y, m) => choose(y, m)}
              />
            </section>

            <section className="bg-card dark:bg-card-dark border border-rule dark:border-rule-dark rounded-2xl px-4 py-4">
              <h2 className="font-serif text-lg font-semibold text-ink dark:text-paper mb-2">
                Spending by category, {label}
              </h2>
              {report.categories.length === 0 ? (
                <p className="text-sm text-ink-soft dark:text-rule py-4">
                  No expenses in {label}. Pick another month or add entries on the ledger page.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-ink-soft dark:text-rule border-b border-ink dark:border-paper">
                        <th className="py-2 font-medium">Category</th>
                        <th className="py-2 font-medium text-right">Total</th>
                        <th className="py-2 font-medium text-right w-40">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.categories.map((c) => {
                        const pct = monthTotal ? (c.total / monthTotal) * 100 : 0;
                        return (
                          <tr key={c.name} className="border-b border-rule dark:border-rule-dark">
                            <td className="py-2.5">
                              <span className="inline-flex items-center gap-2 text-ink dark:text-paper">
                                <span
                                  className="w-7 h-7 flex items-center justify-center rounded-full text-sm"
                                  style={{ backgroundColor: `${c.color}22` }}
                                >
                                  {iconFor(c.icon)}
                                </span>
                                {c.name}
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-mono tabular text-ink dark:text-paper">
                              {formatMoney(c.total)}
                            </td>
                            <td className="py-2.5 pl-3">
                              <div className="flex items-center justify-end gap-2">
                                <span className="hidden sm:block h-1.5 w-16 rounded-full bg-rule dark:bg-rule-dark overflow-hidden">
                                  <span
                                    className="block h-full rounded-full"
                                    style={{ width: `${pct}%`, backgroundColor: c.color }}
                                  />
                                </span>
                                <span className="font-mono tabular text-ink-soft dark:text-rule w-14 text-right">
                                  {pct.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="font-semibold text-ink dark:text-paper">
                        <td className="py-2.5">Total</td>
                        <td className="py-2.5 text-right font-mono tabular">{formatMoney(monthTotal)}</td>
                        <td className="py-2.5 text-right font-mono tabular">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </section>

            <section className="bg-card dark:bg-card-dark border border-rule dark:border-rule-dark rounded-2xl px-4 py-4">
              <h2 className="font-serif text-lg font-semibold text-ink dark:text-paper mb-2">
                Daily spending, {label}
              </h2>
              {report.days.length === 0 ? (
                <p className="text-sm text-ink-soft dark:text-rule py-4">
                  No expenses in {label}.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-ink-soft dark:text-rule border-b border-ink dark:border-paper">
                      <th className="py-2 font-medium">Date</th>
                      <th className="py-2 font-medium text-right">Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.days.map((d) => (
                      <tr key={d.date} className="border-b border-rule dark:border-rule-dark">
                        <td className="py-2 text-ink dark:text-paper">
                          <span className="font-mono tabular">{d.date}</span>
                          <span className="ml-2 text-ink-soft dark:text-rule">{weekday(d.date)}</span>
                        </td>
                        <td className="py-2 text-right font-mono tabular text-debit">
                          {formatMoney(d.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold text-ink dark:text-paper">
                      <td className="py-2.5">
                        Total ({report.days.length} {report.days.length === 1 ? "day" : "days"} with spending)
                      </td>
                      <td className="py-2.5 text-right font-mono tabular">{formatMoney(monthTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
