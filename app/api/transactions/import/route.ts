import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unitsToCents } from "@/lib/utils";

type Row = {
  invoiceNo?: string;
  date: string; // YYYY-MM-DD
  amount: number; // whole currency units
  note?: string;
  categoryId: string;
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const rows: Row[] = Array.isArray(body?.rows) ? body.rows : [];

  if (rows.length === 0 || rows.length > 2000) {
    return NextResponse.json({ error: "Send between 1 and 2000 rows." }, { status: 400 });
  }

  const categoryIds = new Set(
    (await prisma.category.findMany({ select: { id: true } })).map((c) => c.id)
  );

  const data = [];
  for (const r of rows) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(r.date) ||
      typeof r.amount !== "number" ||
      !(r.amount > 0) ||
      !categoryIds.has(r.categoryId)
    ) {
      return NextResponse.json({ error: "One of the rows is invalid." }, { status: 400 });
    }
    data.push({
      amount: unitsToCents(r.amount),
      type: "EXPENSE" as const,
      note: r.note ? String(r.note).slice(0, 300) : null,
      invoiceNo: r.invoiceNo ? String(r.invoiceNo).toUpperCase() : null,
      date: new Date(r.date),
      categoryId: r.categoryId,
    });
  }

  // Importing an invoice again replaces the entry saved earlier for that invoice number,
  // so a corrected file fixes old amounts instead of being skipped.
  const invoiceNos = data.map((d) => d.invoiceNo).filter((n): n is string => !!n);
  const [removed, created] = await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { invoiceNo: { in: invoiceNos } } }),
    prisma.transaction.createMany({ data }),
  ]);

  return NextResponse.json({ imported: created.count, replaced: removed.count });
}
