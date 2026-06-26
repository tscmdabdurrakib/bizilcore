import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";
import {
  buildExpenseWhere,
  computeNextDueDate,
  expenseOrderBy,
  getShopForUser,
  mapTransactionToExpense,
} from "@/lib/expenses/server";
import type { ExpenseSort } from "@/lib/expenses/types";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForUser(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const search = searchParams.get("search");
  const paymentMethod = searchParams.get("paymentMethod");
  const supplierId = searchParams.get("supplierId");
  const sort = (searchParams.get("sort") ?? "date") as ExpenseSort;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "30");

  const where = buildExpenseWhere(shop.id, session.user.id, {
    category,
    from,
    to,
    search,
    paymentMethod,
    supplierId,
  });

  const [rows, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { supplier: { select: { id: true, name: true } } },
      orderBy: expenseOrderBy(sort),
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({
    expenses: rows.map(mapTransactionToExpense),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForUser(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const {
    title, amount, category, date, notes, paymentMethod, receiptUrl,
    supplierId, taxRate, taxAmount, isRecurring, recurringInterval,
  } = body;

  if (!title || !amount || !category || !date) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  const expenseDate = new Date(date);
  const interval = isRecurring ? (recurringInterval || "monthly") : null;

  const expense = await prisma.transaction.create({
    data: {
      shopId: shop.id,
      userId: session.user.id,
      type: "expense",
      title,
      amount: parseFloat(amount),
      category,
      date: expenseDate,
      note: notes || null,
      paymentMethod: paymentMethod || null,
      receiptUrl: receiptUrl || null,
      supplierId: supplierId || null,
      taxRate: parseFloat(taxRate ?? 0),
      taxAmount: parseFloat(taxAmount ?? 0),
      isRecurring: !!isRecurring,
      recurringInterval: interval,
      nextDueDate: isRecurring ? computeNextDueDate(expenseDate, interval!) : null,
    },
    include: { supplier: { select: { id: true, name: true } } },
  });

  await logActivity({
    userId: session.user.id,
    shopId: shop.id,
    action: "expense_add",
    detail: `খরচ যোগ: ${title} — ৳${amount}`,
  });

  return NextResponse.json(mapTransactionToExpense(expense), { status: 201 });
}
