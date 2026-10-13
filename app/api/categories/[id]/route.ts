import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const inUse = await prisma.transaction.findFirst({ where: { categoryId: params.id } });
  if (inUse) {
    return NextResponse.json(
      { error: "Category is used by existing transactions and can't be deleted" },
      { status: 409 }
    );
  }
  try {
    await prisma.category.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }
}
