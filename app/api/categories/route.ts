import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, unauthorized, visibleTo } from "@/lib/auth";
import { TxType } from "@prisma/client";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const categories = await prisma.category.findMany({
    where: visibleTo(userId),
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = await req.json();
  const { name, icon, color, type } = body;

  if (!name || !["EXPENSE", "INCOME"].includes(type)) {
    return NextResponse.json({ error: "Invalid category payload" }, { status: 400 });
  }

  const exists = await prisma.category.findFirst({ where: { name, ...visibleTo(userId) } });
  if (exists) {
    return NextResponse.json({ error: "Category name already exists" }, { status: 409 });
  }

  const category = await prisma.category.create({
    data: {
      userId,
      name,
      icon: icon || "dot",
      color: color || "#3B6B4A",
      type: type as TxType,
    },
  });
  return NextResponse.json({ category }, { status: 201 });
}
