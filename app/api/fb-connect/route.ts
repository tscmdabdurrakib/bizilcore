import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCachedFbConnect } from "@/lib/data/cached-queries";
import { revalidateFbPages } from "@/lib/cache/revalidate";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const data = await getCachedFbConnect(shop.id);
  return NextResponse.json(data);
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
        subscribed_fields: "feed,comments,messages,messaging_postbacks",
        access_token: accessToken,
      }),
    });
  } catch {
    // non-fatal
  }

  revalidateFbPages(shop.id);
  return NextResponse.json({ success: true, page });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { pageId, isActive, autoReply, replyMessage } = body as {
    pageId: string;
    isActive?: boolean;
    autoReply?: boolean;
    replyMessage?: string;
  };

  if (!pageId) return NextResponse.json({ error: "pageId required" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof isActive === "boolean") data.isActive = isActive;
  if (typeof autoReply === "boolean") data.autoReply = autoReply;
  if (typeof replyMessage === "string") data.replyMessage = replyMessage;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await prisma.facebookPage.updateMany({
    where: { shopId: shop.id, pageId },
    data,
  });

  const updated = await prisma.facebookPage.findFirst({ where: { shopId: shop.id, pageId } });
  revalidateFbPages(shop.id);
  return NextResponse.json({ success: true, page: updated });
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
  revalidateFbPages(shop.id);
  return NextResponse.json({ success: true });
}
