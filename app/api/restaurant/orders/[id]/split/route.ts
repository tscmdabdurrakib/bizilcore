import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getShop(userId: string) {
  return prisma.shop.findUnique({ where: { userId }, select: { id: true } });
}

const ORDER_INCLUDE = {
  items: { include: { menuItem: { select: { id: true, name: true, category: true } } } },
  table: { select: { id: true, number: true, floor: true } },
  kotTickets: { select: { id: true, kotNumber: true, sentAt: true, kitchenStatus: true } },
  waiter: { select: { id: true, user: { select: { name: true } } } },
  splits: { orderBy: { splitIndex: "asc" as const } },
};

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
  const order = await prisma.restaurantOrder.findFirst({
    where: { id, shopId: shop.id },
    include: { splits: true },
  });
  if (!order) return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি" }, { status: 404 });
  if (order.status === "paid") return NextResponse.json({ error: "অর্ডার ইতিমধ্যে পরিশোধ হয়েছে" }, { status: 400 });

  let body: {
    splits: { payerName?: string; amount: number; paymentMethod: string; transactionRef?: string }[];
    isPartial?: boolean;
  };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.splits?.length) return NextResponse.json({ error: "Split data required" }, { status: 400 });

  const totalSplitAmount = body.splits.reduce((s, sp) => s + sp.amount, 0);
  if (totalSplitAmount <= 0) return NextResponse.json({ error: "মোট পরিমাণ শূন্যের বেশি হতে হবে" }, { status: 400 });
  if (totalSplitAmount > order.totalAmount + 0.01) {
    return NextResponse.json({ error: `স্প্লিট পরিমাণ (${totalSplitAmount.toFixed(2)}) মোট বিল (${order.totalAmount.toFixed(2)}) এর বেশি হতে পারবে না` }, { status: 400 });
  }

  const existingSplitsCount = order.splits.length;
  const newSplits = body.splits.map((sp, i) => ({
    orderId: id,
    splitIndex: existingSplitsCount + i + 1,
    payerName: sp.payerName ?? null,
    amount: sp.amount,
    paymentMethod: sp.paymentMethod,
    transactionRef: sp.transactionRef ?? null,
    paidAt: new Date(),
  }));

  await prisma.orderSplit.createMany({ data: newSplits });

  const allSplits = await prisma.orderSplit.findMany({ where: { orderId: id } });
  const totalPaid = allSplits.reduce((s, sp) => s + sp.amount, 0);
  const dueAmount = Math.max(0, order.totalAmount - totalPaid);
  const isFullyPaid = dueAmount <= 0.01;

  const updated = await prisma.restaurantOrder.update({
    where: { id },
    data: {
      paidAmount: totalPaid,
      dueAmount,
      ...(isFullyPaid && {
        status: "paid",
        paymentMethod: "split",
        billRequested: false,
      }),
      ...(!isFullyPaid && body.isPartial && {
        status: order.status,
      }),
    },
    include: ORDER_INCLUDE,
  });

  if (isFullyPaid && order.tableId) {
    const UNPAID = ["pending", "preparing", "ready", "served", "billing"];
    const remaining = await prisma.restaurantOrder.count({
      where: { tableId: order.tableId, status: { in: UNPAID }, id: { not: id } },
    });
    if (remaining === 0) {
      await prisma.diningTable.update({ where: { id: order.tableId }, data: { status: "available" } });
    }
  }

  return NextResponse.json({ ...updated, isFullyPaid, totalPaid, dueAmount });
}
