import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Spending report: 12 monthly totals ending at endYear/endMonth, plus the
// daily totals and per-category totals for the selected month. Amounts are in cents.
export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams;
  const year = Number(q.get("year"));
  const month = Number(q.get("month"));
  const endYear = Number(q.get("endYear") ?? year);
  const endMonth = Number(q.get("endMonth") ?? month);

  if ([year, month, endYear, endMonth].some((n) => !Number.isInteger(n))) {
    return NextResponse.json({ error: "year and month are required" }, { status: 400 });
  }

  const start = new Date(Date.UTC(endYear, endMonth - 11, 1));
  const end = new Date(Date.UTC(endYear, endMonth + 1, 1));

  const expenses = await prisma.transaction.findMany({
    where: { type: "EXPENSE", date: { gte: start, lt: end } },
    include: { category: true },
  });

  const months: { year: number; month: number; total: number }[] = [];
  const index = new Map<string, number>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(endYear, endMonth - i, 1));
    index.set(`${d.getUTCFullYear()}-${d.getUTCMonth()}`, months.length);
    months.push({ year: d.getUTCFullYear(), month: d.getUTCMonth(), total: 0 });
  }

  const daily = new Map<string, number>();
  const cats = new Map<string, { name: string; icon: string; color: string; total: number }>();

  for (const t of expenses) {
    const y = t.date.getUTCFullYear();
    const m = t.date.getUTCMonth();
    const slot = index.get(`${y}-${m}`);
    if (slot !== undefined) months[slot].total += t.amount;

    if (y === year && m === month) {
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
  }

  return NextResponse.json({
    months,
    days: Array.from(daily.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    categories: Array.from(cats.values()).sort((a, b) => b.total - a.total),
  });
}
