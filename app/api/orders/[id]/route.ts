import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/logActivity";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { triggerOrderSMS } from "@/lib/sms";
import { createAutoTask } from "@/lib/autoTasks";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
          combo: {
            include: {
              items: {
                include: { product: { select: { id: true, name: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true, user: { include: { shop: true } } },
  });
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.status) updateData.status = body.status;
  if (body.codStatus !== undefined) updateData.codStatus = body.codStatus;
  if (body.note !== undefined) updateData.note = body.note;
  if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags);
  if (body.deliveryCharge !== undefined) updateData.deliveryCharge = parseFloat(body.deliveryCharge) || 0;

  if (body.addPayment) {
    const payment = parseFloat(body.addPayment) || 0;
    const newPaid = order.paidAmount + payment;
    const newDue = Math.max(0, order.dueAmount - payment);
    updateData.paidAmount = newPaid;
    updateData.dueAmount = newDue;

    if (order.customerId && payment > 0) {
      await prisma.customer.update({
        where: { id: order.customerId },
        data: { dueAmount: { decrement: payment } },
      });
    }
  }

  const updated = await prisma.order.update({ where: { id }, data: updateData });

  if (body.status && body.status !== order.status && order.customer?.phone) {
    const shopName = order.user.shop?.name ?? "BizilCore";
    const phone = order.customer.phone;

    if (body.status === "confirmed") {
      triggerOrderSMS(session.user.id, "orderConfirmed", phone,
        `আপনার অর্ডার নিশ্চিত হয়েছে! মোট: ৳${order.totalAmount}। ধন্যবাদ! — ${shopName}`);
    } else if (body.status === "shipped") {
      triggerOrderSMS(session.user.id, "orderStatusChanged", phone,
        `আপনার পণ্য পাঠানো হয়েছে!${order.courierTrackId ? ` Tracking: ${order.courierTrackId}` : ""} — ${shopName}`);
    } else if (body.status === "delivered") {
      triggerOrderSMS(session.user.id, "deliveryConfirmed", phone,
        `আপনার পণ্য পৌঁছেছে! ধন্যবাদ আমাদের সাথে কেনাকাটা করার জন্য। — ${shopName}`);
    } else if (body.status !== "pending" && body.status !== "cancelled") {
      triggerOrderSMS(session.user.id, "orderStatusChanged", phone,
        `আপনার অর্ডারের অবস্থা পরিবর্তিত হয়েছে। — ${shopName}`);
    }
  }

  if (body.status && body.status !== order.status) {
    const statusLabels: Record<string, string> = {
      pending: "অপেক্ষামান", confirmed: "নিশ্চিত", processing: "প্রস্তুত",
      shipped: "শিপ", delivered: "ডেলিভারি", cancelled: "বাতিল",
    };
    const shop = order.user.shop;
    if (shop) {
      await logActivity({
        shopId: shop.id,
        userId: session.user.id,
        action: "অর্ডার স্ট্যাটাস পরিবর্তন",
        detail: `#${id.slice(-6).toUpperCase()} → ${statusLabels[body.status] ?? body.status}`,
      });

      if (body.status === "shipped") {
        createAutoTask({
          shopId: shop.id,
          userId: session.user.id,
          title: `ডেলিভারি কনফার্ম করুন #${id.slice(-6).toUpperCase()}`,
          category: "delivery",
          priority: "medium",
          dueDaysFromNow: 2,
          orderId: id,
        }).catch(() => {});
      }

      if (body.status === "delivered" && order.dueAmount > 0) {
        createAutoTask({
          shopId: shop.id,
          userId: session.user.id,
          title: `বাকি পেমেন্ট সংগ্রহ করুন #${id.slice(-6).toUpperCase()} (৳${order.dueAmount})`,
          category: "accounts",
          priority: "high",
          dueDaysFromNow: 3,
          orderId: id,
        }).catch(() => {});
      }
    }
  }

  if (body.addPayment && parseFloat(body.addPayment) > 0) {
    const shop = order.user.shop;
    if (shop) {
      await logActivity({
        shopId: shop.id,
        userId: session.user.id,
        action: "অর্ডারে পেমেন্ট যোগ",
        detail: `#${id.slice(-6).toUpperCase()} · ৳${parseFloat(body.addPayment).toLocaleString()}`,
      });
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          combo: {
            include: {
              items: { select: { productId: true, variantId: true, quantity: true } },
            },
          },
        },
      },
    },
  });
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { increment: item.quantity } },
        });
      } else if (item.comboId) {
        // Use snapshot if available so historical component list is preserved
        let components: { productId: string; variantId?: string | null; quantity: number }[] = [];
        if (item.comboSnapshot) {
          try {
            const snap = JSON.parse(item.comboSnapshot) as { items: { productId: string; variantId?: string | null; quantity: number }[] };
            components = snap.items;
          } catch { components = item.combo?.items ?? []; }
        } else {
          components = item.combo?.items ?? [];
        }
        for (const ci of components) {
          if (ci.variantId) {
            // Tolerate stale snapshot variant IDs that no longer exist
            await tx.productVariant.updateMany({
              where: { id: ci.variantId },
              data: { stockQty: { increment: ci.quantity * item.quantity } },
            });
          } else {
            await tx.product.updateMany({
              where: { id: ci.productId },
              data: { stockQty: { increment: ci.quantity * item.quantity } },
            });
          }
        }
      }
    }

    if (order.customerId && order.dueAmount > 0) {
      await tx.customer.update({
        where: { id: order.customerId },
        data: { dueAmount: { decrement: order.dueAmount } },
      });
    }

    await tx.orderItem.deleteMany({ where: { orderId: id } });
    await tx.order.delete({ where: { id } });
  });

  return NextResponse.json({ success: true });
}
