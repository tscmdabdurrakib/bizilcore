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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForUser(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const source = await getExpenseForShop(id, shop.id, session.user.id);
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const duplicate = await prisma.transaction.create({
    data: {
      shopId: shop.id,
      userId: session.user.id,
      type: "expense",
      title: source.title ? `${source.title} (কপি)` : null,
      amount: source.amount,
      category: source.category,
      date: new Date(),
      note: source.note,
      paymentMethod: source.paymentMethod,
      receiptUrl: null,
      supplierId: source.supplierId,
      taxRate: source.taxRate,
      taxAmount: source.taxAmount,
      isRecurring: false,
      recurringInterval: null,
      nextDueDate: null,
      recurringParentId: source.id,
    },
    include: { supplier: { select: { id: true, name: true } } },
  });

  await logActivity({
    userId: session.user.id,
    shopId: shop.id,
    action: "expense_duplicate",
    detail: `খরচ কপি: ${source.title ?? source.category}`,
  });

  return NextResponse.json(mapTransactionToExpense(duplicate), { status: 201 });
}
