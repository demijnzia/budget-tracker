"use client";

import { useEffect, useState } from "react";
import { Category } from "@/lib/types";
import { CATEGORY_ICONS } from "@/lib/utils";

export default function AddTransactionSheet({
  categories,
  onClose,
  onSubmit,
}: {
  categories: Category[];
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    type: "EXPENSE" | "INCOME";
    note: string;
    date: string;
    categoryId: string;
  }) => Promise<void>;
}) {
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (filtered.length > 0 && !filtered.some((c) => c.id === categoryId)) {
      setCategoryId(filtered[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, categories]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!categoryId) {
      setError("Choose a category.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ amount: parsed, type, note, date, categoryId });
    } catch {
      setError("Couldn't save that entry. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-ink/40 dark:bg-black/60"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full sm:max-w-sm bg-paper dark:bg-paper-dark rounded-t-2xl sm:rounded-2xl border-t sm:border border-rule dark:border-rule-dark px-5 pt-5 pb-6 sm:pb-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="w-10 h-1 bg-rule dark:bg-rule-dark rounded-full mx-auto mb-4 sm:hidden" />
        <h2 className="font-serif text-lg font-semibold text-ink dark:text-paper mb-4">
          New entry
        </h2>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {(["EXPENSE", "INCOME"] as const).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setType(t)}
              className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                type === t
                  ? t === "EXPENSE"
                    ? "bg-debit/10 border-debit text-debit"
                    : "bg-credit/10 border-credit text-credit"
                  : "border-rule dark:border-rule-dark text-ink-soft dark:text-rule"
              }`}
            >
              {t === "EXPENSE" ? "Expense" : "Income"}
            </button>
          ))}
        </div>

        <label className="block mb-4">
          <span className="text-xs uppercase tracking-wide text-ink-soft dark:text-rule">
            Amount
          </span>
          <div className="mt-1 flex items-center border-b-2 border-ink dark:border-paper">
            <span className="font-mono text-xl text-ink-soft dark:text-rule mr-1">$</span>
            <input
              autoFocus
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.00"
              className="font-mono tabular text-2xl w-full bg-transparent outline-none text-ink dark:text-paper placeholder:text-ink-soft/40 py-1"
            />
          </div>
        </label>

        <div className="mb-4">
          <span className="text-xs uppercase tracking-wide text-ink-soft dark:text-rule">
            Category
          </span>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {filtered.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-xs transition-colors ${
                  categoryId === c.id
                    ? "border-gold bg-gold/10 text-ink dark:text-paper"
                    : "border-rule dark:border-rule-dark text-ink-soft dark:text-rule"
                }`}
              >
                <span className="text-lg leading-none">{CATEGORY_ICONS[c.icon] ?? "•"}</span>
                <span className="truncate w-full text-center">{c.name}</span>
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-xs text-ink-soft dark:text-rule mt-2">
              No categories yet for this type. Add one in Categories.
            </p>
          )}
        </div>

        <label className="block mb-4">
          <span className="text-xs uppercase tracking-wide text-ink-soft dark:text-rule">
            Date
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full bg-transparent border-b-2 border-rule dark:border-rule-dark outline-none text-ink dark:text-paper py-1 font-mono"
          />
        </label>

        <label className="block mb-5">
          <span className="text-xs uppercase tracking-wide text-ink-soft dark:text-rule">
            Note (optional)
          </span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. lunch with a friend"
            className="mt-1 w-full bg-transparent border-b-2 border-rule dark:border-rule-dark outline-none text-ink dark:text-paper placeholder:text-ink-soft/40 py-1"
          />
        </label>

        {error && <p className="text-debit text-sm mb-3">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-rule dark:border-rule-dark text-ink dark:text-paper text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || filtered.length === 0}
            className="flex-1 py-2.5 rounded-lg bg-ink dark:bg-paper text-paper dark:text-ink text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save entry"}
          </button>
        </div>
      </form>
    </div>
  );
}
