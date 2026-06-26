import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { trackForUser } from "@/lib/activity/trackFromSession";

async function getShopByUser(userId: string) {
  return prisma.shop.findUnique({
    where: { userId },
    select: { id: true, restVatPct: true, restServiceChargePct: true, restOrderPrefix: true, restRequireShift: true, managerDiscountThreshold: true },
  });
}

async function getShopBySlug(slug: string) {
  return prisma.shop.findUnique({
    where: { slug },
    select: { id: true, restVatPct: true, restServiceChargePct: true, restOrderPrefix: true, restRequireShift: true, managerDiscountThreshold: true },
  });
}


const ORDER_INCLUDE = {
  items: {
    include: { menuItem: { select: { id: true, name: true, category: true } } },
  },
  table: { select: { id: true, number: true, floor: true } },
  kotTickets: { select: { id: true, kotNumber: true, sentAt: true, kitchenStatus: true } },
  waiter: { select: { id: true, user: { select: { name: true } } } },
  splits: { orderBy: { splitIndex: "asc" as const } },
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
  const shop = await getShopByUser(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const statuses = searchParams.getAll("status");
  const tableId = searchParams.get("tableId");
  const date = searchParams.get("date");
  const held = searchParams.get("held");

  let dateFilter: { gte?: Date; lt?: Date } | undefined;
  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    dateFilter = { gte: d, lt: next };
  }

  const ACTIVE_STATUSES = ["pending", "preparing", "ready", "served", "billing"];

  let statusFilter: object = {};
  if (held === "true") {
    statusFilter = { isHeld: true, status: { not: "paid" } };
  } else {
    statusFilter =
      statuses.length === 1 ? { status: statuses[0] } :
      statuses.length > 1  ? { status: { in: statuses } } :
      searchParams.get("all") === "true" ? {} :
      { status: { in: ACTIVE_STATUSES }, isHeld: false };
  }

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
  let body: {
    shopSlug?: string;
    tableNumber?: number;
    type?: string;
    tableId?: string;
    waiterId?: string | null;
    customerName?: string;
    customerPhone?: string;
    note?: string;
    paymentMethod?: string;
    discount?: number;
    discountBreakdown?: { type: string; label: string; amount: number; couponId?: string; couponCode?: string }[];
    couponCode?: string;
    managerToken?: string;
    items?: {
      menuItemId: string;
      quantity: number;
      note?: string;
      selectedVariant?: string | null;
      selectedAddons?: { name: string }[] | null;
    }[];
  };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const isQrOrder = !!body.shopSlug;

  let shop: { id: string; restVatPct: number | null; restServiceChargePct: number | null; restOrderPrefix: string | null; restRequireShift: boolean | null; managerDiscountThreshold: number | null } | null = null;
  let actorUserId: string | null = null;

  if (isQrOrder) {
    if (!body.shopSlug) return NextResponse.json({ error: "shopSlug required" }, { status: 400 });
    shop = await getShopBySlug(body.shopSlug);
    if (!shop) return NextResponse.json({ error: "রেস্তোরাঁ পাওয়া যায়নি" }, { status: 404 });
  } else {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    actorUserId = session.user.id;
    shop = await getShopByUser(session.user.id);
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  if (!body.items?.length) return NextResponse.json({ error: "Items required" }, { status: 400 });

  // ── Shift enforcement (POS orders only, not QR self-orders) ──
  if (!isQrOrder && shop.restRequireShift) {
    const activeShift = await prisma.posShift.findFirst({
      where: { shopId: shop.id, status: "open" },
      select: { id: true },
    });
    if (!activeShift) {
      return NextResponse.json(
        { error: "শিফট শুরু করা নেই। POS টার্মিনালে শিফট শুরু করুন এবং তারপর অর্ডার দিন।", code: "NO_ACTIVE_SHIFT" },
        { status: 403 }
      );
    }
  }

  const orderType = isQrOrder ? "dine_in" : (body.type ?? "dine_in");
  const orderDiscount = isQrOrder ? 0 : (body.discount ?? 0);
  const orderPaymentMethod = isQrOrder ? "cash" : (body.paymentMethod ?? "cash");
  const orderDiscountBreakdown = isQrOrder ? null : (body.discountBreakdown ?? null);
  const orderCouponCode = isQrOrder ? null : (body.couponCode ?? null);

  for (const it of body.items) {
    if (!it.menuItemId || !it.quantity || it.quantity < 1) {
      return NextResponse.json({ error: "Invalid item data" }, { status: 400 });
    }
  }

  let resolvedTableId: string | null = body.tableId ?? null;

  if (isQrOrder) {
    if (!body.tableNumber) return NextResponse.json({ error: "টেবিল নম্বর দরকার" }, { status: 400 });
    const table = await prisma.diningTable.findFirst({
      where: { shopId: shop.id, number: body.tableNumber },
    });
    if (!table) return NextResponse.json({ error: "টেবিল পাওয়া যায়নি" }, { status: 404 });
    resolvedTableId = table.id;
  }

  if (orderType === "dine_in" && !resolvedTableId) {
    return NextResponse.json({ error: "Dine-in orders require a table" }, { status: 400 });
  }

  if (resolvedTableId) {
    const table = await prisma.diningTable.findFirst({ where: { id: resolvedTableId, shopId: shop.id } });
    if (!table) return NextResponse.json({ error: "Invalid table" }, { status: 400 });

    const ACTIVE_STATUSES = ["pending", "preparing", "ready", "served", "billing"];
    const activeOrderCount = await prisma.restaurantOrder.count({
      where: { tableId: resolvedTableId, status: { in: ACTIVE_STATUSES } },
    });
    if (activeOrderCount > 0) {
      return NextResponse.json(
        { error: isQrOrder
          ? "এই টেবিলে ইতিমধ্যে একটি সক্রিয় অর্ডার চলছে। অনুগ্রহ করে ওয়েটারকে ডাকুন।"
          : "টেবিলে ইতিমধ্যে সক্রিয় অর্ডার আছে। নতুন অর্ডার দেওয়া যাবে না।" },
        { status: 409 }
      );
    }
  }

  const menuItemIds = body.items.map(it => it.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: menuItemIds },
      shopId: shop.id,
      ...(isQrOrder && { isAvailable: true }),
    },
    select: { id: true, price: true, variants: true, addons: true, category: true, name: true },
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
      selectedAddons: resolvedAddons.length > 0 ? (resolvedAddons as Prisma.InputJsonValue) : Prisma.JsonNull,
      addonTotal,
    };
  });

  const subtotal = itemsWithPrices.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);

  // Recompute auto-discounts server-side (coupon > happy hour > member + combo)
  let resolvedDiscount = orderDiscount;
  let resolvedBreakdown = orderDiscountBreakdown;

  if (!isQrOrder) {
    const { runDiscountEngine, mapPrismaCouponToEngine, customerGroupToMemberTier } =
      await import("@/lib/restaurant/discount-engine");

    let customerTier: string | null = null;
    if (body.customerPhone) {
      const cust = await prisma.customer.findFirst({
        where: { shopId: shop.id, phone: body.customerPhone },
        select: { group: true },
      });
      customerTier = customerGroupToMemberTier(cust?.group);
    }

    const activeCoupons = await prisma.coupon.findMany({
      where: { shopId: shop.id, isActive: true },
    });

    const engineItems = itemsWithPrices.map(it => {
      const mi = menuMap.get(it.menuItemId)!;
      return {
        menuItemId: it.menuItemId,
        name: mi.name,
        category: mi.category,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
      };
    });

    const engineCoupons = activeCoupons.map(mapPrismaCouponToEngine);
    const engineResult = runDiscountEngine(
      engineItems,
      engineCoupons,
      new Date(),
      customerTier,
      orderCouponCode ? orderCouponCode.toUpperCase() : null
    );

    const manualLines = (orderDiscountBreakdown ?? []).filter(d => d.type === "manual");
    const manualDiscount = manualLines.reduce((s, d) => s + d.amount, 0);
    const serverAutoDiscount = engineResult.totalDiscount;

    // When the client sends couponCode without discount/breakdown (e.g. TablesBoard flow),
    // skip client-vs-server validation and trust the engine result directly.
    const clientSentBreakdown = orderDiscountBreakdown !== null && orderDiscountBreakdown !== undefined;

    if (clientSentBreakdown) {
      const clientAutoDiscount = orderDiscount - manualDiscount;
      if (Math.abs(clientAutoDiscount - serverAutoDiscount) > 0.02) {
        return NextResponse.json(
          { error: "ছাড়ের হিসাব মিলছে না। POS রিফ্রেশ করে আবার চেষ্টা করুন।" },
          { status: 400 }
        );
      }
      resolvedDiscount = serverAutoDiscount + manualDiscount;
      resolvedBreakdown = [
        ...engineResult.discounts,
        ...manualLines,
      ];
    } else {
      // Client didn't send breakdown — use engine result directly (coupon-only flow)
      resolvedDiscount = serverAutoDiscount;
      resolvedBreakdown = engineResult.discounts.length > 0
        ? [...engineResult.discounts]
        : null;
    }
    if (resolvedBreakdown && (resolvedBreakdown as unknown[]).length === 0) resolvedBreakdown = null;
  }

  // Server-side manager threshold enforcement.
  // Auto-discounts (happyhour/member/combo/coupon) are allowed without manager approval.
  // Manual discounts — or any discount when breakdown is absent/null — require manager token
  // when the discount percentage exceeds the configured threshold.
  // A crafted request sending discountBreakdown:null with a large manual discount is blocked
  // because we treat missing/null breakdown as potentially manual when discount > threshold.
  if (!isQrOrder && resolvedDiscount > 0 && subtotal > 0) {
    const discountPct = (resolvedDiscount / subtotal) * 100;
    const shopCfg = await prisma.shop.findUnique({
      where: { id: shop.id },
      select: { managerDiscountThreshold: true },
    });
    const threshold = shopCfg?.managerDiscountThreshold ?? 20;
    if (discountPct > threshold) {
      // Allow without token ONLY if breakdown is present and contains exclusively auto-discount types
      const AUTO_TYPES = new Set(["coupon", "happyhour", "member", "bogo", "combo"]);
      const isAutoOnlyBreakdown =
        Array.isArray(resolvedBreakdown) &&
        (resolvedBreakdown as { type: string }[]).length > 0 &&
        (resolvedBreakdown as { type: string }[]).every(d => AUTO_TYPES.has(d.type));

      if (!isAutoOnlyBreakdown) {
        const token = (body.managerToken as string | undefined) ?? null;
        if (!token) {
          return NextResponse.json(
            { error: "উচ্চ ডিসকাউন্টের জন্য ম্যানেজার অনুমোদন প্রয়োজন" },
            { status: 403 }
          );
        }
        const { verifyAndConsumeManagerToken } = await import("@/lib/restaurant/manager-tokens");
        if (!verifyAndConsumeManagerToken(token, shop.id)) {
          return NextResponse.json(
            { error: "ম্যানেজার টোকেন অবৈধ বা মেয়াদোত্তীর্ণ। পুনরায় ম্যানেজার পিন দিন।" },
            { status: 403 }
          );
        }
      }
    }
  }

  const discountedBase = Math.max(0, subtotal - resolvedDiscount);
  const vatPct = shop.restVatPct ?? 0;
  const svcPct = shop.restServiceChargePct ?? 0;
  const vatAmount = Math.round(discountedBase * (vatPct / 100) * 100) / 100;
  const serviceAmount = Math.round(discountedBase * (svcPct / 100) * 100) / 100;
  const totalAmount = discountedBase + vatAmount + serviceAmount;

  const orderNumber = await generateOrderNumber(shop.id, shop.restOrderPrefix ?? null);

  let resolvedWaiterId: string | null = null;
  if (!isQrOrder && body.waiterId) {
    const waiter = await prisma.staffMember.findFirst({
      where: { id: body.waiterId, shopId: shop.id, isActive: true },
      select: { id: true },
    });
    if (!waiter) {
      return NextResponse.json({ error: "Waiter not found or inactive" }, { status: 400 });
    }
    resolvedWaiterId = waiter.id;
  }

  const couponIds = (resolvedBreakdown ?? [])
    .filter(d => d.couponId)
    .map(d => d.couponId as string);

  // Order create + table occupancy + coupon usage are one atomic unit so a
  // partial failure can never leave an order without its table/coupon updates.
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.restaurantOrder.create({
      data: {
        shopId: shop.id,
        orderNumber,
        type: orderType,
        tableId: resolvedTableId,
        waiterId: resolvedWaiterId,
        customerName: body.customerName ?? null,
        customerPhone: body.customerPhone ?? null,
        note: isQrOrder
          ? (body.note ? `[QR অর্ডার] ${body.note}` : "[QR অর্ডার]")
          : (body.note ?? null),
        paymentMethod: orderPaymentMethod,
        subtotal,
        discount: resolvedDiscount,
        vatAmount,
        serviceAmount,
        totalAmount,
        status: "pending",
        discountBreakdown: resolvedBreakdown ?? undefined,
        couponCode: orderCouponCode,
        items: { create: itemsWithPrices },
      },
      include: ORDER_INCLUDE,
    });

    if (resolvedTableId) {
      await tx.diningTable.update({
        where: { id: resolvedTableId },
        data: { status: "occupied" },
      });
    }

    for (const cId of couponIds) {
      await tx.coupon.updateMany({
        where: { id: cId, shopId: shop.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    return created;
  });

  if (actorUserId) {
    trackForUser(actorUserId, shop.id, {
      actionType: "order_created",
      actionLabel: `রেস্তোরাঁ অর্ডার: #${order.id.slice(-6).toUpperCase()}`,
      metadata: { order_id: order.id, source: "restaurant" },
    }).catch(() => {});
  }

  return NextResponse.json(order, { status: 201 });
}
