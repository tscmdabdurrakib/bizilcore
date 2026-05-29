import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_PAYMENT_METHODS = ["cash", "card", "bkash", "nagad", "bank", "other"];
const UNPAID_STATUSES = ["pending", "preparing", "ready", "served", "billing"];

async function getShop(userId: string) {
  return prisma.shop.findUnique({
    where: { userId },
    select: { id: true, restAutoStockDeduct: true },
  });
}

const ORDER_INCLUDE = {
  items: {
    include: {
      menuItem: {
        // Only `include` (not select+include together) — Prisma disallows both
        include: { recipes: { select: { materialId: true, quantity: true } } },
      },
    },
  },
  table:     { select: { id: true, number: true, floor: true } },
  kotTickets: { select: { id: true, kotNumber: true, sentAt: true, kitchenStatus: true } },
  waiter:    { select: { id: true, user: { select: { name: true } } } },
  splits:    { orderBy: { splitIndex: "asc" as const } },
};

/**
 * Deduct raw-material stock for items that transition to "paid" status.
 * Mirrors the deductStockIfNeeded function in the main orders/[id]/route.ts.
 */
async function deductStockForPaidOrder(
  shopId: string,
  autoDeduct: boolean,
  prevStatus: string,
  items: { quantity: number; menuItem: { recipes: { materialId: string; quantity: number }[] } }[]
) {
  if (!autoDeduct) return;
  // Only deduct when NOT already in a deducted status (served/paid)
  const DEDUCTED = ["served", "paid"];
  if (DEDUCTED.includes(prevStatus)) return;

  for (const item of items) {
    for (const recipe of item.menuItem.recipes ?? []) {
      await prisma.rawMaterial.updateMany({
        where: { id: recipe.materialId, shopId },
        data: { currentStock: { decrement: recipe.quantity * item.quantity } },
      });
    }
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const order = await prisma.restaurantOrder.findFirst({
    where: { id, shopId: shop.id },
    include: ORDER_INCLUDE,
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;

  // Fetch order with items (recipes needed for stock deduction)
  const order = await prisma.restaurantOrder.findFirst({
    where: { id, shopId: shop.id },
    include: {
      items: { include: { menuItem: { include: { recipes: true } } } },
      splits: true,
    },
  });
  if (!order) return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি" }, { status: 404 });
  if (order.status === "paid") {
    return NextResponse.json({ error: "অর্ডার ইতিমধ্যে পরিশোধ হয়েছে" }, { status: 400 });
  }
  if (order.isVoided) {
    return NextResponse.json({ error: "ভয়েড করা অর্ডারে পেমেন্ট করা যাবে না" }, { status: 400 });
  }

  let body: {
    splits: { payerName?: string | null; amount: number; paymentMethod: string; transactionRef?: string | null }[];
    isPartial?: boolean;
  };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.splits) || body.splits.length === 0) {
    return NextResponse.json({ error: "Split data required" }, { status: 400 });
  }

  // ── Per-line validation ──────────────────────────────────────────
  for (const [i, sp] of body.splits.entries()) {
    const amt = Number(sp.amount);
    if (!isFinite(amt) || amt <= 0) {
      return NextResponse.json({ error: `Split ${i + 1}: পরিমাণ শূন্যের বেশি হতে হবে` }, { status: 400 });
    }
    if (!ALLOWED_PAYMENT_METHODS.includes(sp.paymentMethod)) {
      return NextResponse.json(
        { error: `Split ${i + 1}: অবৈধ পেমেন্ট পদ্ধতি "${sp.paymentMethod}"` },
        { status: 400 }
      );
    }
  }

  const totalSplitAmount = body.splits.reduce((s, sp) => s + Number(sp.amount), 0);
  // Overpayment check against full total (secondary guard, primary is remainingDue below)
  if (totalSplitAmount > order.totalAmount + 0.05) {
    return NextResponse.json(
      { error: `পেমেন্ট পরিমাণ (৳${totalSplitAmount.toFixed(2)}) মোট বিল (৳${order.totalAmount.toFixed(2)}) এর বেশি হতে পারবে না` },
      { status: 400 }
    );
  }

  const existingSplitsTotal = order.splits.reduce((s, sp) => s + sp.amount, 0);
  const remainingDue = Math.max(0, order.totalAmount - existingSplitsTotal);

  // Guard: new payment cannot exceed remaining due
  if (totalSplitAmount > remainingDue + 0.05) {
    return NextResponse.json(
      { error: `পেমেন্ট পরিমাণ (৳${totalSplitAmount.toFixed(2)}) বকেয়া (৳${remainingDue.toFixed(2)}) এর বেশি হতে পারবে না` },
      { status: 400 }
    );
  }

  const newTotal    = existingSplitsTotal + totalSplitAmount;
  const isFullyPaid = newTotal >= order.totalAmount - 0.05;
  const dueAmount   = Math.max(0, order.totalAmount - newTotal);

  const existingCount = order.splits.length;
  const newSplitRows = body.splits.map((sp, i) => ({
    id: `${id}_split_${existingCount + i + 1}_${Date.now()}`,
    orderId: id,
    splitIndex: existingCount + i + 1,
    payerName: sp.payerName ?? null,
    amount: Number(sp.amount),
    paymentMethod: sp.paymentMethod,
    transactionRef: sp.transactionRef ?? null,
    paidAt: new Date(),
  }));

  // ── DB transaction: create splits + update order atomically ──────
  const updated = await prisma.$transaction(async (tx) => {
    // Insert new splits
    await tx.orderSplit.createMany({ data: newSplitRows });

    // Update order financials
    const orderUpdate = await tx.restaurantOrder.update({
      where: { id },
      data: {
        paidAmount: newTotal,
        dueAmount,
        ...(isFullyPaid ? {
          status: "paid",
          paymentMethod: "split",
          billRequested: false,
        } : {}),
      },
      include: ORDER_INCLUDE,
    });

    // Free up table if fully paid and no other open orders
    if (isFullyPaid && order.tableId) {
      const remaining = await tx.restaurantOrder.count({
        where: {
          tableId: order.tableId,
          status: { in: UNPAID_STATUSES },
          id: { not: id },
        },
      });
      if (remaining === 0) {
        await tx.diningTable.update({
          where: { id: order.tableId },
          data: { status: "available" },
        });
      }
    }

    return orderUpdate;
  });

  // ── Stock deduction (outside transaction — best-effort, matches existing pattern) ──
  if (isFullyPaid) {
    await deductStockForPaidOrder(
      shop.id,
      shop.restAutoStockDeduct,
      order.status,
      order.items
    );
  }

  return NextResponse.json({ ...updated, isFullyPaid, totalPaid: newTotal, dueAmount });
}
