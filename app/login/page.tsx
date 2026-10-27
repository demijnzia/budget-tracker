"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await createClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setError("That email or password isn't right. Check both and try again.");
      setBusy(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen ledger-bg flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-card dark:bg-card-dark border border-rule dark:border-rule-dark rounded-2xl px-5 py-6"
      >
        <h1 className="font-serif text-2xl font-semibold text-ink dark:text-paper mb-1">Ledger</h1>
        <p className="text-sm text-ink-soft dark:text-rule mb-5">Sign in to see your entries.</p>

        <label className="block mb-4">
          <span className="text-xs text-ink-soft dark:text-rule">Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full bg-transparent border-b-2 border-rule dark:border-rule-dark focus:border-ink dark:focus:border-paper outline-none text-ink dark:text-paper py-1.5"
          />
        </label>
        <label className="block mb-5">
          <span className="text-xs text-ink-soft dark:text-rule">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full bg-transparent border-b-2 border-rule dark:border-rule-dark focus:border-ink dark:focus:border-paper outline-none text-ink dark:text-paper py-1.5"
          />
        </label>

        {error && (
          <p role="alert" className="text-debit text-sm mb-4">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 rounded-lg bg-ink dark:bg-paper text-paper dark:text-ink text-sm font-semibold disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
