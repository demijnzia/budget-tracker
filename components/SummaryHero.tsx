"use client";

import { formatMoney } from "@/lib/utils";

export default function SummaryHero({
  income,
  expense,
}: {
  income: number;
  expense: number;
}) {
  const balance = income - expense;
  const positive = balance >= 0;

  return (
    <div className="text-center py-2">
      <span className="text-xs uppercase tracking-wide text-ink-soft dark:text-rule">
        Balance
      </span>
      <div
        className={`font-mono tabular text-4xl font-bold mt-1 ${
          positive ? "text-credit" : "text-debit"
        }`}
      >
        {positive ? "+" : "−"}
        {formatMoney(Math.abs(balance))}
      </div>
      <div className="flex justify-center gap-8 mt-4">
        <div className="text-left">
          <div className="text-[11px] uppercase tracking-wide text-ink-soft dark:text-rule">
            Income
          </div>
          <div className="font-mono tabular text-credit font-medium">
            {formatMoney(income)}
          </div>
        </div>
        <div className="w-px bg-rule dark:bg-rule-dark" />
        <div className="text-left">
          <div className="text-[11px] uppercase tracking-wide text-ink-soft dark:text-rule">
            Expense
          </div>
          <div className="font-mono tabular text-debit font-medium">
            {formatMoney(expense)}
          </div>
        </div>
      </div>
    </div>
  );
}
