import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccountingShop } from "@/lib/accounting/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop } = ctx;
  const { id } = await params;

  const entry = await prisma.journalEntry.findFirst({
    where: { id, shopId: shop.id },
    include: {
      lines: {
        include: { account: { select: { code: true, name: true } } },
        orderBy: { lineOrder: "asc" },
      },
      createdBy: { select: { name: true } },
    },
  });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const debitTotal = entry.lines.reduce((s, l) => s + l.debitAmount, 0);
  const creditTotal = entry.lines.reduce((s, l) => s + l.creditAmount, 0);

  return NextResponse.json({
    ...entry,
    debitTotal,
    creditTotal,
    lines: entry.lines.map((l) => ({
      id: l.id,
      accountId: l.accountId,
      accountCode: l.account.code,
      accountName: l.account.name,
      debitAmount: l.debitAmount,
      creditAmount: l.creditAmount,
      description: l.description,
      lineOrder: l.lineOrder,
    })),
  });
}
