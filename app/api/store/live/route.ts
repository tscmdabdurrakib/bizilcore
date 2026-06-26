import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveShopForApi } from "@/lib/shops/access";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  if (slug) {
    const shop = await prisma.shop.findUnique({ where: { storeSlug: slug }, select: { id: true } });
    if (!shop) return NextResponse.json({ error: "Store not found" }, { status: 404 });
    const sessions = await prisma.liveCommerceSession.findMany({
      where: { shopId: shop.id, status: { in: ["scheduled", "live"] } },
      orderBy: { startAt: "asc" },
      take: 10,
    });
    return NextResponse.json(sessions);
  }

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const sessions = await prisma.liveCommerceSession.findMany({
    where: { shopId: shopCtx.activeShop.id },
    orderBy: { startAt: "desc" },
    take: 20,
  });
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const { title, streamUrl, startAt, endAt, pinnedProductIds, status } = await req.json();
  if (!title?.trim() || !startAt) {
    return NextResponse.json({ error: "Title and startAt required" }, { status: 400 });
  }

  const live = await prisma.liveCommerceSession.create({
    data: {
      shopId: shopCtx.activeShop.id,
      title: title.trim(),
      streamUrl: streamUrl || null,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : null,
      pinnedProductIds: pinnedProductIds ?? undefined,
      status: status || "scheduled",
    },
  });
  return NextResponse.json(live, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const { id, status, pinnedProductIds } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const live = await prisma.liveCommerceSession.updateMany({
    where: { id, shopId: shopCtx.activeShop.id },
    data: {
      ...(status && { status }),
      ...(pinnedProductIds !== undefined && { pinnedProductIds }),
    },
  });
  return NextResponse.json({ updated: live.count });
}
