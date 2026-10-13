import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { monthRange, unitsToCents } from "@/lib/utils";
import { TxType } from "@prisma/client";

export async function GET(req: NextRequest) {
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
    where: { date: { gte: start, lt: end } },
    include: { category: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ transactions });
}

export async function POST(req: NextRequest) {
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

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const transaction = await prisma.transaction.create({
    data: {
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
