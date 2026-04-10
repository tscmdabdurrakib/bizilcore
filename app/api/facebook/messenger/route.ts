import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subscribePageToWebhook } from "@/lib/facebook";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "conversations";

  if (type === "conversations") {
    const pageId = searchParams.get("pageId");
    const conversations = await prisma.messengerConversation.findMany({
      where: {
        shopId: shop.id,
        ...(pageId ? { fbPageId: pageId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(conversations);
  }

  if (type === "pages") {
    const pages = await prisma.facebookPage.findMany({
      where: { shopId: shop.id, isActive: true },
      orderBy: { connectedAt: "desc" },
    });
    return NextResponse.json(pages);
  }

  return NextResponse.json([]);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { pageId, autoReply, replyMessage } = await req.json();
  if (!pageId) return NextResponse.json({ error: "Missing pageId" }, { status: 400 });

  const page = await prisma.facebookPage.findFirst({
    where: { shopId: shop.id, id: pageId },
  });
  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  const updated = await prisma.facebookPage.update({
    where: { id: pageId },
    data: {
      ...(autoReply !== undefined ? { autoReply } : {}),
      ...(replyMessage !== undefined ? { replyMessage } : {}),
    },
  });

  if (autoReply === true) {
    await subscribePageToWebhook(page.pageId, page.accessToken).catch(() => {});
  }

  return NextResponse.json(updated);
}
