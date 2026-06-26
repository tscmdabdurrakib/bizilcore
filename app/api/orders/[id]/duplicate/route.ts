import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const original = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          combo: {
            include: {
              items: {
                include: {
                  product: { select: { id: true, stockQty: true } },
                  variant: { select: { id: true, stockQty: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!original || original.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
  const newOrder = await prisma.$transaction(async (tx) => {
    const regularItems = original.items.filter(i => i.productId).map(i => ({ productId: i.productId!, quantity: i.quantity }));
    const comboItems = original.items.filter(i => i.comboId).map(i => ({ comboId: i.comboId!, quantity: i.quantity, comboSnapshot: i.comboSnapshot }));
    const comboMap = Object.fromEntries(
      original.items
        .filter(i => i.combo)
        .map(i => [i.comboId!, i.combo!])
    );

    if (original.branchId) {
      const { assertBranchStockAvailable } = await import("@/lib/shops/order-stock");
      const stockErr = await assertBranchStockAvailable(tx, original.branchId, regularItems, comboItems, comboMap);
      if (stockErr) throw new Error(stockErr);
    }

    const created = await tx.order.create({
      data: {
        userId: original.userId,
        customerId: original.customerId,
        branchId: original.branchId,
        status: "pending",
        source: original.source,
        note: original.note,
        totalAmount: original.totalAmount,
        paidAmount: 0,
        dueAmount: original.totalAmount,
        deliveryCharge: original.deliveryCharge,
        tags: original.tags,
        items: {
          create: original.items.map((item) => ({
            productId: item.productId,
            comboId: item.comboId,
            comboSnapshot: item.comboSnapshot,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
        },
      },
    });

    const { deductOrderStock } = await import("@/lib/shops/order-stock");
    await deductOrderStock(tx, original.branchId, regularItems, comboItems, comboMap);

    if (original.customerId && original.totalAmount > 0) {
      await tx.customer.update({
        where: { id: original.customerId },
        data: { dueAmount: { increment: original.totalAmount } },
      });
    }

    return created;
  });

  return NextResponse.json(newOrder, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Duplicate failed";
    if (msg.includes("branch stock") || msg.includes("Branch orders")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    throw err;
  }
}
