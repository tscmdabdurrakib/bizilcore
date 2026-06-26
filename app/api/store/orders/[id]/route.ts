import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bookCourierForOrder, CourierBookingError } from "@/lib/courier-booking";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const order = await prisma.storeOrder.findFirst({
    where: { id, shopId: shop.id },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, imageUrl: true } } },
      },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const order = await prisma.storeOrder.findFirst({
    where: { id, shopId: shop.id },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { status, paymentStatus, courierName, manualTrackId } = body;

  const VALID_TRANSITIONS: Record<string, string[]> = {
    pending:    ["confirmed", "cancelled"],
    confirmed:  ["packed", "cancelled"],
    packed:     ["shipped", "cancelled"],
    shipped:    ["delivered", "cancelled"],
    delivered:  [],
    cancelled:  [],
  };

  if (status) {
    const current = order.status;
    const allowed = VALID_TRANSITIONS[current] ?? [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `'${current}' থেকে '${status}' স্ট্যাটাসে পরিবর্তন করা যাবে না` },
        { status: 400 }
      );
    }
  }

  const isCancelling = status === "cancelled" && order.status !== "cancelled";

  const updated = await prisma.$transaction(async (tx) => {
    const so = await tx.storeOrder.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
      },
    });

    if (status) {
      await tx.order.updateMany({ where: { storeOrderId: id }, data: { status } });
    }

    // Restock inventory when an order is cancelled (stock was deducted at creation).
    if (isCancelling) {
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.updateMany({
            where: { id: item.variantId },
            data: { stockQty: { increment: item.quantity } },
          });
        } else if (item.productId) {
          await tx.product.updateMany({
            where: { id: item.productId, shopId: shop.id },
            data: { stockQty: { increment: item.quantity } },
          });
        }
        if (item.productId) {
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              userId: session.user.id,
              type: "in",
              quantity: item.quantity,
              reason: `store_order_cancelled:${order.orderNumber}`,
            },
          });
        }
      }
    }

    return so;
  });

  // Opt-in courier auto-booking: when the merchant passes a courierName while
  // moving the order forward, book the linked Order using the StoreOrder's
  // recipient details (best-effort; booking failure is reported but doesn't
  // revert the status change).
  let courier: { trackingId: string; status: string; courierName: string } | null = null;
  let courierError: string | null = null;
  if (courierName && status && status !== "cancelled") {
    const linked = await prisma.order.findFirst({
      where: { storeOrderId: id, userId: session.user.id },
      select: { id: true, courierTrackId: true },
    });
    if (linked && !linked.courierTrackId) {
      try {
        courier = await bookCourierForOrder(session.user.id, linked.id, courierName, manualTrackId, {
          name: order.customerName,
          phone: order.customerPhone,
          address: [order.customerAddress, order.customerUpazila, order.customerDistrict].filter(Boolean).join(", "),
        });
      } catch (err) {
        courierError = err instanceof CourierBookingError ? err.message : "কুরিয়ার বুকিং ব্যর্থ হয়েছে।";
      }
    }
  }

  return NextResponse.json({ ...updated, courier, courierError });
}
