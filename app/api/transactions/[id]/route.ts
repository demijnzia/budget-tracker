import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unitsToCents } from "@/lib/utils";
import { TxType } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (typeof body.amount === "number") data.amount = unitsToCents(body.amount);
  if (typeof body.type === "string" && ["EXPENSE", "INCOME"].includes(body.type))
    data.type = body.type as TxType;
  if (typeof body.note === "string" || body.note === null) data.note = body.note;
  if (body.date) data.date = new Date(body.date);
  if (typeof body.categoryId === "string") data.categoryId = body.categoryId;

  try {
    const transaction = await prisma.transaction.update({
      where: { id: params.id },
      data,
      include: { category: true },
    });
    return NextResponse.json({ transaction });
  } catch {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.transaction.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }
}
