import { prisma } from "@/lib/prisma";
import type { Expense, ExpenseSort } from "./types";
import type { Prisma } from "@prisma/client";
import { computeNextDueDate, monthKey, pctChange, getMonthRange, getWeekRange } from "./utils";

export { computeNextDueDate, monthKey, pctChange, getMonthRange, getWeekRange };

export async function getShopForUser(userId: string) {
  return prisma.shop.findUnique({ where: { userId } });
}

type TxRow = Prisma.TransactionGetPayload<{
  include: { supplier: { select: { id: true; name: true } } };
}>;

export function mapTransactionToExpense(tx: TxRow): Expense {
  return {
    id: tx.id,
    title: tx.title,
    amount: tx.amount,
    category: tx.category,
    date: tx.date.toISOString(),
    notes: tx.note,
    paymentMethod: tx.paymentMethod,
    receiptUrl: tx.receiptUrl,
    supplierId: tx.supplierId,
    supplier: tx.supplier,
    taxRate: tx.taxRate,
    taxAmount: tx.taxAmount,
    isRecurring: tx.isRecurring,
    recurringInterval: tx.recurringInterval,
    nextDueDate: tx.nextDueDate?.toISOString() ?? null,
  };
}

export function expenseBaseWhere(shopId: string, userId: string): Prisma.TransactionWhereInput {
  return {
    type: "expense",
    OR: [{ shopId }, { shopId: null, userId }],
  };
}

export function buildExpenseWhere(
  shopId: string,
  userId: string,
  filters: {
    category?: string | null;
    from?: string | null;
    to?: string | null;
    search?: string | null;
    paymentMethod?: string | null;
    supplierId?: string | null;
  }
): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = expenseBaseWhere(shopId, userId);

  if (filters.category) where.category = filters.category;
  if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;
  if (filters.supplierId) where.supplierId = filters.supplierId;

  if (filters.from || filters.to) {
    where.date = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999Z`) } : {}),
    };
  }

  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.AND = [
      {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { note: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ],
      },
    ];
  }

  return where;
}

export function expenseOrderBy(sort: ExpenseSort): Prisma.TransactionOrderByWithRelationInput {
  if (sort === "amount") return { amount: "desc" };
  if (sort === "title") return { title: "asc" };
  return { date: "desc" };
}

export async function getExpenseForShop(id: string, shopId: string, userId: string) {
  return prisma.transaction.findFirst({
    where: { id, ...expenseBaseWhere(shopId, userId) },
    include: { supplier: { select: { id: true, name: true } } },
  });
}
