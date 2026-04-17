import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
  });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  return NextResponse.json(shop);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();

  const allowed = [
    "name", "phone", "email", "address", "logoUrl", "logoPublicId", "invoiceNote",
    "bankAccount", "bankName",
    "storeEnabled", "storeSlug", "storeTheme", "storePrimaryColor", "storeAccentColor",
    "storeBannerUrl", "storeTagline", "storeAbout", "storeShowReviews", "storeShowStock",
    "storeCODEnabled", "storeBkashNumber", "storeNagadNumber", "storeMinOrder",
    "storeFreeShipping", "storeShippingFee", "storeDhakaFee", "storeCustomDomain",
    "storeSocialFB", "storeSocialIG", "storeSocialWA",
  ];

  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const updated = await prisma.shop.update({
    where: { id: shop.id },
    data,
  });

  return NextResponse.json(updated);
}
