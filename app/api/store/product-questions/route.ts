import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveShopForApi } from "@/lib/shops/access";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");
  const slug = url.searchParams.get("slug");
  const manage = url.searchParams.get("manage") === "1";

  if (manage) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const shopCtx = await getActiveShopForApi();
    if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

    const questions = await prisma.productQuestion.findMany({
      where: { shopId: shopCtx.activeShop.id },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(questions);
  }

  if (!productId || !slug) {
    return NextResponse.json({ questions: [] });
  }

  const shop = await prisma.shop.findUnique({ where: { storeSlug: slug }, select: { id: true } });
  if (!shop) return NextResponse.json({ questions: [] });

  const questions = await prisma.productQuestion.findMany({
    where: { shopId: shop.id, productId, isApproved: true, answer: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ questions });
}

export async function POST(req: Request) {
  const { slug, productId, askerName, askerPhone, question } = await req.json();
  if (!slug || !productId || !askerName || !question) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({ where: { storeSlug: slug }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  const created = await prisma.productQuestion.create({
    data: { shopId: shop.id, productId, askerName, askerPhone: askerPhone || null, question },
  });
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const { id, answer, isApproved } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updated = await prisma.productQuestion.updateMany({
    where: { id, shopId: shopCtx.activeShop.id },
    data: {
      ...(answer !== undefined ? { answer, answeredAt: new Date() } : {}),
      ...(isApproved !== undefined ? { isApproved: Boolean(isApproved) } : {}),
    },
  });

  return NextResponse.json({ updated: updated.count });
}
