import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendFacebookMessage } from "@/lib/facebook";
import { trackForUser } from "@/lib/activity/trackFromSession";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { conversationId, message } = await req.json();
  if (!conversationId || !message?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const conv = await prisma.messengerConversation.findUnique({
    where: { id: conversationId },
    include: { facebookPage: true },
  });
  if (!conv || conv.shopId !== shop.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!conv.facebookPage) {
    return NextResponse.json({ error: "No connected Facebook Page for this conversation" }, { status: 400 });
  }

  const sent = await sendFacebookMessage(conv.senderId, message, conv.facebookPage.accessToken);
  if (!sent.success) {
    return NextResponse.json({ error: sent.error ?? "Send failed" }, { status: 500 });
  }

  const updated = await prisma.messengerConversation.update({
    where: { id: conversationId },
    data: { reply: message, repliedAt: new Date() },
  });

  trackForUser(session.user.id, shop.id, {
    actionType: "facebook_reply_sent",
    actionLabel: "Messenger রিপ্লাই পাঠানো হয়েছে",
    metadata: { conversation_id: conversationId },
  }).catch(() => {});

  return NextResponse.json(updated);
}
