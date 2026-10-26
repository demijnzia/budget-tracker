"use client";

import { useState } from "react";
import { Category } from "@/lib/types";
import { ICON_GROUPS, iconFor } from "@/lib/utils";


// Keep just the first emoji if someone pastes or types several.
function firstEmoji(text: string): string {
  const t = text.trim();
  if (!t) return "";
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new (Intl as unknown as { Segmenter: new (l?: string, o?: object) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter(undefined, { granularity: "grapheme" });
    for (const part of seg.segment(t)) return part.segment;
  }
  return Array.from(t)[0] ?? "";
}

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
  const [icon, setIcon] = useState(ICON_GROUPS[0].icons[0]);
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
                {iconFor(c.icon)}
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

          <div className="flex items-center gap-3 mb-2">
            <span
              className="w-10 h-10 flex items-center justify-center rounded-full text-xl border border-gold bg-gold/10"
              aria-label="Chosen icon"
            >
              {icon}
            </span>
            <label className="flex-1 text-xs text-ink-soft dark:text-rule">
              Or type any emoji
              <input
                value=""
                onChange={(e) => {
                  const e1 = firstEmoji(e.target.value);
                  if (e1) setIcon(e1);
                }}
                placeholder="Use your emoji keyboard"
                className="block w-full bg-transparent border-b-2 border-rule dark:border-rule-dark outline-none text-base text-ink dark:text-paper placeholder:text-ink-soft/40 py-1"
              />
            </label>
          </div>

          <div className="max-h-52 overflow-y-auto border border-rule dark:border-rule-dark rounded-lg px-2 py-2 mb-3">
            {ICON_GROUPS.map((g) => (
              <div key={g.label} className="mb-2 last:mb-0">
                <div className="text-xs text-ink-soft dark:text-rule mb-1">{g.label}</div>
                <div className="flex flex-wrap gap-1">
                  {g.icons.map((k) => (
                    <button
                      type="button"
                      key={k}
                      onClick={() => setIcon(k)}
                      aria-label={`Icon ${k}`}
                      className={`w-10 h-10 flex items-center justify-center rounded-full border text-lg ${
                        icon === k ? "border-gold bg-gold/10" : "border-transparent"
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
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
