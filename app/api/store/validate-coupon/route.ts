import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { code, slug, subtotal } = await req.json();
    if (!code || !slug) return NextResponse.json({ error: "কোড দেওয়া হয়নি।" }, { status: 400 });

    const shop = await prisma.shop.findUnique({
      where: { storeSlug: slug },
      select: { id: true, storeEnabled: true },
    });
    if (!shop || !shop.storeEnabled) return NextResponse.json({ error: "স্টোর পাওয়া যায়নি।" }, { status: 404 });

    const coupon = await prisma.coupon.findFirst({
      where: {
        shopId: shop.id,
        code: code.trim().toUpperCase(),
        isActive: true,
      },
    });

    if (!coupon) return NextResponse.json({ error: "কুপন কোড সঠিক নয়।" }, { status: 404 });

    const now = new Date();
    if (coupon.expiresAt && coupon.expiresAt < now) {
      return NextResponse.json({ error: "কুপনের মেয়াদ শেষ হয়ে গেছে।" }, { status: 400 });
    }
    if (coupon.maxUse && coupon.usedCount >= coupon.maxUse) {
      return NextResponse.json({ error: "কুপনটি আর ব্যবহার করা যাবে না।" }, { status: 400 });
    }
    if (coupon.minOrder && subtotal < coupon.minOrder) {
      return NextResponse.json({ error: `ন্যূনতম ৳${coupon.minOrder} অর্ডারে ব্যবহার করা যাবে।` }, { status: 400 });
    }

    let discountAmount = coupon.type === "percent"
      ? (subtotal * coupon.value) / 100
      : coupon.value;
    if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    discountAmount = Math.min(discountAmount, subtotal);

    return NextResponse.json({ discount: discountAmount, code: coupon.code, type: coupon.type, value: coupon.value });
  } catch (err) {
    console.error("[validate-coupon]", err);
    return NextResponse.json({ error: "সার্ভার সমস্যা।" }, { status: 500 });
  }
}
