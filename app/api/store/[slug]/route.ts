import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseEasyConfig } from "@/lib/store/shop-easy-config";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await prisma.shop.findUnique({
    where: { storeSlug: slug },
    select: {
      id: true, name: true, logoUrl: true, phone: true,
      storeSlug: true, storeEnabled: true, storeTheme: true,
      storePrimaryColor: true, storeAccentColor: true, storeBannerUrl: true,
      storeTagline: true, storeAbout: true, storeShowReviews: true, storeShowStock: true,
      storeCODEnabled: true, storeBkashNumber: true, storeNagadNumber: true,
      storeMinOrder: true, storeFreeShipping: true, storeShippingFee: true, storeDhakaFee: true,
      storeSocialFB: true, storeSocialIG: true, storeSocialWA: true,
      storeSslcommerzEnabled: true, storeLoyaltyEnabled: true,
      storePickupEnabled: true, storePickupAddress: true,
      storeSocialProofEnabled: true, storeExitPopupEnabled: true, storeExitPopupCoupon: true,
      storeCheckoutOtpEnabled: true, businessConfig: true,
    },
  });
  if (!shop || !shop.storeEnabled) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const config = parseEasyConfig(shop.businessConfig);
  const { businessConfig: _, ...rest } = shop;
  return NextResponse.json({ ...rest, deliverySlots: config.deliverySlots ?? [] });
}
