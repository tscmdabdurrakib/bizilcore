import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const pages = await prisma.facebookPage.findMany({
    where: { shopId: shop.id },
    orderBy: { connectedAt: "desc" },
  });

  return NextResponse.json({ pages });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { pageId, pageName, accessToken, category, followers } = body as {
    pageId: string; pageName: string; accessToken: string; category?: string; followers?: number;
  };

  if (!pageId || !pageName || !accessToken) {
    return NextResponse.json({ error: "pageId, pageName, and accessToken required" }, { status: 400 });
  }

  const page = await prisma.facebookPage.upsert({
    where: { shopId_pageId: { shopId: shop.id, pageId } },
    update: { pageName, accessToken, category, followers, isActive: true },
    create: { shopId: shop.id, pageId, pageName, accessToken, category, followers },
  });

  return NextResponse.json(page);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const page = await prisma.facebookPage.findUnique({ where: { id } });
  if (!page || page.shopId !== shop.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.facebookPage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, isActive } = body as { id: string; isActive: boolean };

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const page = await prisma.facebookPage.findUnique({ where: { id } });
  if (!page || page.shopId !== shop.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.facebookPage.update({ where: { id }, data: { isActive } });
  return NextResponse.json(updated);
}
