import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSMS, decryptApiKey } from "@/lib/sms";
import { detectFakeOrder } from "@/lib/fakeOrderDetector";

const MAX_ITEM_QTY = 999;
const MAX_ITEMS = 50;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  if (ipRequestMap.size > 10_000) {
    for (const [key, val] of ipRequestMap) {
      if (now > val.resetAt) ipRequestMap.delete(key);
    }
  }
  const entry = ipRequestMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRequestMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 900000) + 100000;
  return `ORD-${y}${m}${d}-${rand}`;
}

async function generateUniqueOrderNumber(maxAttempts = 5): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const orderNumber = generateOrderNumber();
    const exists = await prisma.storeOrder.findFirst({ where: { orderNumber }, select: { id: true } });
    if (!exists) return orderNumber;
  }
  throw new Error("অর্ডার নম্বর তৈরি করা যায়নি, আবার চেষ্টা করুন।");
}

function validateItems(items: unknown): { productId: string; variantId?: string; quantity: number }[] {
  if (!Array.isArray(items) || items.length === 0) throw new Error("কার্টে কোনো পণ্য নেই।");
  if (items.length > MAX_ITEMS) throw new Error(`একবারে সর্বোচ্চ ${MAX_ITEMS}টি পণ্য অর্ডার করা যাবে।`);
  return items.map((item, i) => {
    if (!item || typeof item !== "object") throw new Error(`আইটেম ${i + 1}: অবৈধ।`);
    const { productId, variantId, quantity } = item as Record<string, unknown>;
    if (typeof productId !== "string" || !productId.trim()) throw new Error(`আইটেম ${i + 1}: পণ্য ID নেই।`);
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0 || qty > MAX_ITEM_QTY) {
      throw new Error(`আইটেম ${i + 1}: পরিমাণ অবৈধ (১–${MAX_ITEM_QTY} এর মধ্যে হতে হবে)।`);
    }
    return {
      productId: productId.trim(),
      variantId: typeof variantId === "string" ? variantId.trim() : undefined,
      quantity: qty,
    };
  });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!shop) return Response.json({ error: "Shop not found" }, { status: 404 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const paymentMethod = url.searchParams.get("paymentMethod");
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");

  const where: Record<string, unknown> = { shopId: shop.id };
  if (status) where.status = status;
  if (paymentMethod) where.paymentMethod = paymentMethod;
  if (dateFrom || dateTo) {
    const createdAt: Record<string, Date> = {};
    if (dateFrom) createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      createdAt.lte = to;
    }
    where.createdAt = createdAt;
  }

  const orders = await prisma.storeOrder.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return Response.json(orders);
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "অনেক বেশি অনুরোধ। কিছুক্ষণ পর আবার চেষ্টা করুন।" }, { status: 429 });
    }

    const body = await req.json();
    const {
      slug, customerName, customerPhone, customerAddress, customerDistrict, customerUpazila,
      customerNote, items: rawItems, paymentMethod, transactionId, couponCode,
    } = body;

    if (!slug || !customerName || !customerPhone || !customerAddress) {
      return NextResponse.json({ error: "প্রয়োজনীয় তথ্য দেওয়া হয়নি।" }, { status: 400 });
    }

    let validatedItems: { productId: string; variantId?: string; quantity: number }[];
    let storeRiskResult = { riskScore: 0, riskLevel: "safe" as const, flags: [] as string[], action: "allow" as const };
    try {
      validatedItems = validateItems(rawItems);
    } catch (err: unknown) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }

    const shop = await prisma.shop.findUnique({
      where: { storeSlug: slug },
      select: {
        id: true, name: true, phone: true, userId: true,
        storeEnabled: true, storeShippingFee: true, storeDhakaFee: true, storeFreeShipping: true,
        storeCODEnabled: true, storeBkashNumber: true, storeNagadNumber: true,
        storeMinOrder: true,
      },
    });
    if (!shop || !shop.storeEnabled) {
      return NextResponse.json({ error: "স্টোর পাওয়া যায়নি।" }, { status: 404 });
    }

    storeRiskResult = await detectFakeOrder({
      shopId: shop.id,
      phone: customerPhone,
      customerName,
      customerAddress,
    });
    if (storeRiskResult.action === "block") {
      return NextResponse.json(
        { error: `অর্ডার গ্রহণ করা যায়নি: ${storeRiskResult.blockReason ?? "উচ্চ-ঝুঁকির নম্বর"}` },
        { status: 403 }
      );
    }

    const ALLOWED_PAYMENT_METHODS = ["cod", "bkash", "nagad"] as const;
    type PaymentMethod = typeof ALLOWED_PAYMENT_METHODS[number];
    if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ error: "অবৈধ পেমেন্ট পদ্ধতি।" }, { status: 400 });
    }
    const pm = paymentMethod as PaymentMethod;

    if (pm === "cod" && !shop.storeCODEnabled) {
      return NextResponse.json({ error: "Cash on Delivery এ অর্ডার নেওয়া হচ্ছে না।" }, { status: 400 });
    }
    if (pm === "bkash" && !shop.storeBkashNumber) {
      return NextResponse.json({ error: "বিকাশ পেমেন্ট সংযুক্ত নেই।" }, { status: 400 });
    }
    if (pm === "nagad" && !shop.storeNagadNumber) {
      return NextResponse.json({ error: "নগদ পেমেন্ট সংযুক্ত নেই।" }, { status: 400 });
    }
    if ((pm === "bkash" || pm === "nagad") && (!transactionId || typeof transactionId !== "string" || !transactionId.trim())) {
      return NextResponse.json({ error: "Transaction ID প্রয়োজন।" }, { status: 400 });
    }

    const isDhaka = ["ঢাকা", "গাজীপুর", "নারায়ণগঞ্জ", "মানিকগঞ্জ", "মুন্সিগঞ্জ", "নরসিংদী"].includes(customerDistrict || "");
    let shippingFee = isDhaka ? (shop.storeDhakaFee ?? 60) : (shop.storeShippingFee ?? 120);

    let subtotal = 0;
    const itemLines: {
      productId: string; variantId?: string; productName: string;
      variantName?: string; quantity: number; unitPrice: number; subtotal: number;
    }[] = [];

    for (const item of validatedItems) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, shopId: shop.id, storeVisible: true },
        select: {
          id: true, name: true, sellPrice: true, stockQty: true, hasVariants: true,
          variants: { select: { id: true, name: true, price: true, stockQty: true } },
        },
      });
      if (!product) {
        return NextResponse.json({ error: `পণ্য পাওয়া যায়নি।` }, { status: 400 });
      }

      let unitPrice = product.sellPrice;
      let variantName: string | undefined;
      let availableStock = product.stockQty;

      if (product.hasVariants && product.variants.length > 0) {
        if (!item.variantId) {
          return NextResponse.json({ error: `"${product.name}" এর জন্য ভ্যারিয়েন্ট বেছে নেওয়া প্রয়োজন।` }, { status: 400 });
        }
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          return NextResponse.json({ error: `"${product.name}" এর নির্বাচিত ভ্যারিয়েন্ট পাওয়া যায়নি।` }, { status: 400 });
        }
        if (variant.price != null) unitPrice = variant.price;
        variantName = variant.name;
        availableStock = variant.stockQty;
      } else if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (variant) {
          if (variant.price != null) unitPrice = variant.price;
          variantName = variant.name;
          availableStock = variant.stockQty;
        }
      }

      if (availableStock <= 0) {
        return NextResponse.json({ error: `"${product.name}"${variantName ? ` (${variantName})` : ""} স্টক শেষ।` }, { status: 400 });
      }
      if (item.quantity > availableStock) {
        return NextResponse.json({ error: `"${product.name}"${variantName ? ` (${variantName})` : ""} এ মাত্র ${availableStock}টি আছে।` }, { status: 400 });
      }

      const lineSubtotal = unitPrice * item.quantity;
      subtotal += lineSubtotal;
      itemLines.push({
        productId: product.id,
        variantId: item.variantId,
        productName: product.name,
        variantName,
        quantity: item.quantity,
        unitPrice,
        subtotal: lineSubtotal,
      });
    }

    if (shop.storeMinOrder && subtotal < shop.storeMinOrder) {
      return NextResponse.json({ error: `ন্যূনতম অর্ডার ৳${shop.storeMinOrder} হতে হবে।` }, { status: 400 });
    }

    if (shop.storeFreeShipping && subtotal >= shop.storeFreeShipping) {
      shippingFee = 0;
    }

    let discountAmount = 0;
    let appliedCouponCode: string | undefined;
    if (couponCode && typeof couponCode === "string") {
      const coupon = await prisma.coupon.findFirst({
        where: { shopId: shop.id, code: couponCode.trim().toUpperCase(), isActive: true },
      });
      if (coupon) {
        const now = new Date();
        const expired = coupon.expiresAt && coupon.expiresAt < now;
        const exhausted = coupon.maxUse && coupon.usedCount >= coupon.maxUse;
        if (!expired && !exhausted && (!coupon.minOrder || subtotal >= coupon.minOrder)) {
          discountAmount = coupon.type === "percent"
            ? (subtotal * coupon.value) / 100
            : coupon.value;
          if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
          discountAmount = Math.min(discountAmount, subtotal);
          appliedCouponCode = coupon.code;
        }
      }
    }

    const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);
    const orderNumber = await generateUniqueOrderNumber();
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    const storeOrder = await prisma.$transaction(async (tx) => {
      const so = await tx.storeOrder.create({
        data: {
          shopId: shop.id,
          orderNumber,
          customerName,
          customerPhone,
          customerAddress,
          customerDistrict: customerDistrict || null,
          customerUpazila: customerUpazila || null,
          customerNote: customerNote || null,
          subtotal,
          shippingFee,
          discountAmount,
          totalAmount,
          paymentMethod,
          transactionId: transactionId || null,
          couponCode: appliedCouponCode || null,
          ipAddress,
          riskScore: storeRiskResult.riskScore > 0 ? storeRiskResult.riskScore : null,
          riskFlags: storeRiskResult.flags.length > 0 ? JSON.stringify(storeRiskResult.flags) : null,
          items: {
            create: itemLines.map(i => ({
              productId: i.productId,
              variantId: i.variantId || null,
              productName: i.productName,
              variantName: i.variantName || null,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              subtotal: i.subtotal,
            })),
          },
        },
      });

      await tx.order.create({
        data: {
          userId: shop.userId,
          source: "store",
          status: "pending",
          totalAmount,
          paidAmount: paymentMethod !== "cod" ? totalAmount : 0,
          dueAmount: paymentMethod !== "cod" ? 0 : totalAmount,
          deliveryCharge: shippingFee,
          note: [
            `📦 স্টোর অর্ডার #${orderNumber}`,
            `👤 ${customerName} | 📞 ${customerPhone}`,
            `📍 ${customerAddress}${customerDistrict ? `, ${customerDistrict}` : ""}`,
            customerNote ? `📝 ${customerNote}` : null,
            paymentMethod !== "cod" && transactionId ? `💳 TxID: ${transactionId}` : null,
          ].filter(Boolean).join("\n"),
          storeOrderId: so.id,
          items: {
            create: itemLines.map(i => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              subtotal: i.subtotal,
            })),
          },
        },
      });

      if (appliedCouponCode) {
        const couponForUpdate = await tx.coupon.findFirst({
          where: { shopId: shop.id, code: appliedCouponCode, isActive: true },
          select: { id: true, maxUse: true, usedCount: true },
        });
        if (!couponForUpdate || (couponForUpdate.maxUse !== null && couponForUpdate.usedCount >= couponForUpdate.maxUse)) {
          throw new Error("কুপন কোডটি ব্যবহারের সীমা শেষ হয়ে গেছে।");
        }
        await tx.coupon.update({
          where: { id: couponForUpdate.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      for (const item of itemLines) {
        if (item.variantId) {
          const decremented = await tx.productVariant.updateMany({
            where: { id: item.variantId, stockQty: { gte: item.quantity } },
            data: { stockQty: { decrement: item.quantity } },
          });
          if (decremented.count === 0) throw new Error(`"${item.productName}"${item.variantName ? ` (${item.variantName})` : ""} এর স্টক শেষ হয়ে গেছে।`);
        } else {
          const decremented = await tx.product.updateMany({
            where: { id: item.productId, stockQty: { gte: item.quantity } },
            data: { stockQty: { decrement: item.quantity } },
          });
          if (decremented.count === 0) throw new Error(`"${item.productName}" এর স্টক শেষ হয়ে গেছে।`);
        }
      }

      return so;
    });

    sendSMSNotifications(shop, slug, storeOrder.orderNumber, customerName, customerPhone, totalAmount);

    return NextResponse.json({ orderNumber: storeOrder.orderNumber }, { status: 201 });
  } catch (err) {
    console.error("[store/orders] POST error:", err);
    return NextResponse.json({ error: "অর্ডার তৈরি করা যায়নি।" }, { status: 500 });
  }
}

async function sendSMSNotifications(
  shop: { userId: string; name: string; phone: string | null },
  slug: string,
  orderNumber: string,
  customerName: string,
  customerPhone: string,
  total: number
) {
  try {
    const smsSettings = await prisma.smsSettings.findUnique({ where: { userId: shop.userId } });
    if (!smsSettings?.isConnected || !smsSettings.apiKey) return;
    const apiKey = decryptApiKey(smsSettings.apiKey);

    if (shop.phone) {
      sendSMS(apiKey, shop.phone,
        `নতুন অর্ডার! #${orderNumber}\n${customerName} | ৳${total.toLocaleString()}\nBizilCore Dashboard এ দেখুন।`
      ).catch(() => {});
    }

    sendSMS(apiKey, customerPhone,
      `আপনার অর্ডার পেয়েছি!\nঅর্ডার নং: #${orderNumber}\nট্র্যাক করুন: bizilcore.com/store/${slug}/track\n- ${shop.name}`
    ).catch(() => {});
  } catch {}
}
