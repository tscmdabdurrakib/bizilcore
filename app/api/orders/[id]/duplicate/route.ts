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

  const newOrder = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: original.userId,
        customerId: original.customerId,
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

    // Deduct stock for each item
    for (const item of original.items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { decrement: item.quantity } },
        });
      } else if (item.comboId) {
        // Prefer snapshot for historical accuracy; fall back to current combo items
        let components: { productId: string; variantId?: string | null; quantity: number }[] = [];
        if (item.comboSnapshot) {
          try {
            const snap = JSON.parse(item.comboSnapshot) as { items: { productId: string; variantId?: string | null; quantity: number }[] };
            components = snap.items;
          } catch {
            components = item.combo?.items.map(ci => ({ productId: ci.product.id, variantId: ci.variantId ?? null, quantity: ci.quantity })) ?? [];
          }
        } else {
          components = item.combo?.items.map(ci => ({ productId: ci.product.id, variantId: ci.variantId ?? null, quantity: ci.quantity })) ?? [];
        }
        for (const ci of components) {
          if (ci.variantId) {
            // Tolerate stale snapshot variant IDs that no longer exist
            await tx.productVariant.updateMany({
              where: { id: ci.variantId },
              data: { stockQty: { decrement: ci.quantity * item.quantity } },
            });
          } else {
            await tx.product.updateMany({
              where: { id: ci.productId },
              data: { stockQty: { decrement: ci.quantity * item.quantity } },
            });
          }
        }
      }
    }

    if (original.customerId && original.totalAmount > 0) {
      await tx.customer.update({
        where: { id: original.customerId },
        data: { dueAmount: { increment: original.totalAmount } },
      });
    }

    return created;
  });

  return NextResponse.json(newOrder, { status: 201 });
}
