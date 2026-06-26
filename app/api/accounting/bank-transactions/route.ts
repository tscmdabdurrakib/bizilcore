import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccountingShop } from "@/lib/accounting/auth";
import { createJournalEntry } from "@/lib/accounting/journal";
import { roundMoney } from "@/types/accounting";

export async function GET(req: NextRequest) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop } = ctx;

  const { searchParams } = new URL(req.url);
  const bankAccountId = searchParams.get("bank_account_id") ?? searchParams.get("bankAccountId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const type = searchParams.get("type");
  const reconciled = searchParams.get("reconciled");

  const txs = await prisma.accountingBankTransaction.findMany({
    where: {
      shopId: shop.id,
      ...(bankAccountId ? { bankAccountId } : {}),
      ...(type ? { transactionType: type } : {}),
      ...(reconciled === "true" ? { isReconciled: true } : reconciled === "false" ? { isReconciled: false } : {}),
      ...(from || to
        ? {
            transactionDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  return NextResponse.json({ transactions: txs });
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop } = ctx;
  const body = await req.json();
  const { id, isReconciled } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const tx = await prisma.accountingBankTransaction.updateMany({
    where: { id, shopId: shop.id },
    data: { isReconciled: !!isReconciled },
  });
  if (tx.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

async function bankJournal(
  shopId: string,
  userId: string,
  bankAccountId: string,
  amount: number,
  transactionDate: Date,
  description: string,
  type: "deposit" | "withdrawal",
) {
  return prisma.$transaction(async (tx) => {
    const bank = await tx.accountingBankAccount.findFirst({
      where: { id: bankAccountId, shopId },
      include: { account: true },
    });
    if (!bank) throw new Error("Bank account not found");

    const offsetCode = type === "deposit" ? "3000" : "5800";
    const offset = await tx.account.findFirst({
      where: { shopId, code: offsetCode },
    });
    if (!offset) throw new Error(`Offset account ${offsetCode} not found — run COA seed`);

    const journalLines =
      type === "deposit"
        ? [
            { accountId: bank.accountId, debitAmount: amount, creditAmount: 0, description },
            { accountId: offset.id, debitAmount: 0, creditAmount: amount, description },
          ]
        : [
            { accountId: offset.id, debitAmount: amount, creditAmount: 0, description },
            { accountId: bank.accountId, debitAmount: 0, creditAmount: amount, description },
          ];

    const entry = await createJournalEntry(tx, {
      shopId,
      userId,
      entryDate: transactionDate,
      description,
      lines: journalLines,
      referenceType: `bank_${type}`,
      post: true,
    });

    const bankTx = await tx.accountingBankTransaction.create({
      data: {
        shopId,
        bankAccountId,
        journalEntryId: entry.id,
        transactionDate,
        transactionType: type,
        amount,
        description,
      },
    });

    return { entry, bankTx };
  });
}

export { bankJournal, roundMoney };
