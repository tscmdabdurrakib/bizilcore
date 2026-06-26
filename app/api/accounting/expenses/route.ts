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
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const expenses = await prisma.accountingExpense.findMany({
    where: {
      shopId: shop.id,
      ...(from || to
        ? {
            expenseDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: {
      expenseCategory: { include: { account: true } },
      bankAccount: true,
    },
    orderBy: { expenseDate: "desc" },
    take: 100,
  });

  const categories = await prisma.expenseCategory.findMany({
    where: { shopId: shop.id },
    include: { account: true },
  });

  return NextResponse.json({ expenses, categories });
}

export async function POST(req: NextRequest) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop, session } = ctx;
  const body = await req.json();
  const {
    expenseCategoryId,
    bankAccountId,
    amount,
    expenseDate,
    description,
    vendorName,
    receiptUrl,
  } = body;

  const amt = roundMoney(parseFloat(amount));
  if (!expenseCategoryId || !bankAccountId || !amt || !description) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const cat = await tx.expenseCategory.findFirst({
        where: { id: expenseCategoryId, shopId: shop.id },
        include: { account: true },
      });
      const bank = await tx.accountingBankAccount.findFirst({
        where: { id: bankAccountId, shopId: shop.id },
      });
      if (!cat || !bank) throw new Error("Category or bank account not found");

      const date = new Date(expenseDate ?? Date.now());
      const entry = await createJournalEntry(tx, {
        shopId: shop.id,
        userId: session.user.id,
        entryDate: date,
        description: description ?? cat.name,
        lines: [
          { accountId: cat.accountId, debitAmount: amt, creditAmount: 0 },
          { accountId: bank.accountId, debitAmount: 0, creditAmount: amt },
        ],
        referenceType: "expense",
        post: true,
      });

      const expense = await tx.accountingExpense.create({
        data: {
          shopId: shop.id,
          expenseCategoryId,
          bankAccountId,
          journalEntryId: entry.id,
          expenseDate: date,
          amount: amt,
          description,
          vendorName: vendorName ?? null,
          receiptUrl: receiptUrl ?? null,
          createdById: session.user.id,
        },
      });

      await tx.accountingBankTransaction.create({
        data: {
          shopId: shop.id,
          bankAccountId,
          journalEntryId: entry.id,
          transactionDate: date,
          transactionType: "withdrawal",
          amount: amt,
          description,
        },
      });

      return { expense, entry };
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
