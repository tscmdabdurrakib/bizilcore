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
      storeLoyaltyEnabled: true,
      storeLoyaltyEarnRate: true,
      storeLoyaltyRedeemRate: true,
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
      ...(body.storeLoyaltyEnabled !== undefined && { storeLoyaltyEnabled: !!body.storeLoyaltyEnabled }),
      ...(body.storeLoyaltyEarnRate !== undefined && { storeLoyaltyEarnRate: parseFloat(body.storeLoyaltyEarnRate) }),
      ...(body.storeLoyaltyRedeemRate !== undefined && { storeLoyaltyRedeemRate: parseFloat(body.storeLoyaltyRedeemRate) }),
    },
    select: {
      storeLoyaltyEnabled: true,
      storeLoyaltyEarnRate: true,
      storeLoyaltyRedeemRate: true,
    },
  });
  return NextResponse.json(shop);
}
