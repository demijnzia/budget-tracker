"use client";

import { useState } from "react";
import { Category } from "@/lib/types";
import { decodeBytes, guessCategoryName, parseInvoiceFile } from "@/lib/einvoice";
import { formatMoney } from "@/lib/utils";

type PreviewRow = {
  invoiceNo: string;
  date: string;
  store: string;
  amount: number;
  categoryId: string;
};

export default function ImportSheet({
  categories,
  onClose,
  onDone,
}: {
  categories: Category[];
  onClose: () => void;
  onDone: (summary: { imported: number; skipped: number }) => void;
}) {
  const expenseCats = categories.filter((c) => c.type === "EXPENSE");
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function fallbackCategoryId(): string {
    return (expenseCats.find((c) => c.name === "Other") ?? expenseCats[0])?.id ?? "";
  }

  async function handleFile(file: File) {
    setError(null);
    setInfo(null);
    setRows([]);
    const parsed = parseInvoiceFile(decodeBytes(await file.arrayBuffer()));
    if (!parsed.headerFound || parsed.rows.length === 0) {
      setError(
        "No invoices found in that file. Export your carrier invoices from the e-invoice website and choose the downloaded file."
      );
      return;
    }
    setRows(
      parsed.rows.map((r) => {
        const guess = expenseCats.find((c) => c.name === guessCategoryName(r.store));
        return { ...r, categoryId: guess?.id ?? fallbackCategoryId() };
      })
    );
    const notes = [];
    if (parsed.voided) notes.push(`${parsed.voided} cancelled invoice(s) left out`);
    if (parsed.unreadable) notes.push(`${parsed.unreadable} line(s) couldn't be read`);
    setInfo(notes.length ? notes.join(". ") + "." : null);
  }

  async function handleImport() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/transactions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: rows.map((r) => ({
            invoiceNo: r.invoiceNo,
            date: r.date,
            amount: r.amount,
            note: r.store,
            categoryId: r.categoryId,
          })),
        }),
      });
      if (!res.ok) throw new Error();
      onDone(await res.json());
    } catch {
      setError("Couldn't import those invoices. Check your connection and try again.");
      setBusy(false);
    }
  }

  const total = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button aria-label="Close" className="absolute inset-0 bg-ink/40 dark:bg-black/60" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-paper dark:bg-paper-dark rounded-t-2xl sm:rounded-2xl border-t sm:border border-rule dark:border-rule-dark px-5 pt-5 pb-6 max-h-[90vh] overflow-y-auto">
        <h2 className="font-serif text-lg font-semibold text-ink dark:text-paper mb-1">
          Import e-invoices
        </h2>
        <p className="text-sm text-ink-soft dark:text-rule mb-4">
          Choose the carrier invoice file you downloaded from the e-invoice website. Each invoice
          becomes an expense, and invoices you imported before are skipped.
        </p>

        <input
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="block w-full text-sm text-ink dark:text-paper mb-4 file:mr-3 file:rounded-lg file:border file:border-rule file:bg-transparent file:px-3 file:py-2 file:text-ink dark:file:text-paper"
        />

        {error && <p className="text-debit text-sm mb-3">{error}</p>}
        {info && <p className="text-ink-soft dark:text-rule text-sm mb-3">{info}</p>}

        {rows.length > 0 && (
          <>
            <p className="text-sm text-ink dark:text-paper mb-2">
              {rows.length} invoices, total{" "}
              <span className="font-mono tabular">{formatMoney(Math.round(total * 100))}</span>. Change a
              category if the guess is wrong.
            </p>
            <ul className="divide-y divide-rule dark:divide-rule-dark border-y border-rule dark:border-rule-dark mb-4">
              {rows.map((r, i) => (
                <li key={r.invoiceNo || i} className="flex items-center gap-2 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-ink dark:text-paper">{r.store}</div>
                    <div className="text-xs text-ink-soft dark:text-rule font-mono">{r.date}</div>
                  </div>
                  <select
                    aria-label={`Category for ${r.store}`}
                    value={r.categoryId}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((p, j) => (j === i ? { ...p, categoryId: e.target.value } : p))
                      )
                    }
                    className="bg-transparent border border-rule dark:border-rule-dark rounded-md px-1 py-1 text-xs text-ink dark:text-paper max-w-[7.5rem]"
                  >
                    {expenseCats.map((c) => (
                      <option key={c.id} value={c.id} className="text-ink">
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <span className="font-mono tabular text-debit w-20 text-right flex-shrink-0">
                    {formatMoney(Math.round(r.amount * 100))}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-rule dark:border-rule-dark text-ink dark:text-paper text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || rows.length === 0}
            onClick={handleImport}
            className="flex-1 py-2.5 rounded-lg bg-ink dark:bg-paper text-paper dark:text-ink text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "Importing…" : rows.length ? `Import ${rows.length} invoices` : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
