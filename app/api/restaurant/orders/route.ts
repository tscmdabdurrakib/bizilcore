import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getShop(userId: string) {
  return prisma.shop.findUnique({
    where: { userId },
    select: { id: true, restVatPct: true, restServiceChargePct: true, restOrderPrefix: true },
  });
}

const ORDER_INCLUDE = {
  items: {
    include: { menuItem: { select: { id: true, name: true, category: true } } },
  },
  table: { select: { id: true, number: true, floor: true } },
  kotTickets: { select: { id: true, kotNumber: true, sentAt: true, kitchenStatus: true } },
};

async function generateOrderNumber(shopId: string, restOrderPrefix: string | null): Promise<string> {
  const year = new Date().getFullYear();
  const pfx = restOrderPrefix ?? "RES";
  const prefix = `${pfx}-${year}-`;
  const latest = await prisma.restaurantOrder.findFirst({
    where: { shopId, orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });
  const lastSeq = latest?.orderNumber
    ? parseInt(latest.orderNumber.replace(prefix, ""), 10)
    : 0;
  return `${prefix}${String(lastSeq + 1).padStart(3, "0")}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const statuses = searchParams.getAll("status");
  const tableId = searchParams.get("tableId");
  const date = searchParams.get("date");

  let dateFilter: { gte?: Date; lt?: Date } | undefined;
  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    dateFilter = { gte: d, lt: next };
  }

  const ACTIVE_STATUSES = ["pending", "preparing", "ready", "served", "billing"];
  const statusFilter =
    statuses.length === 1 ? { status: statuses[0] } :
    statuses.length > 1  ? { status: { in: statuses } } :
    searchParams.get("all") === "true" ? {} :
    { status: { in: ACTIVE_STATUSES } };

  const orders = await prisma.restaurantOrder.findMany({
    where: {
      shopId: shop.id,
      ...statusFilter,
      ...(tableId && { tableId }),
      ...(dateFilter && { createdAt: dateFilter }),
    },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  let body: {
    type?: string;
    tableId?: string;
    customerName?: string;
    customerPhone?: string;
    note?: string;
    paymentMethod?: string;
    discount?: number;
    items?: {
      menuItemId: string;
      quantity: number;
      note?: string;
      selectedVariant?: string | null;
      selectedAddons?: { name: string }[] | null;
    }[];
  };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.items?.length) return NextResponse.json({ error: "Items required" }, { status: 400 });

  const orderType = body.type ?? "dine_in";
  if (orderType === "dine_in" && !body.tableId) {
    return NextResponse.json({ error: "Dine-in orders require a table" }, { status: 400 });
  }

  for (const it of body.items) {
    if (!it.menuItemId || !it.quantity || it.quantity < 1) {
      return NextResponse.json({ error: "Invalid item data" }, { status: 400 });
    }
  }

  if (body.tableId) {
    const table = await prisma.diningTable.findFirst({ where: { id: body.tableId, shopId: shop.id } });
    if (!table) return NextResponse.json({ error: "Invalid table" }, { status: 400 });

    const ACTIVE_STATUSES = ["pending", "preparing", "ready", "served", "billing"];
    const activeOrderCount = await prisma.restaurantOrder.count({
      where: { tableId: body.tableId, status: { in: ACTIVE_STATUSES } },
    });
    if (activeOrderCount > 0) {
      return NextResponse.json(
        { error: "টেবিলে ইতিমধ্যে সক্রিয় অর্ডার আছে। নতুন অর্ডার দেওয়া যাবে না।" },
        { status: 409 }
      );
    }
  }

  const menuItemIds = body.items.map(it => it.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds }, shopId: shop.id },
    select: { id: true, price: true, variants: true, addons: true },
  });

  if (menuItems.length !== menuItemIds.length) {
    return NextResponse.json({ error: "Invalid menu items" }, { status: 400 });
  }

  const menuMap = new Map(menuItems.map(m => [m.id, m]));

  const itemsWithPrices = body.items.map(it => {
    const menuItem = menuMap.get(it.menuItemId)!;
    const variantsArr = (menuItem.variants ?? []) as { name: string; price: number }[];
    const addonsArr   = (menuItem.addons   ?? []) as { name: string; price: number }[];

    let basePrice = menuItem.price;
    let resolvedVariant: string | null = null;
    if (it.selectedVariant) {
      const v = variantsArr.find(v => v.name === it.selectedVariant);
      if (v) { basePrice = v.price; resolvedVariant = v.name; }
    }

    const resolvedAddons: { name: string; price: number }[] = [];
    let addonTotal = 0;
    if (it.selectedAddons?.length) {
      for (const clientAddon of it.selectedAddons) {
        const a = addonsArr.find(a => a.name === clientAddon.name);
        if (a) { resolvedAddons.push(a); addonTotal += a.price; }
      }
    }

    const unitPrice = basePrice + addonTotal;

    return {
      menuItemId: it.menuItemId,
      quantity: it.quantity,
      unitPrice,
      note: it.note ?? null,
      selectedVariant: resolvedVariant,
      selectedAddons: resolvedAddons.length > 0 ? resolvedAddons : null,
      addonTotal,
    };
  });

  const subtotal = itemsWithPrices.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const discount = body.discount ?? 0;
  const discountedBase = Math.max(0, subtotal - discount);
  const vatPct = shop.restVatPct ?? 0;
  const svcPct = shop.restServiceChargePct ?? 0;
  const vatAmount = Math.round(discountedBase * (vatPct / 100) * 100) / 100;
  const serviceAmount = Math.round(discountedBase * (svcPct / 100) * 100) / 100;
  const totalAmount = discountedBase + vatAmount + serviceAmount;

  const orderNumber = await generateOrderNumber(shop.id, shop.restOrderPrefix ?? null);

  const order = await prisma.restaurantOrder.create({
    data: {
      shopId: shop.id,
      orderNumber,
      type: orderType,
      tableId: body.tableId ?? null,
      customerName: body.customerName ?? null,
      customerPhone: body.customerPhone ?? null,
      note: body.note ?? null,
      paymentMethod: body.paymentMethod ?? "cash",
      subtotal,
      discount,
      vatAmount,
      serviceAmount,
      totalAmount,
      status: "pending",
      items: { create: itemsWithPrices },
    },
    include: ORDER_INCLUDE,
  });

  if (body.tableId) {
    await prisma.diningTable.update({
      where: { id: body.tableId },
      data: { status: "occupied" },
    });
  }

  return NextResponse.json(order, { status: 201 });
}
