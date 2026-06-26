import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendFacebookMessage } from "@/lib/facebook";
import { sendWhatsAppMessage, decryptToken } from "@/lib/whatsapp";
import { trackForUser } from "@/lib/activity/trackFromSession";

/**
 * Channel-aware reply sender for the unified inbox.
 * - messenger → Facebook Send API (page token)
 * - whatsapp  → WhatsApp Cloud API (business token)
 * - instagram → not yet supported (requires Meta app review) — Phase 2
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { channel, senderId, message } = body as { channel?: string; senderId?: string; message?: string };

  if (!channel || !senderId || !message?.trim()) {
    return NextResponse.json({ error: "channel, senderId এবং message প্রয়োজন" }, { status: 400 });
  }

  let sent = false;
  let error: string | null = null;
  let fbPageId = "";

  if (channel === "messenger") {
    // Find the page token from this sender's latest conversation row.
    const last = await prisma.messengerConversation.findFirst({
      where: { shopId: shop.id, channel: "messenger", senderId },
      orderBy: { createdAt: "desc" },
      include: { facebookPage: { select: { accessToken: true, pageId: true } } },
    });
    const token = last?.facebookPage?.accessToken;
    fbPageId = last?.fbPageId ?? "";
    if (!token) {
      error = "Facebook পেজ টোকেন পাওয়া যায়নি।";
    } else {
      const res = await sendFacebookMessage(senderId, message, token);
      sent = res.success;
      error = res.error ?? null;
    }
  } else if (channel === "whatsapp") {
    const settings = await prisma.whatsAppSettings.findUnique({ where: { userId: session.user.id } });
    if (!settings?.isConnected || !settings.apiToken || !settings.phoneNumberId) {
      error = "WhatsApp সংযোগ করা নেই।";
    } else {
      const token = decryptToken(settings.apiToken);
      fbPageId = settings.phoneNumberId;
      if (!token) {
        error = "WhatsApp টোকেন অবৈধ।";
      } else {
        const res = await sendWhatsAppMessage(token, settings.phoneNumberId, senderId, message);
        sent = res.success;
        error = res.error ?? null;
      }
    }
  } else if (channel === "instagram") {
    error = "Instagram রিপ্লাই এখনও সমর্থিত নয় (Meta অ্যাপ রিভিউ প্রয়োজন)।";
  } else {
    error = "অজানা চ্যানেল।";
  }

  if (!sent) {
    return NextResponse.json({ error: error ?? "রিপ্লাই পাঠানো যায়নি।" }, { status: 400 });
  }

  // Record the outbound reply as a new row so the thread keeps full history.
  const created = await prisma.messengerConversation.create({
    data: {
      shopId: shop.id,
      channel,
      facebookPageId: null,
      fbPageId,
      senderId,
      message: "",
      reply: message,
      repliedAt: new Date(),
    },
  });

  if (channel === "messenger") {
    trackForUser(session.user.id, shop.id, {
      actionType: "facebook_reply_sent",
      actionLabel: "Facebook রিপ্লাই পাঠানো হয়েছে",
      metadata: { channel, sender_id: senderId, conversation_id: created.id },
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, id: created.id });
}
