import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSMS, decryptApiKey } from "@/lib/sms";
import { detectFakeOrder, type RiskResult } from "@/lib/fakeOrderDetector";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendStoreOrderNotificationEmail } from "@/lib/mailer";
import { sendWhatsAppOrderConfirmation } from "@/lib/social/whatsapp-notify";
import { getAppUrl } from "@/lib/app-url";
import { normalizePhone } from "@/lib/courier-fraud";
import { attemptZiniPayVerification } from "@/lib/payment/zinipay-flow";
import {
  validateStoreOrderItems,
  applyGiftCard,
  applyLoyaltyDiscount,
  type ValidatedStoreItem,
} from "@/lib/store/order-processing";
import { calculateEarnedPoints } from "@/lib/store/loyalty";
import { getStoreCustomer } from "@/lib/store-customer-auth";
import { verifyGuestOtpToken } from "@/lib/store/guest-otp";

const MAX_ITEM_QTY = 999;
const MAX_ITEMS = 50;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

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

function validateItems(items: unknown): { productId?: string; comboId?: string; variantId?: string; quantity: number }[] {
  if (!Array.isArray(items) || items.length === 0) throw new Error("কার্টে কোনো পণ্য নেই।");
  if (items.length > MAX_ITEMS) throw new Error(`একবারে সর্বোচ্চ ${MAX_ITEMS}টি পণ্য অর্ডার করা যাবে।`);
  return items.map((item, i) => {
    if (!item || typeof item !== "object") throw new Error(`আইটেম ${i + 1}: অবৈধ।`);
    const { productId, comboId, variantId, quantity } = item as Record<string, unknown>;
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0 || qty > MAX_ITEM_QTY) {
      throw new Error(`আইটেম ${i + 1}: পরিমাণ অবৈধ (১–${MAX_ITEM_QTY} এর মধ্যে হতে হবে)।`);
    }
    if (typeof comboId === "string" && comboId.trim()) {
      return { comboId: comboId.trim(), quantity: qty };
    }
    if (typeof productId !== "string" || !productId.trim()) throw new Error(`আইটেম ${i + 1}: পণ্য ID নেই।`);
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
    const ip = getClientIp(req);
    const rl = await rateLimit(`store-order:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "অনেক বেশি অনুরোধ। কিছুক্ষণ পর আবার চেষ্টা করুন।" },
        { status: 429, headers: rl.retryAfterMs ? { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } : undefined },
      );
    }

    const body = await req.json();
    const {
      slug, customerName, customerPhone, customerAddress, customerDistrict, customerUpazila,
      customerNote, items: rawItems, paymentMethod, transactionId, couponCode,
      giftCardCode, loyaltyPointsUsed, affiliateCode, utmSource, utmCampaign,
      guestOtpToken, fulfillmentType, deliverySlot,
    } = body;

    const isPickup = fulfillmentType === "pickup";
    if (!slug || !customerName || !customerPhone || (!isPickup && !customerAddress)) {
      return NextResponse.json({ error: "প্রয়োজনীয় তথ্য দেওয়া হয়নি।" }, { status: 400 });
    }

    let validatedItems: { productId?: string; comboId?: string; variantId?: string; quantity: number }[];
    let storeRiskResult: RiskResult = { riskScore: 0, riskLevel: "safe", flags: [], action: "allow" };
    try {
      validatedItems = validateItems(rawItems);
    } catch (err: unknown) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }

    const storeCustomer = await getStoreCustomer();

    const shop = await prisma.shop.findUnique({
      where: { storeSlug: slug },
      select: {
        id: true, name: true, phone: true, userId: true,
        storeEnabled: true, storeShippingFee: true, storeDhakaFee: true, storeFreeShipping: true,
        storeCODEnabled: true, storeBkashNumber: true, storeNagadNumber: true,
        storeSslcommerzEnabled: true,
        zinipayApiKey: true,
        storeMinOrder: true,
        storeLoyaltyEnabled: true,
        storeLoyaltyEarnRate: true,
        storeLoyaltyRedeemRate: true,
        storeCheckoutOtpEnabled: true,
        storePickupEnabled: true,
        storePickupAddress: true,
      },
    });
    if (!shop || !shop.storeEnabled) {
      return NextResponse.json({ error: "স্টোর পাওয়া যায়নি।" }, { status: 404 });
    }
    if (!shop.userId) {
      return NextResponse.json({ error: "স্টোর সেটআপ সম্পূর্ণ নয়।" }, { status: 503 });
    }

    if (isPickup) {
      if (!shop.storePickupEnabled) {
        return NextResponse.json({ error: "Pickup সক্রিয় নেই।" }, { status: 400 });
      }
    } else if (shop.storeCheckoutOtpEnabled && !storeCustomer && !guestOtpToken) {
      return NextResponse.json({ error: "ফোন OTP যাচাই করুন।" }, { status: 400 });
    } else if (shop.storeCheckoutOtpEnabled && !storeCustomer && guestOtpToken) {
      const ok = await verifyGuestOtpToken(shop.id, customerPhone, guestOtpToken);
      if (!ok) return NextResponse.json({ error: "OTP যাচাই ব্যর্থ।" }, { status: 400 });
    }

    const resolvedAddress = isPickup
      ? (shop.storePickupAddress || "Store pickup")
      : customerAddress;
    const resolvedDistrict = isPickup ? null : (customerDistrict || null);
    const resolvedUpazila = isPickup ? null : (customerUpazila || null);
    const ownerUserId = shop.userId;

    storeRiskResult = await detectFakeOrder({
      shopId: shop.id,
      phone: customerPhone,
      customerName,
      customerAddress: resolvedAddress,
      ip,
    });
    if (storeRiskResult.action === "block") {
      return NextResponse.json(
        { error: `অর্ডার গ্রহণ করা যায়নি: ${storeRiskResult.blockReason ?? "উচ্চ-ঝুঁকির নম্বর"}` },
        { status: 403 }
      );
    }

    const ALLOWED_PAYMENT_METHODS = ["cod", "bkash", "nagad", "sslcommerz"] as const;
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
    if (pm === "sslcommerz" && !shop.storeSslcommerzEnabled) {
      return NextResponse.json({ error: "কার্ড পেমেন্ট সক্রিয় নেই।" }, { status: 400 });
    }
    if ((pm === "bkash" || pm === "nagad") && (!transactionId || typeof transactionId !== "string" || !transactionId.trim())) {
      return NextResponse.json({ error: "Transaction ID প্রয়োজন।" }, { status: 400 });
    }

    const isDhaka = !isPickup && ["ঢাকা", "গাজীপুর", "নারায়ণগঞ্জ", "মানিকগঞ্জ", "মুন্সিগঞ্জ", "নরসিংদী"].includes(customerDistrict || "");
    let shippingFee = isPickup ? 0 : isDhaka ? (shop.storeDhakaFee ?? 60) : (shop.storeShippingFee ?? 120);

    let itemLines: ValidatedStoreItem[];
    let subtotal = 0;
    try {
      const validated = await validateStoreOrderItems(shop.id, validatedItems);
      itemLines = validated.items;
      subtotal = validated.subtotal;
    } catch (err: unknown) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
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

    let giftCardAmount = 0;
    let appliedGiftCardCode: string | undefined;
    let giftCardId: string | undefined;
    try {
      const gift = await applyGiftCard(shop.id, giftCardCode, subtotal + shippingFee - discountAmount);
      giftCardAmount = gift.giftCardAmount;
      appliedGiftCardCode = gift.giftCardCode;
      giftCardId = gift.giftCardId;
    } catch (err: unknown) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }

    const customerId = storeCustomer?.shopId === shop.id ? storeCustomer.id : undefined;
    let loyaltyDiscount = 0;
    let pointsUsed = 0;
    if (shop.storeLoyaltyEnabled && customerId && loyaltyPointsUsed) {
      const loyalty = await applyLoyaltyDiscount(
        shop.id,
        customerId,
        parseInt(String(loyaltyPointsUsed), 10) || 0,
        shop.storeLoyaltyRedeemRate,
        subtotal + shippingFee - discountAmount - giftCardAmount,
      );
      loyaltyDiscount = loyalty.loyaltyDiscount;
      pointsUsed = loyalty.pointsUsed;
    }

    const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount - giftCardAmount - loyaltyDiscount);
    const orderNumber = await generateUniqueOrderNumber();
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const pointsEarned = shop.storeLoyaltyEnabled
      ? calculateEarnedPoints(subtotal, shop.storeLoyaltyEarnRate)
      : 0;

    let verifiedPaymentStatus = "pending";
    let verifiedTransactionId = transactionId?.trim() || null;

    if (
      (pm === "bkash" || pm === "nagad") &&
      shop.zinipayApiKey?.trim() &&
      verifiedTransactionId
    ) {
      const result = await attemptZiniPayVerification(shop.zinipayApiKey.trim(), {
        transactionId: verifiedTransactionId,
        amount: totalAmount,
        invoiceId: orderNumber,
        expectedMethod: pm,
      });

      if (result.success && result.transactionId) {
        verifiedPaymentStatus = "paid";
        verifiedTransactionId = result.transactionId;
      }
    }

    const treatAsPaid = pm !== "cod" && pm !== "sslcommerz" && (!shop.zinipayApiKey?.trim() || verifiedPaymentStatus === "paid");

    const storeOrder = await prisma.$transaction(async (tx) => {
      const so = await tx.storeOrder.create({
        data: {
          shopId: shop.id,
          orderNumber,
          storeCustomerId: customerId || null,
          customerName,
          customerPhone,
          customerAddress: resolvedAddress,
          customerDistrict: resolvedDistrict,
          customerUpazila: resolvedUpazila,
          customerNote: customerNote || null,
          fulfillmentType: isPickup ? "pickup" : "delivery",
          deliverySlot: deliverySlot || null,
          guestOtpVerified: !!guestOtpToken,
          subtotal,
          shippingFee,
          discountAmount: discountAmount + giftCardAmount + loyaltyDiscount,
          totalAmount,
          paymentMethod,
          transactionId: verifiedTransactionId,
          paymentStatus: pm === "cod" ? "pending" : verifiedPaymentStatus,
          couponCode: appliedCouponCode || null,
          affiliateCode: affiliateCode || null,
          utmSource: utmSource || null,
          utmCampaign: utmCampaign || null,
          giftCardCode: appliedGiftCardCode || null,
          giftCardAmount,
          loyaltyPointsUsed: pointsUsed,
          loyaltyPointsEarned: pointsEarned,
          ipAddress,
          riskScore: storeRiskResult.riskScore > 0 ? storeRiskResult.riskScore : null,
          riskFlags: storeRiskResult.flags.length > 0 ? JSON.stringify(storeRiskResult.flags) : null,
          items: {
            create: itemLines.map(i => ({
              productId: i.productId || null,
              comboId: i.comboId || null,
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
          userId: ownerUserId,
          source: "store",
          status: "pending",
          totalAmount,
          paidAmount: treatAsPaid ? totalAmount : 0,
          dueAmount: treatAsPaid ? 0 : totalAmount,
          deliveryCharge: shippingFee,
          riskScore: storeRiskResult.riskScore > 0 ? storeRiskResult.riskScore : null,
          riskFlags: storeRiskResult.flags.length > 0 ? JSON.stringify(storeRiskResult.flags) : null,
          note: [
            `📦 স্টোর অর্ডার #${orderNumber}`,
            `👤 ${customerName} | 📞 ${customerPhone}`,
            `📍 ${customerAddress}${customerDistrict ? `, ${customerDistrict}` : ""}`,
            customerNote ? `📝 ${customerNote}` : null,
            paymentMethod !== "cod" && verifiedTransactionId ? `💳 TxID: ${verifiedTransactionId}` : null,
          ].filter(Boolean).join("\n"),
          storeOrderId: so.id,
          items: {
            create: itemLines.filter(i => i.productId).map(i => ({
              productId: i.productId!,
              comboId: i.comboId || null,
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

      if (giftCardId && giftCardAmount > 0) {
        await tx.giftCard.update({
          where: { id: giftCardId },
          data: { balance: { decrement: giftCardAmount } },
        });
      }

      if (customerId && pointsUsed > 0) {
        const updated = await tx.storeCustomer.update({
          where: { id: customerId },
          data: { loyaltyPoints: { decrement: pointsUsed } },
        });
        await tx.storeLoyaltyTransaction.create({
          data: {
            shopId: shop.id,
            storeCustomerId: customerId,
            type: "redeem",
            points: -pointsUsed,
            balanceAfter: updated.loyaltyPoints,
            orderId: orderNumber,
            note: "Checkout redemption",
          },
        });
      }

      if (customerId && pointsEarned > 0) {
        const updated = await tx.storeCustomer.update({
          where: { id: customerId },
          data: { loyaltyPoints: { increment: pointsEarned } },
        });
        await tx.storeLoyaltyTransaction.create({
          data: {
            shopId: shop.id,
            storeCustomerId: customerId,
            type: "earn",
            points: pointsEarned,
            balanceAfter: updated.loyaltyPoints,
            orderId: orderNumber,
            note: "Order reward",
          },
        });
      }

      if (affiliateCode) {
        await tx.storeAffiliate.updateMany({
          where: { shopId: shop.id, code: String(affiliateCode).toUpperCase(), isActive: true },
          data: {
            totalOrders: { increment: 1 },
            totalEarnings: { increment: totalAmount * 0.05 },
          },
        });
      }

      for (const item of itemLines) {
        if (item.itemType === "combo" && item.comboId) {
          const combo = await tx.comboProduct.findUnique({
            where: { id: item.comboId },
            include: { items: true },
          });
          if (!combo) throw new Error(`"${item.productName}" কম্বো পাওয়া যায়নি।`);
          for (const ci of combo.items) {
            const qty = ci.quantity * item.quantity;
            if (ci.variantId) {
              await tx.productVariant.updateMany({
                where: { id: ci.variantId, stockQty: { gte: qty } },
                data: { stockQty: { decrement: qty } },
              });
            } else {
              await tx.product.updateMany({
                where: { id: ci.productId, stockQty: { gte: qty } },
                data: { stockQty: { decrement: qty } },
              });
            }
            await tx.stockMovement.create({
              data: {
                productId: ci.productId,
                userId: ownerUserId,
                type: "out",
                quantity: qty,
                reason: `store_combo:${orderNumber}`,
              },
            });
          }
          continue;
        }

        if (!item.productId) continue;

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

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            userId: ownerUserId,
            type: "out",
            quantity: item.quantity,
            reason: `store_order:${orderNumber}`,
          },
        });
      }

      return so;
    });

    // Mark any matching abandoned cart as recovered (best-effort).
    prisma.abandonedCart
      .updateMany({
        where: { shopId: shop.id, phone: normalizePhone(customerPhone), status: { in: ["open", "reminded"] } },
        data: { status: "recovered", recoveredOrderId: storeOrder.id },
      })
      .catch(() => {});

    sendSMSNotifications({ ...shop, userId: ownerUserId }, slug, storeOrder.orderNumber, customerName, customerPhone, totalAmount);
    sendMerchantEmail(
      { userId: ownerUserId, name: shop.name },
      storeOrder.orderNumber,
      { customerName, customerPhone, customerAddress, paymentMethod },
      itemLines.map(i => ({ name: i.productName + (i.variantName ? ` (${i.variantName})` : ""), quantity: i.quantity, unitPrice: i.unitPrice })),
      totalAmount,
    );

    if (pm === "sslcommerz") {
      return NextResponse.json({
        orderNumber: storeOrder.orderNumber,
        requiresPayment: true,
        paymentMethod: "sslcommerz",
        amount: totalAmount,
      }, { status: 201 });
    }

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

  // WhatsApp confirmation (best-effort, independent of SMS config)
  sendWhatsAppOrderConfirmation({
    userId: shop.userId,
    toPhone: customerPhone,
    message: `আপনার অর্ডার নিশ্চিত হয়েছে! ✅\nঅর্ডার নং: #${orderNumber}\nমোট: ৳${total.toLocaleString()}\nট্র্যাক করুন: ${getAppUrl()}/store/${slug}/track\n- ${shop.name}`,
  }).catch(() => {});
}

async function sendMerchantEmail(
  shop: { userId: string; name: string },
  orderNumber: string,
  cust: { customerName: string; customerPhone: string; customerAddress: string; paymentMethod: string },
  items: { name: string; quantity: number; unitPrice: number }[],
  totalAmount: number,
) {
  try {
    const user = await prisma.user.findUnique({ where: { id: shop.userId }, select: { email: true } });
    if (!user?.email) return;
    await sendStoreOrderNotificationEmail({
      toEmail: user.email,
      shopName: shop.name,
      orderNumber,
      customerName: cust.customerName,
      customerPhone: cust.customerPhone,
      customerAddress: cust.customerAddress,
      items,
      totalAmount,
      paymentMethod: cust.paymentMethod,
      dashboardUrl: `${getAppUrl()}/orders`,
    });
  } catch {
    /* email is best-effort */
  }
}
