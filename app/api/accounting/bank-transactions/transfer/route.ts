import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccountingShop } from "@/lib/accounting/auth";
import { createJournalEntry } from "@/lib/accounting/journal";
import { roundMoney } from "@/types/accounting";

export async function POST(req: NextRequest) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop, session } = ctx;
  const body = await req.json();
  const { fromAccountId, toAccountId, amount, transactionDate, description } = body;
  const amt = roundMoney(parseFloat(amount));
  if (!fromAccountId || !toAccountId || !amt || amt <= 0 || fromAccountId === toAccountId) {
    return NextResponse.json({ error: "Invalid transfer" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const [from, to] = await Promise.all([
        tx.accountingBankAccount.findFirst({
          where: { id: fromAccountId, shopId: shop.id },
        }),
        tx.accountingBankAccount.findFirst({
          where: { id: toAccountId, shopId: shop.id },
        }),
      ]);
      if (!from || !to) throw new Error("Bank account not found");

      const date = new Date(transactionDate ?? Date.now());
      const pairId = `xfer_${Date.now()}`;

      const entry = await createJournalEntry(tx, {
        shopId: shop.id,
        userId: session.user.id,
        entryDate: date,
        description: description ?? `Transfer ${from.name} → ${to.name}`,
        lines: [
          { accountId: to.accountId, debitAmount: amt, creditAmount: 0 },
          { accountId: from.accountId, debitAmount: 0, creditAmount: amt },
        ],
        referenceType: "transfer",
        post: true,
      });

      const outTx = await tx.accountingBankTransaction.create({
        data: {
          shopId: shop.id,
          bankAccountId: fromAccountId,
          journalEntryId: entry.id,
          transactionDate: date,
          transactionType: "transfer",
          amount: amt,
          description: description ?? "Transfer out",
          transferPairId: pairId,
        },
      });

      const inTx = await tx.accountingBankTransaction.create({
        data: {
          shopId: shop.id,
          bankAccountId: toAccountId,
          journalEntryId: entry.id,
          transactionDate: date,
          transactionType: "transfer",
          amount: amt,
          description: description ?? "Transfer in",
          transferPairId: pairId,
        },
      });

      return { entry, outTx, inTx };
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
