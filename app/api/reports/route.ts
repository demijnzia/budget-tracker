import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { monthRange } from "@/lib/utils";

// Spending report for one month: total per day and total per category.
// Amounts are in cents. Only expenses are counted.
export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams;
  const year = Number(q.get("year"));
  const month = Number(q.get("month"));

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return NextResponse.json({ error: "year and month are required" }, { status: 400 });
  }

  const { start, end } = monthRange(year, month);
  const expenses = await prisma.transaction.findMany({
    where: { type: "EXPENSE", date: { gte: start, lt: end } },
    include: { category: true },
  });

  const daily = new Map<string, number>();
  const cats = new Map<string, { name: string; icon: string; color: string; total: number }>();

  for (const t of expenses) {
    const day = t.date.toISOString().slice(0, 10);
    daily.set(day, (daily.get(day) ?? 0) + t.amount);
    const c = cats.get(t.categoryId) ?? {
      name: t.category.name,
      icon: t.category.icon,
      color: t.category.color,
      total: 0,
    };
    c.total += t.amount;
    cats.set(t.categoryId, c);
  }

  return NextResponse.json({
    days: Array.from(daily.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    categories: Array.from(cats.values()).sort((a, b) => b.total - a.total),
  });
}
