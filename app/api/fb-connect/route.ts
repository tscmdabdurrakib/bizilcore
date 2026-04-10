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
  return NextResponse.json(pages);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { pageId, pageName, accessToken, category, followers } = await req.json();
  if (!pageId || !pageName || !accessToken) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const page = await prisma.facebookPage.upsert({
    where: { shopId_pageId: { shopId: shop.id, pageId } },
    create: { shopId: shop.id, pageId, pageName, accessToken, category, followers, isActive: true },
    update: { pageName, accessToken, category, followers, isActive: true },
  });

  try {
    await fetch(`https://graph.facebook.com/v18.0/${pageId}/subscribed_apps`, {
      method: "POST",
      body: new URLSearchParams({
        subscribed_fields: "feed,comments",
        access_token: accessToken,
      }),
    });
  } catch {
    // non-fatal
  }

  return NextResponse.json({ success: true, page });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { pageId } = await req.json();
  await prisma.facebookPage.updateMany({
    where: { shopId: shop.id, pageId },
    data: { isActive: false },
  });
  return NextResponse.json({ success: true });
}
