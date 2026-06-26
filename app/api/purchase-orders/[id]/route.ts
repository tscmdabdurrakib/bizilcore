import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";
import { receivePurchaseOrder } from "@/lib/purchase-orders/server";
import { getShopForUser, getPOForShop } from "@/lib/purchase-orders/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForUser(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const po = await getPOForShop(id, shop.id);
  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(po);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForUser(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.purchaseOrder.findFirst({
    where: { id, shopId: shop.id },
    include: { items: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Receive flow
  if (body.status === "received" || body.action === "receive") {
    try {
      const result = await receivePurchaseOrder({
        poId: id,
        shopId: shop.id,
        userId: session.user.id,
        items: body.items as { itemId: string; receivedQuantity: number }[] | undefined,
      });
      return NextResponse.json(result.po);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Receive failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  // Status-only updates
  if (body.status && body.status !== existing.status) {
    const allowed: Record<string, string[]> = {
      draft: ["sent", "cancelled"],
      sent: ["received", "partially_received", "cancelled"],
      partially_received: ["received", "cancelled"],
    };
    const canTransition = allowed[existing.status]?.includes(body.status);
    if (!canTransition && body.status !== "cancelled") {
      return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
    }

    if (body.status === "sent" && existing.status === "draft") {
      const updated = await prisma.purchaseOrder.update({
        where: { id },
        data: { status: "sent", sentAt: new Date() },
        include: {
          supplier: { select: { id: true, name: true, phone: true } },
          items: { include: { product: { select: { id: true, name: true } } } },
        },
      });
      await logActivity({
        userId: session.user.id,
        shopId: shop.id,
        action: "po_sent",
        detail: `${existing.poNumber} supplier-এ পাঠানো`,
      });
      return NextResponse.json(updated);
    }

    if (body.status === "cancelled") {
      const updated = await prisma.purchaseOrder.update({
        where: { id },
        data: { status: "cancelled" },
        include: {
          supplier: { select: { id: true, name: true, phone: true } },
          items: true,
        },
      });
      await logActivity({
        userId: session.user.id,
        shopId: shop.id,
        action: "po_cancelled",
        detail: existing.poNumber,
      });
      return NextResponse.json(updated);
    }
  }

  // Edit draft/sent PO fields
  if (!["draft", "sent", "partially_received"].includes(existing.status)) {
    return NextResponse.json({ error: "Cannot edit this PO" }, { status: 400 });
  }

  const { supplierId, items, notes, expectedDate } = body;
  const updateData: Record<string, unknown> = {};

  if (supplierId !== undefined) updateData.supplierId = supplierId || null;
  if (notes !== undefined) updateData.notes = notes || null;
  if (expectedDate !== undefined) updateData.expectedDate = expectedDate ? new Date(expectedDate) : null;

  if (items && Array.isArray(items)) {
    const typedItems = items as { name: string; productId?: string; quantity: number; unitPrice: number }[];
    const total = typedItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    updateData.total = total;

    await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
    await prisma.purchaseOrderItem.createMany({
      data: typedItems.map((item) => ({
        purchaseOrderId: id,
        name: item.name,
        productId: item.productId || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.quantity * item.unitPrice,
      })),
    });
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: updateData,
    include: {
      supplier: { select: { id: true, name: true, phone: true } },
      items: { include: { product: { select: { id: true, name: true } } } },
      purchase: { select: { id: true, totalAmount: true, dueAmount: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForUser(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const po = await prisma.purchaseOrder.findFirst({ where: { id, shopId: shop.id } });
  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!["draft", "cancelled"].includes(po.status)) {
    return NextResponse.json({ error: "Received PO cannot be deleted" }, { status: 400 });
  }

  await prisma.purchaseOrder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
