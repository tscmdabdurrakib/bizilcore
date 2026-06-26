import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccountingShop } from "@/lib/accounting/auth";
import { roundMoney } from "@/types/accounting";

export async function GET(req: NextRequest) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop } = ctx;

  const startDate = req.nextUrl.searchParams.get("start_date");
  const endDate = req.nextUrl.searchParams.get("end_date");
  const from = startDate ? new Date(startDate) : new Date();
  const to = endDate ? new Date(endDate) : from;

  const entries = await prisma.journalEntry.findMany({
    where: {
      shopId: shop.id,
      status: "posted",
      entryDate: { gte: from, lte: to },
    },
    include: {
      lines: {
        include: { account: { select: { code: true, name: true } } },
        orderBy: { lineOrder: "asc" },
      },
    },
    orderBy: [{ entryDate: "asc" }, { entryNumber: "asc" }],
  });

  const byDate: Record<string, typeof entries> = {};
  for (const e of entries) {
    const key = e.entryDate.toISOString().split("T")[0];
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(e);
  }

  let totalDebit = 0;
  let totalCredit = 0;
  for (const e of entries) {
    for (const l of e.lines) {
      totalDebit += l.debitAmount;
      totalCredit += l.creditAmount;
    }
  }

  return NextResponse.json({
    grouped: Object.entries(byDate).map(([date, dayEntries]) => ({
      date,
      entries: dayEntries.map((e) => ({
        id: e.id,
        entryNumber: e.entryNumber,
        description: e.description,
        referenceType: e.referenceType,
        lines: e.lines,
        debitTotal: roundMoney(e.lines.reduce((s, l) => s + l.debitAmount, 0)),
        creditTotal: roundMoney(e.lines.reduce((s, l) => s + l.creditAmount, 0)),
      })),
    })),
    summary: {
      transactionCount: entries.length,
      totalDebit: roundMoney(totalDebit),
      totalCredit: roundMoney(totalCredit),
    },
  });
}
