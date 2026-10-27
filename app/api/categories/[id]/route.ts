import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, unauthorized } from "@/lib/auth";

// Only a user's own categories can be removed. Built-in ones (userId null) stay.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const own = await prisma.category.findFirst({ where: { id: params.id, userId } });
  if (!own) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  const inUse = await prisma.transaction.findFirst({ where: { categoryId: params.id } });
  if (inUse) {
    return NextResponse.json(
      { error: "Category is used by existing transactions and can't be deleted" },
      { status: 409 }
    );
  }
  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
