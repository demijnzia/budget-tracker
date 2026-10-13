import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TxType } from "@prisma/client";

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, icon, color, type } = body;

  if (!name || !["EXPENSE", "INCOME"].includes(type)) {
    return NextResponse.json({ error: "Invalid category payload" }, { status: 400 });
  }

  try {
    const category = await prisma.category.create({
      data: {
        name,
        icon: icon || "dot",
        color: color || "#3B6B4A",
        type: type as TxType,
      },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Category name already exists" }, { status: 409 });
  }
}
