import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PLAN_PRICES: Record<string, Record<number, number>> = {
  pro:      { 1: 199, 3: 549, 6: 999, 12: 1799 },
  business: { 1: 699, 3: 1899, 6: 3499, 12: 6499 },
};

const VALID_METHODS = ["bkash", "nagad", "rocket", "bank"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login করুন" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { plan, months, method, transactionId, senderPhone, promoCode } = body;

    if (!plan || !months || !method || !transactionId) {
      return NextResponse.json({ error: "সব তথ্য পূরণ করুন" }, { status: 400 });
    }

    if (!PLAN_PRICES[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!VALID_METHODS.includes(method)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    const validMonths = [1, 3, 6, 12];
    if (!validMonths.includes(Number(months))) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }

    const existing = await prisma.payment.findFirst({
      where: {
        userId: session.user.id,
        transactionId: transactionId.trim(),
        status: { in: ["pending", "approved"] },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "এই Transaction ID আগেই submit করা হয়েছে" }, { status: 409 });
    }

    const originalAmount = PLAN_PRICES[plan][Number(months)];
    let finalAmount = originalAmount;
    let discountAmount = 0;
    let promoRecord: { id: string; code: string } | null = null;

    if (promoCode?.trim()) {
      const cleanCode = promoCode.trim().toUpperCase();
      const promo = await prisma.promoCode.findUnique({
        where: { code: cleanCode },
        include: { usages: { where: { userId: session.user.id } } },
      });

      if (promo && promo.isActive) {
        const now = new Date();
        const notStarted = promo.validFrom && now < promo.validFrom;
        const expired = promo.validTo && now > promo.validTo;
        const maxUsed = promo.maxUses !== null && promo.usedCount >= promo.maxUses;
        const userUsed = promo.usages.length >= promo.maxUsesPerUser;
        const belowMin = promo.minAmount !== null && originalAmount < promo.minAmount;
        const wrongPlan = promo.applicablePlans
          ? !promo.applicablePlans.split(",").map((p) => p.trim().toLowerCase()).includes(plan.toLowerCase())
          : false;

        if (!notStarted && !expired && !maxUsed && !userUsed && !belowMin && !wrongPlan) {
          // If baseMonths set, discount is calculated from that month's price
          let baseAmountForDiscount = originalAmount;
          if (promo.baseMonths && Number(months) !== promo.baseMonths) {
            const basePrice = PLAN_PRICES[plan]?.[promo.baseMonths];
            if (basePrice) baseAmountForDiscount = basePrice;
          }
          if (promo.discountType === "PERCENT") {
            discountAmount = Math.round((baseAmountForDiscount * promo.discountValue) / 100);
          } else {
            discountAmount = Math.min(promo.discountValue, baseAmountForDiscount);
          }
          discountAmount = Math.min(discountAmount, originalAmount);
          finalAmount = Math.max(originalAmount - discountAmount, 0);
          promoRecord = { id: promo.id, code: promo.code };
        }
      }
    }

    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        plan,
        months: Number(months),
        amount: finalAmount,
        originalAmount: originalAmount,
        discountAmount: discountAmount > 0 ? discountAmount : null,
        promoCodeId: promoRecord?.id ?? null,
        promoCodeStr: promoRecord?.code ?? null,
        method,
        transactionId: transactionId.trim(),
        senderPhone: senderPhone?.trim() || null,
        status: "pending",
      },
    });

    if (promoRecord) {
      await prisma.$transaction([
        prisma.promoCode.update({
          where: { id: promoRecord.id },
          data: { usedCount: { increment: 1 } },
        }),
        prisma.promoCodeUsage.upsert({
          where: { promoCodeId_userId: { promoCodeId: promoRecord.id, userId: session.user.id } },
          create: {
            promoCodeId: promoRecord.id,
            userId: session.user.id,
            discountAmount,
            originalAmount,
            finalAmount,
          },
          update: {},
        }),
      ]);
    }

    return NextResponse.json({ success: true, paymentId: payment.id });
  } catch (err) {
    console.error("[ManualPayment] Error:", err);
    return NextResponse.json({ error: "সমস্যা হয়েছে। আবার চেষ্টা করুন।" }, { status: 500 });
  }
}
