import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveShopForApi } from "@/lib/shops/access";
import { getShopEasyConfig, updateShopEasyConfig } from "@/lib/store/shop-easy-config";
import { DEFAULT_ORDER_STATUS_TEMPLATES } from "@/lib/store/order-templates";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const shop = await prisma.shop.findUnique({
    where: { id: shopCtx.activeShop.id },
    select: {
      storePickupEnabled: true,
      storePickupAddress: true,
      storeSocialProofEnabled: true,
      storeExitPopupEnabled: true,
      storeExitPopupCoupon: true,
      storeCheckoutOtpEnabled: true,
    },
  });

  const config = await getShopEasyConfig(shopCtx.activeShop.id);
  const templates = config.orderStatusTemplates?.length
    ? config.orderStatusTemplates
    : DEFAULT_ORDER_STATUS_TEMPLATES;

  return NextResponse.json({
    ...shop,
    deliverySlots: config.deliverySlots ?? [],
    orderStatusTemplates: templates,
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const body = await req.json();
  const shopData: Record<string, unknown> = {};
  if (body.storePickupEnabled !== undefined) shopData.storePickupEnabled = Boolean(body.storePickupEnabled);
  if (body.storePickupAddress !== undefined) shopData.storePickupAddress = body.storePickupAddress || null;
  if (body.storeSocialProofEnabled !== undefined) shopData.storeSocialProofEnabled = Boolean(body.storeSocialProofEnabled);
  if (body.storeExitPopupEnabled !== undefined) shopData.storeExitPopupEnabled = Boolean(body.storeExitPopupEnabled);
  if (body.storeExitPopupCoupon !== undefined) shopData.storeExitPopupCoupon = body.storeExitPopupCoupon || null;
  if (body.storeCheckoutOtpEnabled !== undefined) shopData.storeCheckoutOtpEnabled = Boolean(body.storeCheckoutOtpEnabled);

  if (Object.keys(shopData).length) {
    await prisma.shop.update({ where: { id: shopCtx.activeShop.id }, data: shopData });
  }

  const configPatch: Record<string, unknown> = {};
  if (Array.isArray(body.deliverySlots)) configPatch.deliverySlots = body.deliverySlots;
  if (Array.isArray(body.orderStatusTemplates)) configPatch.orderStatusTemplates = body.orderStatusTemplates;

  if (Object.keys(configPatch).length) {
    await updateShopEasyConfig(shopCtx.activeShop.id, configPatch);
  }

  return NextResponse.json({ ok: true });
}
