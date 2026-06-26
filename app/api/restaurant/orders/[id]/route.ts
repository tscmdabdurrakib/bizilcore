import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  runDiscountEngine,
  mapPrismaCouponToEngine,
  customerGroupToMemberTier,
} from "@/lib/restaurant/discount-engine";

async function getShop(userId: string) {
  return prisma.shop.findUnique({
    where: { userId },
    select: {
      id: true,
      restAutoStockDeduct: true,
      restVatPct: true,
      restServiceChargePct: true,
      managerPin: true,
      restVoidThresholdHours: true,
    },
  });
}

async function verifyManagerPin(
  managerPin: string | null | undefined,
  pin: string
): Promise<{ ok: boolean; error?: string }> {
  if (!pin) return { ok: false, error: "PIN প্রয়োজন" };
  if (!managerPin) return { ok: false, error: "Manager PIN সেট করা নেই। আগে সেটিংস থেকে PIN সেট করুন।" };
  const ok = await bcrypt.compare(pin, managerPin);
  return ok ? { ok: true } : { ok: false, error: "ভুল PIN" };
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
  waiter: { select: { id: true, user: { select: { name: true } } } },
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

type StockClient = Pick<typeof prisma, "rawMaterial"> | Prisma.TransactionClient;

async function restoreStockIfNeeded(
  shopId: string,
  autoDeduct: boolean,
  fromStatus: string,
  items: { quantity: number; menuItem: { recipes: { materialId: string; quantity: number }[] } }[],
  db: StockClient = prisma
) {
  if (!autoDeduct) return;
  if (!STOCK_DEDUCTED_STATUSES.includes(fromStatus)) return;

  for (const item of items) {
    for (const recipe of item.menuItem.recipes ?? []) {
      await db.rawMaterial.updateMany({
        where: { id: recipe.materialId, shopId },
        data: { currentStock: { increment: recipe.quantity * item.quantity } },
      });
    }
  }
}

async function deductStockIfNeeded(
  shopId: string,
  autoDeduct: boolean,
  fromStatus: string,
  toStatus: string,
  items: { quantity: number; menuItem: { recipes: { materialId: string; quantity: number }[] } }[],
  db: StockClient = prisma
) {
  if (!autoDeduct) return;
  if (!STOCK_DEDUCTED_STATUSES.includes(toStatus)) return;
  if (STOCK_DEDUCTED_STATUSES.includes(fromStatus)) return;

  for (const item of items) {
    for (const recipe of item.menuItem.recipes) {
      await db.rawMaterial.updateMany({
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
    tipAmount?: number;
    waiterId?: string | null;
    note?: string;
    menuItemId?: string;
    itemId?: string;
    itemIds?: string[];
    quantity?: number;
    pin?: string;
    voidReason?: string;
    refundAmount?: number;
    refundReason?: string;
    couponCode?: string;
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

  /* ── APPLY COUPON TO ACTIVE ORDER ─────────────────────────────── */
  if (action === "apply_coupon") {
    const code = (body.couponCode as string | undefined)?.trim().toUpperCase();
    if (!code) return NextResponse.json({ error: "কুপন কোড দিন" }, { status: 400 });
    if (["paid", "cancelled"].includes(existing.status)) {
      return NextResponse.json({ error: "এই অর্ডারে কুপন প্রয়োগ করা যাবে না" }, { status: 400 });
    }

    const engineItems = existing.items.filter(i => !i.isVoided).map(i => ({
      menuItemId: i.menuItemId,
      name: i.menuItem.name,
      category: i.menuItem.category,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
    }));

    let customerTier: string | null = null;
    if (existing.customerPhone) {
      const cust = await prisma.customer.findFirst({
        where: { shopId: shop.id, phone: existing.customerPhone },
        select: { group: true },
      });
      customerTier = customerGroupToMemberTier(cust?.group);
    }

    const activeCoupons = await prisma.coupon.findMany({
      where: { shopId: shop.id, isActive: true },
    });
    const engineCoupons = activeCoupons.map(mapPrismaCouponToEngine);
    const result = runDiscountEngine(engineItems, engineCoupons, new Date(), customerTier, code);

    const couponDiscount = result.discounts.find(d => d.type === "coupon" && d.couponCode === code);
    if (!couponDiscount) {
      return NextResponse.json({ error: "কুপন প্রযোজ্য নয়" }, { status: 400 });
    }

    // Calculate auto-discounts (happy hour / member) that also apply
    const autoDiscounts = result.discounts.filter(d => d.type !== "coupon");
    const totalAutoDiscount = couponDiscount.amount + autoDiscounts.reduce((s, d) => s + d.amount, 0);

    const discountBreakdown: { type: string; label: string; amount: number; couponId?: string; couponCode?: string }[] = [
      couponDiscount,
      ...autoDiscounts,
    ];

    // Handle BOGO: add free/discounted item to the order
    const bogoSuggestion = result.bogoSuggestions[0];
    if (bogoSuggestion) {
      const getItemId = bogoSuggestion.getItemId ?? bogoSuggestion.triggerItemId;
      const getMenuItem = await prisma.menuItem.findFirst({
        where: { id: getItemId, shopId: shop.id },
        select: { id: true, price: true, name: true },
      });
      if (getMenuItem) {
        const discountPct = bogoSuggestion.getDiscountPct ?? 100;
        const freeUnitPrice = Math.round(getMenuItem.price * (1 - discountPct / 100) * 100) / 100;
        await prisma.restaurantOrderItem.create({
          data: {
            orderId: id,
            menuItemId: getMenuItem.id,
            quantity: bogoSuggestion.getQty,
            unitPrice: freeUnitPrice,
            note: `🎁 BOGO: ${code}`,
          },
        });
      }
    }

    // Fetch latest items after possible BOGO item addition
    const orderAfterBogo = await prisma.restaurantOrder.findFirst({
      where: { id },
      include: { items: { include: { menuItem: { select: { id: true, name: true, category: true } } } } },
    });
    const allItems = (orderAfterBogo?.items ?? []).filter(i => !i.isVoided);
    const { subtotal, vatAmount, serviceAmount, totalAmount } = calcTotals(
      allItems, totalAutoDiscount, vatPct, svcPct
    );

    await prisma.restaurantOrder.update({
      where: { id },
      data: {
        discount: totalAutoDiscount,
        subtotal, vatAmount, serviceAmount, totalAmount,
        couponCode: code,
        discountBreakdown: discountBreakdown,
      },
    });

    // Increment usedCount for the applied coupon
    await prisma.coupon.updateMany({
      where: { id: couponDiscount.couponId, shopId: shop.id },
      data: { usedCount: { increment: 1 } },
    });

    const updated = await prisma.restaurantOrder.findFirst({
      where: { id },
      include: { ...ORDER_INCLUDE, splits: { orderBy: { splitIndex: "asc" as const } } },
    });
    return NextResponse.json(updated);
  }

  /* ── REMOVE COUPON FROM ACTIVE ORDER ──────────────────────────── */
  if (action === "remove_coupon") {
    if (["paid", "cancelled"].includes(existing.status)) {
      return NextResponse.json({ error: "এই অর্ডারে কুপন সরানো যাবে না" }, { status: 400 });
    }

    // Remove BOGO items (note starts with "🎁 BOGO:")
    const bogoItems = existing.items.filter(i => i.note?.startsWith("🎁 BOGO:"));
    for (const bogoItem of bogoItems) {
      await prisma.restaurantOrderItem.delete({ where: { id: bogoItem.id } });
    }

    const remainingItems = existing.items.filter(i => !i.note?.startsWith("🎁 BOGO:") && !i.isVoided);

    // Re-run auto-discounts without the coupon code (happy hour / member still apply)
    const engineItems = remainingItems.map(i => ({
      menuItemId: i.menuItemId,
      name: i.menuItem.name,
      category: i.menuItem.category,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
    }));

    let customerTier: string | null = null;
    if (existing.customerPhone) {
      const cust = await prisma.customer.findFirst({
        where: { shopId: shop.id, phone: existing.customerPhone },
        select: { group: true },
      });
      customerTier = customerGroupToMemberTier(cust?.group);
    }

    const activeCoupons = await prisma.coupon.findMany({
      where: { shopId: shop.id, isActive: true },
    });
    const engineCoupons = activeCoupons.map(mapPrismaCouponToEngine);
    // Run engine WITHOUT any coupon code — only auto-discounts remain
    const result = runDiscountEngine(engineItems, engineCoupons, new Date(), customerTier, null);
    const autoDiscount = result.totalDiscount;

    const { subtotal, vatAmount, serviceAmount, totalAmount } = calcTotals(
      remainingItems, autoDiscount, vatPct, svcPct
    );

    const newBreakdown = result.discounts.length > 0
      ? result.discounts.map(d => ({ ...d }))
      : null;

    await prisma.restaurantOrder.update({
      where: { id },
      data: {
        discount: autoDiscount,
        subtotal, vatAmount, serviceAmount, totalAmount,
        couponCode: null,
        discountBreakdown: newBreakdown ?? undefined,
      },
    });

    const updated = await prisma.restaurantOrder.findFirst({
      where: { id },
      include: { ...ORDER_INCLUDE, splits: { orderBy: { splitIndex: "asc" as const } } },
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

  if (action === "assign_waiter") {
    if (body.waiterId === undefined) {
      return NextResponse.json({ error: "waiterId required" }, { status: 400 });
    }
    if (body.waiterId !== null) {
      const waiter = await prisma.staffMember.findFirst({
        where: { id: body.waiterId, shopId: shop.id, isActive: true },
        select: { id: true },
      });
      if (!waiter) return NextResponse.json({ error: "Waiter not found" }, { status: 404 });
    }
    const updated = await prisma.restaurantOrder.update({
      where: { id },
      data: { waiterId: body.waiterId },
      include: ORDER_INCLUDE,
    });
    return NextResponse.json(updated);
  }

  if (action === "complete_payment") {
    const discount = body.discount ?? existing.discount;
    const tipAmount = Math.max(0, body.tipAmount ?? 0);
    const paymentMethod = body.paymentMethod ?? existing.paymentMethod ?? "cash";
    const { subtotal, vatAmount, serviceAmount, totalAmount } = calcTotals(
      existing.items, discount, vatPct, svcPct
    );

    // Active shift (if any) — cash payments are recorded against the drawer.
    const activeShift = paymentMethod === "cash"
      ? await prisma.posShift.findFirst({ where: { shopId: shop.id, status: "open" }, select: { id: true } })
      : null;
    const performedBy = String(session.user.name || "POS");

    const UNPAID_STATUSES = ["pending", "preparing", "ready", "served", "billing"];

    const updated = await prisma.$transaction(async (tx) => {
      await deductStockIfNeeded(shop.id, shop.restAutoStockDeduct, existing.status, "paid", existing.items, tx);

      const ord = await tx.restaurantOrder.update({
        where: { id },
        data: {
          status: "paid",
          paidAmount: totalAmount,
          dueAmount: 0,
          tipAmount,
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

      // Cash sale → drawer log + expected-cash bump so shift reconciliation is correct.
      if (activeShift) {
        await tx.cashDrawerLog.create({
          data: {
            shopId: shop.id,
            shiftId: activeShift.id,
            type: "sale",
            amount: totalAmount,
            note: `Order #${ord.orderNumber ?? id}`,
            performedBy,
          },
        });
        await tx.posShift.update({
          where: { id: activeShift.id },
          data: { expectedCash: { increment: totalAmount } },
        });
      }

      if (existing.tableId) {
        const remaining = await tx.restaurantOrder.count({
          where: { tableId: existing.tableId, status: { in: UNPAID_STATUSES }, id: { not: id } },
        });
        if (remaining === 0) {
          await tx.diningTable.update({ where: { id: existing.tableId }, data: { status: "available" } });
        }
      }

      return ord;
    });

    return NextResponse.json(updated);
  }

  if (action === "cancel") {
    await restoreStockIfNeeded(shop.id, shop.restAutoStockDeduct, existing.status, existing.items);
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

  /* ── VOID ENTIRE ORDER ─────────────────────────────────────── */
  if (action === "void_order") {
    if (existing.isVoided) return NextResponse.json({ error: "অর্ডার ইতিমধ্যে ভয়েড করা হয়েছে" }, { status: 400 });

    const pinResult = await verifyManagerPin(shop.managerPin, body.pin ?? "");
    if (!pinResult.ok) return NextResponse.json({ error: pinResult.error }, { status: 401 });

    const threshold = shop.restVoidThresholdHours ?? 24;
    const hoursSince = (Date.now() - existing.createdAt.getTime()) / 3600000;
    if (hoursSince > threshold) {
      return NextResponse.json(
        { error: `${threshold} ঘণ্টার বেশি পুরনো অর্ডার ভয়েড করা যাবে না` },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } });

    await restoreStockIfNeeded(shop.id, shop.restAutoStockDeduct, existing.status, existing.items);

    const updated = await prisma.restaurantOrder.update({
      where: { id },
      data: {
        isVoided: true,
        voidedAt: new Date(),
        voidReason: body.voidReason ?? "other",
        voidedBy: user?.name ?? "Manager",
        status: "cancelled",
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

  /* ── VOID SPECIFIC ITEMS ───────────────────────────────────── */
  if (action === "void_items") {
    const itemIds: string[] = body.itemIds ?? [];
    if (itemIds.length === 0) return NextResponse.json({ error: "কমপক্ষে একটি আইটেম নির্বাচন করুন" }, { status: 400 });

    const pinResult = await verifyManagerPin(shop.managerPin, body.pin ?? "");
    if (!pinResult.ok) return NextResponse.json({ error: pinResult.error }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } });

    const itemsToVoid = existing.items.filter(i => itemIds.includes(i.id) && !i.isVoided);
    if (itemsToVoid.length === 0) return NextResponse.json({ error: "নির্বাচিত আইটেমগুলি ইতিমধ্যে ভয়েড বা অবৈধ" }, { status: 400 });

    if (STOCK_DEDUCTED_STATUSES.includes(existing.status)) {
      await restoreStockIfNeeded(shop.id, shop.restAutoStockDeduct, existing.status, itemsToVoid);
    }

    await prisma.restaurantOrderItem.updateMany({
      where: { id: { in: itemIds }, orderId: id },
      data: { isVoided: true },
    });

    const activeItems = existing.items
      .filter(i => !i.isVoided && !itemIds.includes(i.id));

    const vatPct2 = shop.restVatPct ?? 0;
    const svcPct2 = shop.restServiceChargePct ?? 0;
    const { subtotal, vatAmount, serviceAmount, totalAmount } = calcTotals(activeItems, existing.discount, vatPct2, svcPct2);

    const voidNote = `ভয়েড (${user?.name ?? "Manager"}): ${body.voidReason ?? "other"}`;
    const updated = await prisma.restaurantOrder.update({
      where: { id },
      data: {
        subtotal, vatAmount, serviceAmount, totalAmount,
        note: existing.note ? `${existing.note} | ${voidNote}` : voidNote,
      },
      include: ORDER_INCLUDE,
    });
    return NextResponse.json(updated);
  }

  /* ── PROCESS REFUND ────────────────────────────────────────── */
  if (action === "process_refund") {
    if (existing.status !== "paid") {
      return NextResponse.json({ error: "শুধুমাত্র পেইড অর্ডারে রিফান্ড প্রযোজ্য" }, { status: 400 });
    }
    if (existing.refundedAt) {
      return NextResponse.json({ error: "এই অর্ডারে ইতিমধ্যে রিফান্ড প্রক্রিয়া করা হয়েছে" }, { status: 400 });
    }

    const pinResult = await verifyManagerPin(shop.managerPin, body.pin ?? "");
    if (!pinResult.ok) return NextResponse.json({ error: pinResult.error }, { status: 401 });

    const refundAmount = body.refundAmount ?? 0;
    if (refundAmount <= 0) return NextResponse.json({ error: "রিফান্ডের পরিমাণ শূন্যের বেশি হতে হবে" }, { status: 400 });
    if (refundAmount > existing.totalAmount) {
      return NextResponse.json({ error: "রিফান্ডের পরিমাণ মোট অর্ডারের বেশি হতে পারবে না" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } });

    const updated = await prisma.restaurantOrder.update({
      where: { id },
      data: {
        refundedAt: new Date(),
        refundAmount,
        refundReason: body.refundReason ?? "other",
        refundedBy: user?.name ?? "Manager",
      },
      include: ORDER_INCLUDE,
    });
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
