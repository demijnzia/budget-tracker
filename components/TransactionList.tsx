"use client";

import { Transaction } from "@/lib/types";
import { iconFor, dayLabel, formatMoney } from "@/lib/utils";

export default function TransactionList({
  transactions,
  onEdit,
  onDelete,
}: {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-14 text-ink-soft dark:text-rule">
        <p className="font-serif text-lg">No entries yet.</p>
        <p className="text-sm mt-1">Tap the + button to record your first transaction.</p>
      </div>
    );
  }

  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const key = t.date.slice(0, 10);
    const list = groups.get(key) ?? [];
    list.push(t);
    groups.set(key, list);
  }

  return (
    <div className="divide-y divide-rule dark:divide-rule-dark">
      {Array.from(groups.entries()).map(([dateKey, items]) => {
        const dayTotal = items.reduce(
          (sum, t) => sum + (t.type === "EXPENSE" ? -t.amount : t.amount),
          0
        );
        return (
          <div key={dateKey} className="py-3">
            <div className="flex items-baseline justify-between px-1 mb-1.5">
              <span className="text-xs font-medium text-ink-soft dark:text-rule">
                {dayLabel(dateKey)}
              </span>
              <span
                className={`font-mono tabular text-xs ${
                  dayTotal < 0 ? "text-debit" : "text-credit"
                }`}
              >
                {dayTotal < 0 ? "−" : "+"}
                {formatMoney(Math.abs(dayTotal))}
              </span>
            </div>
            <ul>
              {items.map((t) => (
                <li
                  key={t.id}
                  className="group flex items-center gap-3 px-1 py-2 rounded-md hover:bg-card dark:hover:bg-card-dark transition-colors"
                >
                  <button
                    type="button"
                    aria-label={`Edit ${t.category.name} entry`}
                    onClick={() => onEdit(t)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left"
                  >
                  <span
                    className="w-8 h-8 flex items-center justify-center rounded-full text-sm flex-shrink-0"
                    style={{ backgroundColor: `${t.category.color}22` }}
                  >
                    {iconFor(t.category.icon)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-ink dark:text-paper truncate">
                      {t.category.name}
                    </div>
                    {t.note && (
                      <div className="text-xs text-ink-soft dark:text-rule truncate">
                        {t.note}
                      </div>
                    )}
                  </div>
                  <span
                    className={`font-mono tabular text-sm font-medium flex-shrink-0 ${
                      t.type === "EXPENSE" ? "text-debit" : "text-credit"
                    }`}
                  >
                    {t.type === "EXPENSE" ? "−" : "+"}
                    {formatMoney(t.amount)}
                  </span>
                  </button>
                  <button
                    aria-label="Delete entry"
                    onClick={() => onDelete(t.id)}
                    className="[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus:opacity-100 text-ink-soft dark:text-rule hover:text-debit transition-opacity text-xs px-2 py-2"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
