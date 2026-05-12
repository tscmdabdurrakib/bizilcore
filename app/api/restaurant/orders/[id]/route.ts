import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getShop(userId: string) {
  return prisma.shop.findUnique({
    where: { userId },
    select: { id: true, restAutoStockDeduct: true, restVatPct: true, restServiceChargePct: true },
  });
}

const ORDER_INCLUDE = {
  items: {
    include: { menuItem: { select: { id: true, name: true, category: true, price: true } } },
  },
  table: { select: { id: true, number: true, floor: true } },
  kotTickets: {
    select: { id: true, kotNumber: true, sentAt: true, kitchenStatus: true },
    orderBy: { sentAt: "desc" as const },
  },
};

function calcTotals(
  items: { unitPrice: number; quantity: number }[],
  discount: number,
  vatPct: number,
  svcPct: number
) {
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discountedBase = Math.max(0, subtotal - discount);
  const vatAmount = Math.round(discountedBase * (vatPct / 100) * 100) / 100;
  const serviceAmount = Math.round(discountedBase * (svcPct / 100) * 100) / 100;
  const totalAmount = discountedBase + vatAmount + serviceAmount;
  return { subtotal, vatAmount, serviceAmount, totalAmount };
}

const STOCK_DEDUCTED_STATUSES = ["served", "paid"];

