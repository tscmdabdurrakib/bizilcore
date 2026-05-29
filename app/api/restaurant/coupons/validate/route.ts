import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";
import { runDiscountEngine, EngineCartItem, EngineCoupon } from "@/lib/restaurant/discount-engine";

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();
  const { code, items, customerTier } = body as {
    code: string;
    items: EngineCartItem[];
    customerTier?: string | null;
  };

  if (!code || !items?.length) {
    return NextResponse.json({ error: "কোড ও আইটেম আবশ্যক" }, { status: 400 });
  }

  const coupons = await prisma.coupon.findMany({
    where: { shopId: shop.id, isActive: true },
  });

  const engineCoupons: EngineCoupon[] = coupons.map(c => ({
    ...c,
    applicableItemIds: (c.applicableItemIds as string[] | null) ?? [],
    applicableCategories: (c.applicableCategories as string[] | null) ?? [],
    happyHourDays: (c.happyHourDays as number[] | null) ?? [0, 1, 2, 3, 4, 5, 6],
  }));

  const result = runDiscountEngine(items, engineCoupons, new Date(), customerTier ?? null, code.toUpperCase());
  const couponDiscount = result.discounts.find(d => d.couponCode === code.toUpperCase());

  if (!couponDiscount) {
    const raw = coupons.find(c => c.code === code.toUpperCase());
    if (!raw) return NextResponse.json({ valid: false, error: "কুপন কোড পাওয়া যায়নি" });
    if (!raw.isActive) return NextResponse.json({ valid: false, error: "কুপন সক্রিয় নেই" });
    if (raw.expiresAt && new Date(raw.expiresAt) < new Date())
      return NextResponse.json({ valid: false, error: "কুপনের মেয়াদ শেষ হয়েছে" });
    if (raw.maxUse && raw.usedCount >= raw.maxUse)
      return NextResponse.json({ valid: false, error: "কুপনের সর্বোচ্চ ব্যবহার সীমা পূর্ণ হয়েছে" });
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    if (raw.minOrder && subtotal < raw.minOrder)
      return NextResponse.json({ valid: false, error: `সর্বনিম্ন অর্ডার ৳${raw.minOrder} হতে হবে` });
    return NextResponse.json({ valid: false, error: "এই কার্টে কুপন প্রযোজ্য নয়" });
  }

  return NextResponse.json({
    valid: true,
    discount: couponDiscount,
    bogoSuggestions: result.bogoSuggestions,
  });
}
