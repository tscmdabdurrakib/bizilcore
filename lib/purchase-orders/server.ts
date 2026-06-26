import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";

export async function getShopForUser(userId: string) {
  return prisma.shop.findUnique({ where: { userId } });
}

export async function getPOForShop(id: string, shopId: string) {
  return prisma.purchaseOrder.findFirst({
    where: { id, shopId },
    include: {
      supplier: true,
      items: { include: { product: { select: { id: true, name: true } } } },
      purchase: { select: { id: true, totalAmount: true, dueAmount: true } },
    },
  });
}

export interface ReceiveItemInput {
  itemId: string;
  receivedQuantity: number;
}

export async function receivePurchaseOrder({
  poId,
  shopId,
  userId,
  items,
}: {
  poId: string;
  shopId: string;
  userId: string;
  items?: ReceiveItemInput[];
}) {
  const po = await prisma.purchaseOrder.findFirst({
    where: { id: poId, shopId },
    include: { items: true, purchase: true },
  });

  if (!po) throw new Error("PO not found");
  if (po.status === "received") throw new Error("Already fully received");
  if (po.status === "cancelled") throw new Error("Cannot receive cancelled PO");
  if (po.status === "draft") throw new Error("PO must be sent before receiving");

  const receiveMap = new Map<string, number>();
  if (items?.length) {
    for (const item of items) {
      receiveMap.set(item.itemId, item.receivedQuantity);
    }
  }

  return prisma.$transaction(async (tx) => {
    let totalReceivedValue = 0;
    let allFullyReceived = true;
    let anyReceived = false;

    for (const poItem of po.items) {
      const alreadyReceived = poItem.receivedQuantity;
      const remaining = poItem.quantity - alreadyReceived;
      const toReceive = receiveMap.has(poItem.id)
        ? Math.min(Math.max(0, receiveMap.get(poItem.id)!), remaining)
        : remaining;

      if (toReceive <= 0) {
        if (alreadyReceived < poItem.quantity) allFullyReceived = false;
        continue;
      }

      anyReceived = true;
      const newReceivedQty = alreadyReceived + toReceive;
      const receivedSubtotal = toReceive * poItem.unitPrice;
      totalReceivedValue += receivedSubtotal;

      await tx.purchaseOrderItem.update({
        where: { id: poItem.id },
        data: { receivedQuantity: newReceivedQty },
      });

      if (newReceivedQty < poItem.quantity) allFullyReceived = false;

      if (poItem.productId) {
        await tx.product.update({
          where: { id: poItem.productId },
          data: { stockQty: { increment: toReceive } },
        });
        await tx.stockMovement.create({
          data: {
            productId: poItem.productId,
            userId,
            type: "in",
            quantity: toReceive,
            reason: `PO ${po.poNumber}`,
          },
        });
      }
    }

    if (!anyReceived) throw new Error("No items to receive");

    const newStatus = allFullyReceived ? "received" : "partially_received";

    const purchaseItems = po.items.map((item) => {
      const qty = receiveMap.has(item.id)
        ? Math.min(Math.max(0, receiveMap.get(item.id)!), item.quantity - item.receivedQuantity)
        : item.quantity - item.receivedQuantity;
      return {
        name: item.name,
        productId: item.productId,
        quantity: qty,
        unitPrice: item.unitPrice,
        subtotal: qty * item.unitPrice,
      };
    }).filter((i) => i.quantity > 0);

    const purchaseTotal = purchaseItems.reduce((s, i) => s + i.subtotal, 0);

    let purchase;
    if (po.purchase) {
      await tx.purchaseItem.createMany({
        data: purchaseItems.map((i) => ({
          purchaseId: po.purchase!.id,
          name: i.name,
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          subtotal: i.subtotal,
        })),
      });
      const newTotal = po.purchase.totalAmount + purchaseTotal;
      const newDue = po.purchase.dueAmount + purchaseTotal;
      purchase = await tx.purchase.update({
        where: { id: po.purchase.id },
        data: {
          totalAmount: newTotal,
          dueAmount: newDue,
          status: newDue <= 0 ? "paid" : "pending",
        },
      });
    } else {
      purchase = await tx.purchase.create({
        data: {
          shopId,
          userId,
          supplierId: po.supplierId,
          purchaseOrderId: po.id,
          totalAmount: purchaseTotal,
          paidAmount: 0,
          dueAmount: purchaseTotal,
          note: `PO ${po.poNumber} থেকে স্বয়ংক্রিয়`,
          status: purchaseTotal <= 0 ? "paid" : "pending",
          items: {
            create: purchaseItems.map((i) => ({
              name: i.name,
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              subtotal: i.subtotal,
            })),
          },
        },
      });
    }

    if (po.supplierId && purchaseTotal > 0) {
      await tx.supplier.update({
        where: { id: po.supplierId },
        data: { dueAmount: { increment: purchaseTotal } },
      });
    }

    const updated = await tx.purchaseOrder.update({
      where: { id: po.id },
      data: {
        status: newStatus,
        receivedAt: allFullyReceived ? new Date() : po.receivedAt ?? new Date(),
      },
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
        items: { include: { product: { select: { id: true, name: true } } } },
        purchase: { select: { id: true, totalAmount: true, dueAmount: true } },
      },
    });

    await logActivity({
      userId,
      shopId,
      action: "po_received",
      detail: `${po.poNumber} — ৳${purchaseTotal.toLocaleString()} · ${newStatus}`,
    });

    return { po: updated, purchase, totalReceivedValue };
  });
}

export async function generatePONumber(shopId: string): Promise<string> {
  const count = await prisma.purchaseOrder.count({ where: { shopId } });
  return `PO-${String(count + 1).padStart(4, "0")}`;
}
