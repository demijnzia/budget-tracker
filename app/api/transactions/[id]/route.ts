import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, unauthorized, visibleTo } from "@/lib/auth";
import { unitsToCents } from "@/lib/utils";
import { TxType } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (typeof body.amount === "number") data.amount = unitsToCents(body.amount);
  if (typeof body.type === "string" && ["EXPENSE", "INCOME"].includes(body.type))
    data.type = body.type as TxType;
  if (typeof body.note === "string" || body.note === null) data.note = body.note;
  if (body.date) data.date = new Date(body.date);
  if (typeof body.categoryId === "string") {
    const category = await prisma.category.findFirst({
      where: { id: body.categoryId, ...visibleTo(userId) },
    });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    data.categoryId = body.categoryId;
  }

  const own = await prisma.transaction.findFirst({ where: { id: params.id, userId } });
  if (!own) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

  const transaction = await prisma.transaction.update({
    where: { id: params.id },
    data,
    include: { category: true },
  });
  return NextResponse.json({ transaction });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const result = await prisma.transaction.deleteMany({ where: { id: params.id, userId } });
  if (result.count === 0) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
