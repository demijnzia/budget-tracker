"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AccountBar() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="mt-10 pt-4 border-t border-rule dark:border-rule-dark flex items-center justify-between gap-3 text-xs text-ink-soft dark:text-rule">
      <span className="truncate">{email ? `Signed in as ${email}` : "Signed in"}</span>
      <button
        onClick={signOut}
        className="border border-rule dark:border-rule-dark rounded-full px-3 py-1.5 hover:border-ink dark:hover:border-paper transition-colors flex-shrink-0"
      >
        Sign out
      </button>
    </div>
  );
}
