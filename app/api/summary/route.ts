import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, unauthorized } from "@/lib/auth";
import { monthRange } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));

  if (Number.isNaN(year) || Number.isNaN(month)) {
    return NextResponse.json(
      { error: "year and month query params are required" },
      { status: 400 }
    );
  }

  const { start, end } = monthRange(year, month);

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lt: end } },
    include: { category: true },
  });

  let totalExpense = 0;
  let totalIncome = 0;
  const byCategory = new Map<
    string,
    { categoryId: string; name: string; color: string; icon: string; total: number }
  >();

  for (const t of transactions) {
    if (t.type === "EXPENSE") {
      totalExpense += t.amount;
      const key = t.categoryId;
      const existing = byCategory.get(key);
      if (existing) {
        existing.total += t.amount;
      } else {
        byCategory.set(key, {
          categoryId: t.categoryId,
          name: t.category.name,
          color: t.category.color,
          icon: t.category.icon,
          total: t.amount,
        });
      }
    } else {
      totalIncome += t.amount;
    }
  }

  const categoryBreakdown = Array.from(byCategory.values()).sort((a, b) => b.total - a.total);

  return NextResponse.json({
    totalExpense,
    totalIncome,
    balance: totalIncome - totalExpense,
    categoryBreakdown,
  });
}
