import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// The id of the signed-in user, or null. Every database query in the API is limited to this id.
export async function getUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export function unauthorized() {
  return NextResponse.json({ error: "Sign in required" }, { status: 401 });
}

// Built-in categories (userId is null) are shared. Custom ones belong to one user.
export function visibleTo(userId: string) {
  return { OR: [{ userId: null }, { userId }] };
}
