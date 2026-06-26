import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/logActivity";
import { trackForUser } from "@/lib/activity/trackFromSession";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { triggerAutoOrderSMS } from "@/lib/sms/send";
import { createAutoTask } from "@/lib/autoTasks";
import { createSaleJournalFromOrder } from "@/lib/accounting/journal-from-order";

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

  if (body.status === "delivered" && order.status !== "delivered" && order.user.shop) {
    const shop = order.user.shop;
    const fullOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: { select: { buyPrice: true } } } } },
    });
    if (fullOrder) {
      await prisma.$transaction(async (tx) => {
        await createSaleJournalFromOrder(
          tx,
          shop.id,
          session.user.id,
          {
            ...fullOrder,
            paymentMethod: fullOrder.paymentMethod ?? (fullOrder.dueAmount > 0 ? "cod" : "cash"),
          },
          {
            vatEnabled: shop.vatEnabled ?? false,
            vatRate: shop.vatRate ?? 15,
            vatMethod: shop.vatMethod ?? "inclusive",
          },
        );
      });
    }
  }

  if (body.status && body.status !== order.status && order.customer?.phone) {
    const shopName = order.user.shop?.name ?? "BizilCore";
    const phone = order.customer.phone;
    const orderId = id.slice(-6).toUpperCase();
    const statusLabels: Record<string, string> = {
      pending: "অপেক্ষামান", confirmed: "নিশ্চিত", processing: "প্রস্তুত",
      shipped: "শিপ", delivered: "ডেলিভারি", cancelled: "বাতিল",
    };

    if (body.status !== "pending" && body.status !== "cancelled") {
      triggerAutoOrderSMS(
        session.user.id,
        "order_status_change",
        phone,
        {
          order_id: orderId,
          customer_name: order.customer.name ?? "",
          amount: String(order.totalAmount),
          status: statusLabels[body.status] ?? body.status,
          shopName,
        },
        order.customerId ?? undefined
      ).catch(() => {});
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
      trackForUser(session.user.id, shop.id, {
        actionType: "order_status_changed",
        actionLabel: `অর্ডার স্ট্যাটাস পরিবর্তন: #${id.slice(-6).toUpperCase()} → ${statusLabels[body.status] ?? body.status}`,
        metadata: { order_id: id, new_status: body.status, old_status: order.status },
      }).catch(() => {});

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
    const { restoreOrderStock } = await import("@/lib/shops/order-stock");
    await restoreOrderStock(tx, order.branchId, order.items);

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
