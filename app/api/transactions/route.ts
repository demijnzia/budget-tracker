import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, unauthorized, visibleTo } from "@/lib/auth";
import { monthRange, unitsToCents } from "@/lib/utils";
import { TxType } from "@prisma/client";

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
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ transactions });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = await req.json();
  const { amount, type, note, date, categoryId } = body;

  if (
    typeof amount !== "number" ||
    amount <= 0 ||
    !["EXPENSE", "INCOME"].includes(type) ||
    !date ||
    !categoryId
  ) {
    return NextResponse.json({ error: "Invalid transaction payload" }, { status: 400 });
  }

  const category = await prisma.category.findFirst({
    where: { id: categoryId, ...visibleTo(userId) },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      amount: unitsToCents(amount),
      type: type as TxType,
      note: note || null,
      date: new Date(date),
      categoryId,
    },
    include: { category: true },
  });

  return NextResponse.json({ transaction }, { status: 201 });
}
