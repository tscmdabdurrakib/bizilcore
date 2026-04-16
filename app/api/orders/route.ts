import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";
import { triggerOrderSMS } from "@/lib/sms";
import { createAutoTask } from "@/lib/autoTasks";
import { checkAndAwardBadges } from "@/lib/badges";
import { detectFakeOrder } from "@/lib/fakeOrderDetector";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 50);
  const search = searchParams.get("search") ?? "";
  const all = searchParams.get("all") === "1";

  const where = {
    userId: session.user.id,
    ...(status && status !== "all" ? { status } : {}),
    ...(search ? { customer: { name: { contains: search, mode: "insensitive" as const } } } : {}),
  };

  const includeShape = {
    customer: { select: { id: true, name: true, phone: true } },
    items: {
      include: {
        product: { select: { id: true, name: true, buyPrice: true } },
        combo:   { select: { id: true, name: true } },
      },
    },
  };

  if (all) {
    const orders = await prisma.order.findMany({
      where,
      include: includeShape,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: includeShape,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ orders, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { customerId, newCustomerName, newCustomerPhone, newCustomerAddress, newCustomerFacebook, newCustomerGroup, items, paidAmount, source, note, deliveryCharge, tags } = body;

  // Guard: each item must have exactly one of productId or comboId
  for (const item of items as { productId?: string | null; comboId?: string | null }[]) {
    const hasProduct = !!item.productId;
    const hasCombo = !!item.comboId;
    if (hasProduct === hasCombo) {
      return NextResponse.json({ error: "Each order item must have exactly one of productId or comboId" }, { status: 400 });
    }
  }

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const phoneForCheck = newCustomerPhone || (customerId
    ? (await prisma.customer.findUnique({ where: { id: customerId }, select: { phone: true } }))?.phone ?? ""
    : "");

  let riskResult = { riskScore: 0, riskLevel: "safe" as const, flags: [] as string[], action: "allow" as const };
  if (phoneForCheck) {
    riskResult = await detectFakeOrder({
      shopId: shop.id,
      phone: phoneForCheck,
      customerName: newCustomerName || undefined,
      customerAddress: newCustomerAddress || undefined,
    });
    if (riskResult.action === "block") {
      return NextResponse.json(
        { error: `অর্ডার ব্লক হয়েছে: ${riskResult.blockReason ?? "উচ্চ-ঝুঁকির নম্বর"}` },
        { status: 403 }
      );
    }
  }

  // Separate regular product items from combo items
  const regularItems = items.filter((it: { productId?: string; comboId?: string }) => !it.comboId && it.productId);
  const comboItems = items.filter((it: { productId?: string; comboId?: string }) => !!it.comboId);

  // Fetch products — scoped to this shop to prevent cross-tenant stock manipulation
  const productIds: string[] = regularItems.map((it: { productId: string }) => it.productId);
  const uniqueProductIds = [...new Set(productIds)];
  const products = await prisma.product.findMany({
    where: { id: { in: uniqueProductIds }, shopId: shop.id },
    select: { id: true, buyPrice: true, stockQty: true },
  });
  if (products.length !== uniqueProductIds.length) {
    return NextResponse.json({ error: "One or more products do not belong to your shop" }, { status: 400 });
  }
  const productMap = Object.fromEntries(products.map(p => [p.id, p]));

  // Fetch combos with shopId validation + active check (deduplicate combo IDs)
  const uniqueComboIds: string[] = [...new Set(comboItems.map((it: { comboId: string }) => it.comboId))] as string[];
  const combos = await prisma.comboProduct.findMany({
    where: { id: { in: uniqueComboIds }, shopId: shop.id, isActive: true },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, buyPrice: true, stockQty: true } },
          variant: { select: { id: true, name: true, stockQty: true } },
        },
      },
    },
  });
  const foundComboIds = new Set(combos.map(c => c.id));
  for (const ci of comboItems) {
    if (!foundComboIds.has(ci.comboId)) {
      return NextResponse.json({ error: `Combo ${ci.comboId} not found or inactive` }, { status: 400 });
    }
  }
  const comboMap = Object.fromEntries(combos.map(c => [c.id, c]));

  const itemsTotal = items.reduce((sum: number, item: { subtotal: number }) => sum + item.subtotal, 0);
  const delivery = parseFloat(deliveryCharge) || 0;
  const totalAmount = itemsTotal + delivery;
  const paid = parseFloat(paidAmount) || 0;
  const due = Math.max(0, totalAmount - paid);

  const regularCOGS = regularItems.reduce((sum: number, item: { productId: string; quantity: number }) => {
    return sum + (productMap[item.productId]?.buyPrice ?? 0) * item.quantity;
  }, 0);
  const comboCOGS = comboItems.reduce((sum: number, item: { comboId: string; quantity: number }) => {
    const combo = comboMap[item.comboId];
    if (!combo) return sum;
    const componentCost = combo.items.reduce((cs: number, ci: { product: { buyPrice: number }; quantity: number }) => cs + ci.product.buyPrice * ci.quantity, 0);
    return sum + componentCost * item.quantity;
  }, 0);
  const totalCOGS = regularCOGS + comboCOGS;

  // Track finalCustomerId so post-transaction SMS lookup uses the correct ID
  let resolvedCustomerId: string | null = customerId || null;

  // All DB writes in a single atomic transaction
  const order = await prisma.$transaction(async (tx) => {
    if (!resolvedCustomerId && newCustomerName) {
      const customer = await tx.customer.create({
        data: {
          name: newCustomerName,
          phone: newCustomerPhone || null,
          address: newCustomerAddress || null,
          fbProfile: newCustomerFacebook || null,
          group: ["vip", "wholesale", "regular"].includes(newCustomerGroup) ? newCustomerGroup : "regular",
          shopId: shop.id,
        },
      });
      resolvedCustomerId = customer.id;
    }
    const finalCustomerId = resolvedCustomerId;

    const newOrder = await tx.order.create({
      data: {
        userId: session.user.id,
        customerId: finalCustomerId,
        status: "pending",
        source: source || "facebook",
        note: note || null,
        totalAmount,
        paidAmount: paid,
        dueAmount: due,
        deliveryCharge: delivery,
        tags: tags ? JSON.stringify(tags) : "[]",
        riskScore: riskResult.riskScore > 0 ? riskResult.riskScore : null,
        riskFlags: riskResult.flags.length > 0 ? JSON.stringify(riskResult.flags) : null,
        items: {
          create: [
            ...regularItems.map((item: { productId: string; quantity: number; unitPrice: number; subtotal: number }) => ({
              productId: item.productId,
              comboId: null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            })),
            ...comboItems.map((item: { comboId: string; quantity: number; unitPrice: number; subtotal: number }) => {
              const combo = comboMap[item.comboId];
              const snapshot = combo ? JSON.stringify({
                name: combo.name,
                items: combo.items.map((ci: { product: { name: string }; variant: { id: string; name: string } | null; quantity: number; productId: string; variantId: string | null }) => ({
                  productId: ci.productId,
                  variantId: ci.variantId ?? null,
                  name: ci.variant ? `${ci.product.name} (${ci.variant.name})` : ci.product.name,
                  quantity: ci.quantity,
                })),
              }) : null;
              return {
                productId: null,
                comboId: item.comboId,
                comboSnapshot: snapshot,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
              };
            }),
          ],
        },
      },
      include: { items: true },
    });

    // Deduct stock from regular product items
    for (const item of regularItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { decrement: item.quantity } },
      });
    }

    // Deduct stock from combo component products/variants
    for (const item of comboItems) {
      const combo = comboMap[item.comboId];
      if (!combo) continue;
      for (const ci of combo.items) {
        if (ci.variantId) {
          await tx.productVariant.update({
            where: { id: ci.variantId },
            data: { stockQty: { decrement: ci.quantity * item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: ci.productId },
            data: { stockQty: { decrement: ci.quantity * item.quantity } },
          });
        }
      }
    }

    if (finalCustomerId && due > 0) {
      await tx.customer.update({
        where: { id: finalCustomerId },
        data: { dueAmount: { increment: due } },
      });
    }

    const orderRef = `Order #${newOrder.id.slice(-6).toUpperCase()}`;
    await tx.transaction.createMany({
      data: [
        { userId: session.user.id, type: "income", amount: totalAmount, category: "বিক্রি", note: orderRef },
        ...(totalCOGS > 0
          ? [{ userId: session.user.id, type: "expense", amount: totalCOGS, category: "পণ্যের ক্রয়মূল্য (COGS)", note: orderRef }]
          : []),
      ],
    });

    return newOrder;
  });

  // Award badges in background — never block the order response
  checkAndAwardBadges(session.user.id).catch(() => {});

  // Side-effects outside transaction (failures here don't roll back the order)
  const customerName = newCustomerName || "";
  await logActivity({
    shopId: shop.id,
    userId: session.user.id,
    action: "নতুন অর্ডার তৈরি",
    detail: `অর্ডার #${order.id.slice(-6).toUpperCase()} · ৳${totalAmount.toLocaleString()}${customerName ? ` · ${customerName}` : ""}`,
  });

  const customerPhone = newCustomerPhone || (resolvedCustomerId
    ? (await prisma.customer.findUnique({ where: { id: resolvedCustomerId }, select: { phone: true } }))?.phone ?? null
    : null);
  if (customerPhone) {
    triggerOrderSMS(session.user.id, "orderConfirmed", customerPhone,
      `আপনার অর্ডার #${order.id.slice(-6).toUpperCase()} কনফার্ম হয়েছে! মোট: ৳${totalAmount}। ধন্যবাদ! — ${shop.name}`);
  }

  const shortId = order.id.slice(-6).toUpperCase();
  createAutoTask({
    shopId: shop.id,
    userId: session.user.id,
    title: `অর্ডার #${shortId} প্রস্তুত করুন`,
    category: "order",
    priority: "high",
    dueDaysFromNow: 0,
    orderId: order.id,
  }).catch(() => {});

  for (const item of items) {
    if (!item.productId) continue;
    const product = productMap[item.productId];
    if (product && product.stockQty - item.quantity <= product.stockQty * 0.2 && product.stockQty > 0) {
      const productDetails = await prisma.product.findUnique({ where: { id: item.productId }, select: { name: true, stockQty: true, lowStockAt: true } });
      if (productDetails && productDetails.stockQty - item.quantity <= productDetails.lowStockAt) {
        createAutoTask({
          shopId: shop.id,
          userId: session.user.id,
          title: `স্টক রিফিল করুন: ${productDetails.name}`,
          category: "supplier",
          priority: "urgent",
          dueDaysFromNow: 1,
        }).catch(() => {});
      }
    }
  }

  return NextResponse.json(order, { status: 201 });
}