async function deductStockIfNeeded(
  shopId: string,
  autoDeduct: boolean,
  fromStatus: string,
  toStatus: string,
  items: { quantity: number; menuItem: { recipes: { materialId: string; quantity: number }[] } }[]
) {
  if (!autoDeduct) return;
  if (!STOCK_DEDUCTED_STATUSES.includes(toStatus)) return;
  if (STOCK_DEDUCTED_STATUSES.includes(fromStatus)) return;

  for (const item of items) {
    for (const recipe of item.menuItem.recipes) {
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const existing = await prisma.restaurantOrder.findFirst({
    where: { id, shopId: shop.id },
    include: {
      items: {
        include: { menuItem: { include: { recipes: true } } },
      },
    },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: {
    action?: string;
    status?: string;
    paidAmount?: number;
    paymentMethod?: string;
    discount?: number;
    note?: string;
    menuItemId?: string;
    itemId?: string;
    quantity?: number;
  };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const action = body.action;
  const vatPct = shop.restVatPct ?? 0;
  const svcPct = shop.restServiceChargePct ?? 0;

  if (action === "add_item") {
    if (!body.menuItemId || !body.quantity || body.quantity < 1) {
      return NextResponse.json({ error: "menuItemId and quantity required" }, { status: 400 });
    }
    const menuItem = await prisma.menuItem.findFirst({
      where: { id: body.menuItemId, shopId: shop.id },
      select: { id: true, price: true },
    });
    if (!menuItem) return NextResponse.json({ error: "Menu item not found" }, { status: 404 });

    const existing_item = existing.items.find(i => i.menuItemId === body.menuItemId);
    let updatedItems: { unitPrice: number; quantity: number }[];
    if (existing_item) {
      await prisma.restaurantOrderItem.update({
        where: { id: existing_item.id },
        data: { quantity: existing_item.quantity + (body.quantity ?? 1) },
      });
      updatedItems = existing.items.map(i =>
        i.menuItemId === body.menuItemId
          ? { ...i, quantity: i.quantity + (body.quantity ?? 1) }
          : i
      );
    } else {
      await prisma.restaurantOrderItem.create({
        data: {
          orderId: id,
          menuItemId: body.menuItemId,
          quantity: body.quantity,
          unitPrice: menuItem.price,
        },
      });
      updatedItems = [...existing.items, { unitPrice: menuItem.price, quantity: body.quantity }];
    }

    const { subtotal, vatAmount, serviceAmount, totalAmount } = calcTotals(
      updatedItems, existing.discount, vatPct, svcPct
    );
    const updated = await prisma.restaurantOrder.update({
      where: { id },
      data: { subtotal, vatAmount, serviceAmount, totalAmount },
      include: ORDER_INCLUDE,
    });
    return NextResponse.json(updated);
  }

  if (action === "remove_item") {
    if (!body.itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
    const item = existing.items.find(i => i.id === body.itemId);
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    await prisma.restaurantOrderItem.delete({ where: { id: body.itemId } });
    const remainingItems = existing.items.filter(i => i.id !== body.itemId);

    if (remainingItems.length === 0) {
      await prisma.restaurantOrder.update({
        where: { id },
        data: { subtotal: 0, vatAmount: 0, serviceAmount: 0, totalAmount: 0 },
      });
    } else {
      const { subtotal, vatAmount, serviceAmount, totalAmount } = calcTotals(
        remainingItems, existing.discount, vatPct, svcPct
      );
      await prisma.restaurantOrder.update({
        where: { id },
        data: { subtotal, vatAmount, serviceAmount, totalAmount },
      });
    }
    const updated = await prisma.restaurantOrder.findFirst({ where: { id }, include: ORDER_INCLUDE });
    return NextResponse.json(updated);
  }

  if (action === "update_qty") {
    if (!body.itemId || !body.quantity || body.quantity < 1) {
      return NextResponse.json({ error: "itemId and quantity (≥1) required" }, { status: 400 });
    }
    const item = existing.items.find(i => i.id === body.itemId);
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    await prisma.restaurantOrderItem.update({
      where: { id: body.itemId },
      data: { quantity: body.quantity },
    });
    const updatedItems = existing.items.map(i =>
      i.id === body.itemId ? { ...i, quantity: body.quantity! } : i
    );
    const { subtotal, vatAmount, serviceAmount, totalAmount } = calcTotals(
      updatedItems, existing.discount, vatPct, svcPct
    );
    const updated = await prisma.restaurantOrder.update({
      where: { id },
      data: { subtotal, vatAmount, serviceAmount, totalAmount },
      include: ORDER_INCLUDE,
    });
    return NextResponse.json(updated);
  }

  if (action === "apply_discount") {
    const discount = body.discount ?? 0;
    if (discount < 0) return NextResponse.json({ error: "Discount cannot be negative" }, { status: 400 });
    const { subtotal, vatAmount, serviceAmount, totalAmount } = calcTotals(
      existing.items, discount, vatPct, svcPct
    );
    const updated = await prisma.restaurantOrder.update({
      where: { id },
      data: { discount, subtotal, vatAmount, serviceAmount, totalAmount },
      include: ORDER_INCLUDE,
    });
    return NextResponse.json(updated);
  }

  if (action === "request_bill") {
    const updated = await prisma.restaurantOrder.update({
      where: { id },
      data: { billRequested: true, status: "billing" },
      include: ORDER_INCLUDE,
    });
    return NextResponse.json(updated);
  }

  if (action === "send_kot") {
    const kotCount = await prisma.kotTicket.count({ where: { shopId: shop.id } });
    const kotNumber = `KOT-${String(kotCount + 1).padStart(4, "0")}`;
    const items = existing.items.map(i => ({
      name: i.menuItem.name,
      category: i.menuItem.category,
      quantity: i.quantity,
      note: i.note ?? null,
    }));
    const [ticket, updated] = await prisma.$transaction([
      prisma.kotTicket.create({
        data: {
          shopId: shop.id,
          orderId: id,
          kotNumber,
          items,
          kitchenStatus: "pending",
          note: existing.note ?? null,
        },
      }),
      prisma.restaurantOrder.update({
        where: { id },
        data: { kotSent: true, kotSentAt: new Date(), status: "preparing" },
        include: ORDER_INCLUDE,
      }),
    ]);
    return NextResponse.json({ ...updated, latestKot: ticket });
  }

  if (action === "mark_ready") {
    const updated = await prisma.restaurantOrder.update({
      where: { id }, data: { status: "ready" }, include: ORDER_INCLUDE,
    });
    return NextResponse.json(updated);
  }

  if (action === "mark_served") {
    await deductStockIfNeeded(shop.id, shop.restAutoStockDeduct, existing.status, "served", existing.items);
    const updated = await prisma.restaurantOrder.update({
      where: { id }, data: { status: "served" }, include: ORDER_INCLUDE,
    });
    return NextResponse.json(updated);
  }

  if (action === "complete_payment") {
    const discount = body.discount ?? existing.discount;
    const paymentMethod = body.paymentMethod ?? existing.paymentMethod ?? "cash";
    const { subtotal, vatAmount, serviceAmount, totalAmount } = calcTotals(
      existing.items, discount, vatPct, svcPct
    );

    await deductStockIfNeeded(shop.id, shop.restAutoStockDeduct, existing.status, "paid", existing.items);

    const updated = await prisma.restaurantOrder.update({
      where: { id },
      data: {
        status: "paid",
        paidAmount: totalAmount,
        paymentMethod,
        discount,
        vatAmount,
        serviceAmount,
        totalAmount,
        subtotal,
        billRequested: false,
      },
      include: ORDER_INCLUDE,
    });

    const UNPAID_STATUSES = ["pending", "preparing", "ready", "served", "billing"];
    if (existing.tableId) {
      const remaining = await prisma.restaurantOrder.count({
        where: { tableId: existing.tableId, status: { in: UNPAID_STATUSES }, id: { not: id } },
      });
      if (remaining === 0) {
        await prisma.diningTable.update({ where: { id: existing.tableId }, data: { status: "available" } });
      }
    }

    return NextResponse.json(updated);
  }

  if (action === "cancel") {
    const updated = await prisma.restaurantOrder.update({
      where: { id }, data: { status: "cancelled" }, include: ORDER_INCLUDE,
    });
    const UNPAID_STATUSES = ["pending", "preparing", "ready", "served", "billing"];
    if (existing.tableId) {
      const remaining = await prisma.restaurantOrder.count({
        where: { tableId: existing.tableId, status: { in: UNPAID_STATUSES }, id: { not: id } },
      });
      if (remaining === 0) {
        await prisma.diningTable.update({ where: { id: existing.tableId }, data: { status: "available" } });
      }
    }
    return NextResponse.json(updated);
  }

  const newStatus = body.status;

  if (newStatus !== undefined) {
    await deductStockIfNeeded(shop.id, shop.restAutoStockDeduct, existing.status, newStatus, existing.items);
  }

  const updated = await prisma.restaurantOrder.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.paidAmount !== undefined && { paidAmount: body.paidAmount }),
      ...(body.paymentMethod !== undefined && { paymentMethod: body.paymentMethod }),
      ...(body.discount !== undefined && { discount: body.discount }),
      ...(body.note !== undefined && { note: body.note }),
    },
    include: ORDER_INCLUDE,
  });

  if (newStatus === "paid" && existing.status !== "paid") {
    const UNPAID_STATUSES = ["pending", "preparing", "ready", "served", "billing"];
    if (existing.tableId) {
      const remaining = await prisma.restaurantOrder.count({
        where: { tableId: existing.tableId, status: { in: UNPAID_STATUSES }, id: { not: id } },
      });
      if (remaining === 0) {
        await prisma.diningTable.update({ where: { id: existing.tableId }, data: { status: "available" } });
      }
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const order = await prisma.restaurantOrder.findFirst({ where: { id, shopId: shop.id } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.restaurantOrder.delete({ where: { id } });

  if (order.tableId) {
    const unpaid = await prisma.restaurantOrder.count({
      where: {
        tableId: order.tableId,
        status: { in: ["pending", "preparing", "ready", "served", "billing"] },
      },
    });
    if (unpaid === 0) {
      await prisma.diningTable.update({ where: { id: order.tableId }, data: { status: "available" } });
    }
  }

  return NextResponse.json({ ok: true });
}
