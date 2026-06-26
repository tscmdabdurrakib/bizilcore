import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveShopForApi } from "@/lib/shops/access";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const shop = await prisma.shop.findUnique({
    where: { id: shopCtx.activeShop.id },
    select: {
      storeFbPixelId: true,
      storeGoogleAnalyticsId: true,
      storeTiktokPixelId: true,
      storeSslcommerzEnabled: true,
      storeSslcommerzStoreId: true,
      storeSslcommerzStorePass: true,
      storePwaEnabled: true,
      storeAnnouncementBar: true,
      storeAnnouncementEndsAt: true,
    },
  });
  return NextResponse.json(shop);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const body = await req.json();
  const shop = await prisma.shop.update({
    where: { id: shopCtx.activeShop.id },
    data: {
      ...(body.storeFbPixelId !== undefined && { storeFbPixelId: body.storeFbPixelId || null }),
      ...(body.storeGoogleAnalyticsId !== undefined && { storeGoogleAnalyticsId: body.storeGoogleAnalyticsId || null }),
      ...(body.storeTiktokPixelId !== undefined && { storeTiktokPixelId: body.storeTiktokPixelId || null }),
      ...(body.storeSslcommerzEnabled !== undefined && { storeSslcommerzEnabled: !!body.storeSslcommerzEnabled }),
      ...(body.storeSslcommerzStoreId !== undefined && { storeSslcommerzStoreId: body.storeSslcommerzStoreId || null }),
      ...(body.storeSslcommerzStorePass !== undefined && { storeSslcommerzStorePass: body.storeSslcommerzStorePass || null }),
      ...(body.storePwaEnabled !== undefined && { storePwaEnabled: !!body.storePwaEnabled }),
      ...(body.storeAnnouncementBar !== undefined && { storeAnnouncementBar: body.storeAnnouncementBar || null }),
      ...(body.storeAnnouncementEndsAt !== undefined && {
        storeAnnouncementEndsAt: body.storeAnnouncementEndsAt ? new Date(body.storeAnnouncementEndsAt) : null,
      }),
    },
  });
  return NextResponse.json(shop);
}
