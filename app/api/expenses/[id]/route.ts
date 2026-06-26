import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";
import {
  computeNextDueDate,
  getExpenseForShop,
  getShopForUser,
  mapTransactionToExpense,
} from "@/lib/expenses/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForUser(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const expense = await getExpenseForShop(id, shop.id, session.user.id);
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const expenseDate = body.date ? new Date(body.date) : expense.date;
  const isRecurring = body.isRecurring !== undefined ? !!body.isRecurring : expense.isRecurring;
  const interval = isRecurring ? (body.recurringInterval ?? expense.recurringInterval ?? "monthly") : null;

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      title: body.title ?? expense.title,
      amount: body.amount !== undefined ? parseFloat(body.amount) : expense.amount,
      category: body.category ?? expense.category,
      date: expenseDate,
      note: body.notes !== undefined ? (body.notes || null) : expense.note,
      paymentMethod: body.paymentMethod !== undefined ? (body.paymentMethod || null) : expense.paymentMethod,
      receiptUrl: body.receiptUrl !== undefined ? (body.receiptUrl || null) : expense.receiptUrl,
      supplierId: body.supplierId !== undefined ? (body.supplierId || null) : expense.supplierId,
      taxRate: body.taxRate !== undefined ? parseFloat(body.taxRate) : expense.taxRate,
      taxAmount: body.taxAmount !== undefined ? parseFloat(body.taxAmount) : expense.taxAmount,
      isRecurring,
      recurringInterval: interval,
      nextDueDate: isRecurring ? computeNextDueDate(expenseDate, interval!) : null,
      shopId: shop.id,
    },
    include: { supplier: { select: { id: true, name: true } } },
  });

  await logActivity({
    userId: session.user.id,
    shopId: shop.id,
    action: "expense_edit",
    detail: `খরচ সম্পাদনা: ${updated.title ?? updated.category}`,
  });

  return NextResponse.json(mapTransactionToExpense(updated));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForUser(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const expense = await getExpenseForShop(id, shop.id, session.user.id);
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.transaction.delete({ where: { id } });

  await logActivity({
    userId: session.user.id,
    shopId: shop.id,
    action: "expense_delete",
    detail: `খরচ মুছে ফেলা: ${expense.title ?? expense.category}`,
  });

  return NextResponse.json({ success: true });
}
