import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const returns = await prisma.orderReturn.findMany({
    where: { orderId: id, userId: session.user.id },
    include: {
      items: { include: { product: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(returns);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { reason, restock, items } = await req.json();

  if (!items?.length) return NextResponse.json({ error: "items required" }, { status: 400 });

  // Only process items with a valid productId — combo items cannot be recorded
  // in OrderReturnItem (which requires a non-nullable productId FK).
  const productItems = (items as { productId?: string; quantity: number }[]).filter(
    (item) => !!item.productId
  );

  if (productItems.length === 0) {
    return NextResponse.json({ error: "No returnable product items provided (combo items cannot be returned individually)" }, { status: 400 });
  }

  const orderReturn = await prisma.orderReturn.create({
    data: {
      orderId: id,
      userId: session.user.id,
      reason: reason || null,
      restock: restock !== false,
      items: {
        create: productItems.map((item) => ({
          productId: item.productId!,
          quantity: item.quantity,
        })),
      },
    },
    include: { items: true },
  });

  if (restock !== false) {
    for (const item of productItems) {
      await prisma.product.update({
        where: { id: item.productId! },
        data: { stockQty: { increment: item.quantity } },
      });
      await prisma.stockMovement.create({
        data: {
          productId: item.productId!,
          userId: session.user.id,
          type: "return",
          quantity: item.quantity,
          reason: `Return from Order #${id.slice(-6).toUpperCase()}`,
          orderId: id,
        },
      });
    }
  }

  await prisma.order.update({
    where: { id },
    data: { status: "returned" },
  });

  const returnTotal = productItems.reduce((sum: number, item: { quantity: number; productId?: string }) => {
    const orderItem = order.items.find((oi) => oi.productId === item.productId);
    return sum + (orderItem?.unitPrice ?? 0) * item.quantity;
  }, 0);

  if (order.customerId && returnTotal > 0 && order.dueAmount > 0) {
    const adjustDue = Math.min(returnTotal, order.dueAmount);
    await prisma.customer.update({
      where: { id: order.customerId },
      data: { dueAmount: { decrement: adjustDue } },
    });
  }

  return NextResponse.json(orderReturn, { status: 201 });
}
