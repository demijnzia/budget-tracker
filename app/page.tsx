"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import MonthNav from "@/components/MonthNav";
import SummaryHero from "@/components/SummaryHero";
import CategoryDonut, { CategorySlice } from "@/components/CategoryDonut";
import TransactionList from "@/components/TransactionList";
import AddTransactionSheet from "@/components/AddTransactionSheet";
import CategoryManager from "@/components/CategoryManager";
import ImportSheet from "@/components/ImportSheet";
import AccountBar from "@/components/AccountBar";
import { Category, Transaction } from "@/lib/types";

type Summary = {
  totalExpense: number;
  totalIncome: number;
  balance: number;
  categoryBreakdown: CategorySlice[];
};

type View = "expense" | "income";

export default function Home() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view, setView] = useState<View>("expense");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importNote, setImportNote] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [txRes, sumRes, catRes] = await Promise.all([
        fetch(`/api/transactions?year=${year}&month=${month}`),
        fetch(`/api/summary?year=${year}&month=${month}`),
        fetch(`/api/categories`),
      ]);
      if ([txRes, sumRes, catRes].some((r) => r.status === 401)) {
        window.location.href = "/login";
        return;
      }
      if (!txRes.ok || !sumRes.ok || !catRes.ok) throw new Error("Request failed");
      const txData = await txRes.json();
      const sumData = await sumRes.json();
      const catData = await catRes.json();
      setTransactions(txData.transactions);
      setSummary(sumData);
      setCategories(catData.categories);
    } catch {
      setLoadError(
        "Couldn't reach the database. Check that DATABASE_URL is set up (see README)."
      );
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddTransaction(data: {
    amount: number;
    type: "EXPENSE" | "INCOME";
    note: string;
    date: string;
    categoryId: string;
  }) {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed");
    setShowAdd(false);
    await load();
  }

  async function handleEditTransaction(data: {
    amount: number;
    type: "EXPENSE" | "INCOME";
    note: string;
    date: string;
    categoryId: string;
  }) {
    if (!editing) return;
    const res = await fetch(`/api/transactions/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, note: data.note.trim() || null }),
    });
    if (!res.ok) throw new Error("Failed");
    // Show the month the entry now belongs to, in case the date moved.
    const [y, m] = data.date.split("-").map(Number);
    setYear(y);
    setMonth(m - 1);
    setView(data.type === "INCOME" ? "income" : "expense");
    setEditing(null);
    await load();
  }

  async function handleDeleteTransaction(id: string) {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    await load();
  }

  async function handleCreateCategory(data: {
    name: string;
    icon: string;
    color: string;
    type: "EXPENSE" | "INCOME";
  }) {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed");
    await load();
  }

  async function handleDeleteCategory(id: string) {
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    await load();
  }

  const filteredTransactions = transactions.filter((t) =>
    view === "expense" ? t.type === "EXPENSE" : t.type === "INCOME"
  );

  return (
    <main className="min-h-screen ledger-bg">
      <div className="max-w-md mx-auto px-4 pb-28 pt-6">
        <header className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
          <h1 className="font-serif text-2xl font-semibold text-ink dark:text-paper">
            Ledger
          </h1>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/reports"
              className="text-xs uppercase tracking-wide text-ink-soft dark:text-rule border border-rule dark:border-rule-dark rounded-full px-3 py-1.5 hover:border-ink dark:hover:border-paper transition-colors"
            >
              Reports
            </Link>
            <button
              onClick={() => setShowImport(true)}
              className="text-xs uppercase tracking-wide text-ink-soft dark:text-rule border border-rule dark:border-rule-dark rounded-full px-3 py-1.5 hover:border-ink dark:hover:border-paper transition-colors"
            >
              Import invoices
            </button>
            <button
              onClick={() => setShowCategories(true)}
              className="text-xs uppercase tracking-wide text-ink-soft dark:text-rule border border-rule dark:border-rule-dark rounded-full px-3 py-1.5 hover:border-ink dark:hover:border-paper transition-colors"
            >
              Categories
            </button>
          </div>
        </header>

        {importNote && (
          <div
            role="status"
            className="bg-credit/10 border border-credit/30 text-credit text-sm rounded-xl px-4 py-3 mb-5 flex justify-between gap-3"
          >
            <span>{importNote}</span>
            <button aria-label="Dismiss" onClick={() => setImportNote(null)}>
              ✕
            </button>
          </div>
        )}

        <div className="bg-card dark:bg-card-dark border border-rule dark:border-rule-dark rounded-2xl px-4 py-4 mb-5">
          <MonthNav year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
          {summary && <SummaryHero income={summary.totalIncome} expense={summary.totalExpense} />}
        </div>

        {loadError && (
          <div className="bg-debit/10 border border-debit/30 text-debit text-sm rounded-xl px-4 py-3 mb-5">
            {loadError}
          </div>
        )}

        {!loadError && (
          <>
            <div className="flex gap-2 mb-5">
              {(["expense", "income"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    view === v
                      ? v === "expense"
                        ? "bg-debit/10 border-debit text-debit"
                        : "bg-credit/10 border-credit text-credit"
                      : "border-rule dark:border-rule-dark text-ink-soft dark:text-rule"
                  }`}
                >
                  {v === "expense" ? "Expenses" : "Income"}
                </button>
              ))}
            </div>

            {view === "expense" && summary && summary.categoryBreakdown.length > 0 && (
              <div className="bg-card dark:bg-card-dark border border-rule dark:border-rule-dark rounded-2xl px-4 py-6 mb-5">
                <CategoryDonut
                  slices={summary.categoryBreakdown}
                  totalLabel="Total spent"
                  totalValue={summary.totalExpense}
                />
              </div>
            )}

            <section>
              <h2 className="text-xs uppercase tracking-wide text-ink-soft dark:text-rule mb-1 px-1">
                Entries
              </h2>
              {loading ? (
                <p className="text-center text-ink-soft dark:text-rule py-10 text-sm">
                  Loading…
                </p>
              ) : (
                <TransactionList
                  transactions={filteredTransactions}
                  onEdit={setEditing}
                  onDelete={handleDeleteTransaction}
                />
              )}
            </section>
          </>
        )}

        <AccountBar />
      </div>

      <button
        onClick={() => setShowAdd(true)}
        aria-label="Add entry"
        className="fixed bottom-6 right-1/2 translate-x-1/2 sm:right-8 sm:translate-x-0 w-14 h-14 rounded-full bg-ink dark:bg-paper text-paper dark:text-ink text-2xl font-light shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        +
      </button>

      {editing && (
        <AddTransactionSheet
          key={editing.id}
          categories={categories}
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={handleEditTransaction}
          onDelete={async () => {
            const res = await fetch(`/api/transactions/${editing.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed");
            setEditing(null);
            await load();
          }}
        />
      )}

      {showAdd && (
        <AddTransactionSheet
          categories={categories}
          onClose={() => setShowAdd(false)}
          onSubmit={handleAddTransaction}
        />
      )}

      {showImport && (
        <ImportSheet
          categories={categories}
          onClose={() => setShowImport(false)}
          onDone={async ({ imported, replaced }) => {
            setShowImport(false);
            setImportNote(
              `Imported ${imported} invoice${imported === 1 ? "" : "s"}` +
                (replaced ? `. ${replaced} replaced earlier entries.` : ".") +
                " Use the month arrows to see older ones."
            );
            await load();
          }}
        />
      )}

      {showCategories && (
        <CategoryManager
          categories={categories}
          onClose={() => setShowCategories(false)}
          onCreate={handleCreateCategory}
          onDelete={handleDeleteCategory}
        />
      )}
    </main>
  );
}
