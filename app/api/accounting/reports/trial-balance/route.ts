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
  const from = startDate ? new Date(startDate) : null;
  const to = endDate ? new Date(endDate) : null;

  const accounts = await prisma.account.findMany({
    where: { shopId: shop.id, isActive: true },
    orderBy: { code: "asc" },
  });

  const rows = [];
  let grandDebit = 0;
  let grandCredit = 0;

  for (const a of accounts) {
    const lines = await prisma.journalEntryLine.findMany({
      where: {
        shopId: shop.id,
        accountId: a.id,
        journalEntry: {
          status: "posted",
          ...(from || to
            ? {
                entryDate: {
                  ...(from ? { gte: from } : {}),
                  ...(to ? { lte: to } : {}),
                },
              }
            : {}),
        },
      },
    });
    const totalDebit = roundMoney(lines.reduce((s, l) => s + l.debitAmount, 0));
    const totalCredit = roundMoney(lines.reduce((s, l) => s + l.creditAmount, 0));
    if (totalDebit === 0 && totalCredit === 0) continue;

    const balance =
      a.normalBalance === "debit"
        ? totalDebit - totalCredit
        : totalCredit - totalDebit;

    rows.push({
      code: a.code,
      name: a.name,
      accountType: a.accountType,
      totalDebit,
      totalCredit,
      balance: roundMoney(balance),
    });
    grandDebit += totalDebit;
    grandCredit += totalCredit;
  }

  return NextResponse.json({
    rows,
    grandDebit: roundMoney(grandDebit),
    grandCredit: roundMoney(grandCredit),
  });
}
