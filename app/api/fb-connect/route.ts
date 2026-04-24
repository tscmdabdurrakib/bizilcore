import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const [pages, commentOrdersCount, messagesCount, repliedMessagesCount] = await Promise.all([
    prisma.facebookPage.findMany({
      where: { shopId: shop.id },
      orderBy: { connectedAt: "desc" },
    }),
    prisma.suggestedOrder.count({ where: { shopId: shop.id } }),
    prisma.messengerConversation.count({ where: { shopId: shop.id } }),
    prisma.messengerConversation.count({ where: { shopId: shop.id, repliedAt: { not: null } } }),
  ]);

  const totalFollowers = pages.reduce((sum, p) => sum + (p.followers ?? 0), 0);

  return NextResponse.json({
    pages,
    stats: {
      totalPages: pages.length,
      activePages: pages.filter((p) => p.isActive).length,
      totalFollowers,
      commentOrders: commentOrdersCount,
      messages: messagesCount,
      repliedMessages: repliedMessagesCount,
    },
  });
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
  return NextResponse.json({ success: true });
}
