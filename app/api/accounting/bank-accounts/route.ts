import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccountingShop } from "@/lib/accounting/auth";
import { getBankAccountBalancesBatch } from "@/lib/accounting/balance";

export async function GET() {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop } = ctx;

  const accounts = await prisma.accountingBankAccount.findMany({
    where: { shopId: shop.id },
    include: { account: { select: { id: true, code: true, name: true } } },
    orderBy: { name: "asc" },
  });

  const lastTxDates = await Promise.all(
    accounts.map((a) =>
      prisma.accountingBankTransaction.findFirst({
        where: { bankAccountId: a.id },
        orderBy: { transactionDate: "desc" },
        select: { transactionDate: true },
      }),
    ),
  );

  const balances = await getBankAccountBalancesBatch(
    accounts.map((a) => a.id),
    shop.id,
  );

  const result = accounts.map((a, i) => ({
    ...a,
    currentBalance: balances.get(a.id) ?? 0,
    lastTransactionDate: lastTxDates[i]?.transactionDate ?? null,
  }));

  return NextResponse.json({ accounts: result });
}

export async function POST(req: NextRequest) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop } = ctx;
  const body = await req.json();
  const { name, accountType, accountId, mobileBankingType, accountNumber, openingBalance } = body;

  if (!name || !accountType || !accountId) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  const coa = await prisma.account.findFirst({ where: { id: accountId, shopId: shop.id } });
  if (!coa) return NextResponse.json({ error: "COA account not found" }, { status: 404 });

  const account = await prisma.accountingBankAccount.create({
    data: {
      shopId: shop.id,
      accountId,
      name,
      accountType,
      mobileBankingType: mobileBankingType ?? null,
      accountNumber: accountNumber ?? null,
      openingBalance: parseFloat(openingBalance) || 0,
    },
    include: { account: true },
  });

  return NextResponse.json(account, { status: 201 });
}
