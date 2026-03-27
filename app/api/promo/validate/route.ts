import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PLAN_PRICES: Record<string, Record<number, number>> = {
  pro:      { 1: 199, 3: 549, 6: 999, 12: 1799 },
  business: { 1: 699, 3: 1899, 6: 3499, 12: 6499 },
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login করুন" }, { status: 401 });
  }

  try {
    const { code, amount, plan, months } = await req.json();
    if (!code || !amount) {
      return NextResponse.json({ error: "Code এবং amount দিন" }, { status: 400 });
    }

    const promo = await prisma.promoCode.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: {
        usages: { where: { userId: session.user.id } },
      },
    });

    if (!promo) {
      return NextResponse.json({ error: "Promo code সঠিক নয়" }, { status: 404 });
    }

    if (!promo.isActive) {
      return NextResponse.json({ error: "এই promo code বন্ধ করা হয়েছে" }, { status: 400 });
    }

    const now = new Date();
    if (promo.validFrom && now < promo.validFrom) {
      return NextResponse.json({ error: "এই promo code এখনো চালু হয়নি" }, { status: 400 });
    }
    if (promo.validTo && now > promo.validTo) {
      return NextResponse.json({ error: "এই promo code-এর মেয়াদ শেষ" }, { status: 400 });
    }

    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
      return NextResponse.json({ error: "এই promo code-এর সর্বোচ্চ ব্যবহার সীমা শেষ" }, { status: 400 });
    }

    const userUseCount = promo.usages.length;
    if (userUseCount >= promo.maxUsesPerUser) {
      return NextResponse.json({ error: "আপনি আগেই এই promo code ব্যবহার করেছেন" }, { status: 400 });
    }

    if (promo.minAmount !== null && amount < promo.minAmount) {
      return NextResponse.json({
        error: `এই code ব্যবহারের জন্য কমপক্ষে ৳${promo.minAmount} এর order করতে হবে`,
      }, { status: 400 });
    }

    if (promo.applicablePlans) {
      const allowed = promo.applicablePlans.split(",").map((p) => p.trim().toLowerCase());
      if (plan && !allowed.includes(plan.toLowerCase())) {
        const planLabels: Record<string, string> = { pro: "Pro", business: "Business" };
        const names = allowed.map((p) => planLabels[p] ?? p).join(", ");
        return NextResponse.json({ error: `এই code শুধু ${names} plan-এ ব্যবহার করা যাবে` }, { status: 400 });
      }
    }

    // If baseMonths is set, discount is calculated from that month's price (not the user's selected amount)
    let baseAmountForDiscount = amount;
    let isPartialDiscount = false;
    const monthLabels: Record<number, string> = { 1: "১ মাস", 3: "৩ মাস", 6: "৬ মাস", 12: "১২ মাস" };

    if (promo.baseMonths && months && Number(months) !== promo.baseMonths) {
      const activePlan = plan ?? "pro";
      const basePrice = PLAN_PRICES[activePlan]?.[promo.baseMonths];
      if (basePrice) {
        baseAmountForDiscount = basePrice;
        isPartialDiscount = true;
      }
    }

    let discountAmount = 0;
    if (promo.discountType === "PERCENT") {
      discountAmount = Math.round((baseAmountForDiscount * promo.discountValue) / 100);
    } else {
      discountAmount = Math.min(promo.discountValue, baseAmountForDiscount);
    }

    discountAmount = Math.min(discountAmount, amount);
    const finalAmount = Math.max(amount - discountAmount, 0);

    return NextResponse.json({
      valid: true,
      code: promo.code,
      description: promo.description,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount,
      originalAmount: amount,
      finalAmount,
      baseMonths: promo.baseMonths,
      isPartialDiscount,
      baseMonthLabel: promo.baseMonths ? monthLabels[promo.baseMonths] : null,
    });
  } catch (err) {
    console.error("[PromoValidate] Error:", err);
    return NextResponse.json({ error: "সমস্যা হয়েছে" }, { status: 500 });
  }
}
