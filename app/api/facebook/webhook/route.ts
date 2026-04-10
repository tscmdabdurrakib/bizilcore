import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhook, sendFacebookMessage, getMessengerUserProfile } from "@/lib/facebook";
import { generateAutoReply } from "@/lib/openai";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode      = searchParams.get("hub.mode") ?? "";
  const token     = searchParams.get("hub.verify_token") ?? "";
  const challenge = searchParams.get("hub.challenge") ?? "";

  const result = verifyWebhook(mode, token, challenge);
  if (result) return new Response(result, { status: 200 });
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.object !== "page") {
      return NextResponse.json({ ok: true });
    }

    const entries = body.entry ?? [];

    for (const entry of entries) {
      const messaging = entry.messaging ?? [];

      for (const event of messaging) {
        if (!event.message || event.message.is_echo) continue;

        const senderId  = event.sender?.id as string;
        const pageId    = entry.id as string;
        const msgText   = (event.message?.text ?? "") as string;

        if (!senderId || !msgText.trim()) continue;

        const page = await prisma.facebookPage.findFirst({
          where: { pageId, isActive: true },
        });

        if (!page) continue;

        let senderName: string | null = null;
        try {
          const profile = await getMessengerUserProfile(senderId, page.accessToken);
          senderName = profile?.name ?? null;
        } catch { /* non-fatal */ }

        let reply: string | null = null;
        let repliedAt: Date | null = null;

        if (page.autoReply) {
          reply = await generateAutoReply(msgText, page.replyMessage);
          const sent = await sendFacebookMessage(senderId, reply, page.accessToken);
          if (sent.success) {
            repliedAt = new Date();
          } else {
            console.error("[Webhook] Failed to send reply:", sent.error);
          }
        }

        await prisma.messengerConversation.create({
          data: {
            shopId: page.shopId,
            facebookPageId: page.id,
            fbPageId: pageId,
            senderId,
            senderName,
            message: msgText,
            reply,
            repliedAt,
          },
        });
      }
    }
  } catch (err) {
    console.error("[FB Webhook] error:", err);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
