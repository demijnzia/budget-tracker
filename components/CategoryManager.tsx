"use client";

import { useState } from "react";
import { Category } from "@/lib/types";
import { CATEGORY_ICONS } from "@/lib/utils";

const ICON_CHOICES = Object.keys(CATEGORY_ICONS).filter((k) => k !== "dot");
const COLOR_CHOICES = [
  "#B3452F",
  "#C9962C",
  "#3B6B4A",
  "#4E7FC2",
  "#8A5A9E",
  "#C24E6B",
  "#3C7A89",
  "#6B7A3B",
];

export default function CategoryManager({
  categories,
  onClose,
  onCreate,
  onDelete,
}: {
  categories: Category[];
  onClose: () => void;
  onCreate: (data: {
    name: string;
    icon: string;
    color: string;
    type: "EXPENSE" | "INCOME";
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICON_CHOICES[0]);
  const [color, setColor] = useState(COLOR_CHOICES[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const shown = categories.filter((c) => c.type === type);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give the category a name.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onCreate({ name: name.trim(), icon, color, type });
      setName("");
    } catch {
      setError("Couldn't add that category — the name may already exist.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-ink/40 dark:bg-black/60"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-sm bg-paper dark:bg-paper-dark rounded-t-2xl sm:rounded-2xl border-t sm:border border-rule dark:border-rule-dark px-5 pt-5 pb-6 sm:pb-5 max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 bg-rule dark:bg-rule-dark rounded-full mx-auto mb-4 sm:hidden" />
        <h2 className="font-serif text-lg font-semibold text-ink dark:text-paper mb-4">
          Categories
        </h2>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {(["EXPENSE", "INCOME"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                type === t
                  ? "border-gold bg-gold/10 text-ink dark:text-paper"
                  : "border-rule dark:border-rule-dark text-ink-soft dark:text-rule"
              }`}
            >
              {t === "EXPENSE" ? "Expense" : "Income"}
            </button>
          ))}
        </div>

        <ul className="mb-5 divide-y divide-rule dark:divide-rule-dark">
          {shown.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-2">
              <span
                className="w-7 h-7 flex items-center justify-center rounded-full text-sm"
                style={{ backgroundColor: `${c.color}22` }}
              >
                {CATEGORY_ICONS[c.icon] ?? "•"}
              </span>
              <span className="text-sm text-ink dark:text-paper flex-1">{c.name}</span>
              <button
                onClick={() => onDelete(c.id)}
                className="text-xs text-ink-soft dark:text-rule hover:text-debit"
              >
                Remove
              </button>
            </li>
          ))}
          {shown.length === 0 && (
            <li className="text-sm text-ink-soft dark:text-rule py-2">No categories yet.</li>
          )}
        </ul>

        <form onSubmit={handleAdd}>
          <span className="text-xs uppercase tracking-wide text-ink-soft dark:text-rule">
            New category
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="mt-1 w-full bg-transparent border-b-2 border-rule dark:border-rule-dark outline-none text-ink dark:text-paper placeholder:text-ink-soft/40 py-1 mb-3"
          />

          <div className="flex flex-wrap gap-1.5 mb-3">
            {ICON_CHOICES.map((k) => (
              <button
                type="button"
                key={k}
                onClick={() => setIcon(k)}
                className={`w-8 h-8 flex items-center justify-center rounded-full border text-sm ${
                  icon === k ? "border-gold bg-gold/10" : "border-rule dark:border-rule-dark"
                }`}
              >
                {CATEGORY_ICONS[k]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {COLOR_CHOICES.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 ${
                  color === c ? "border-ink dark:border-paper" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {error && <p className="text-debit text-sm mb-3">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-ink dark:bg-paper text-paper dark:text-ink text-sm font-semibold disabled:opacity-50"
          >
            Add category
          </button>
        </form>

        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-sm text-ink-soft dark:text-rule"
        >
          Done
        </button>
      </div>
    </div>
  );
}
