/**
 * Canonical Meta (Facebook Page) webhook.
 *
 * Handles BOTH:
 *   1. `feed` comment events  → creates a SuggestedOrder (keyword-filtered)
 *   2. `messaging` events     → logs MessengerConversation + optional auto-reply
 *
 * Security: every POST is verified against `X-Hub-Signature-256` (HMAC of the
 * raw body with the Meta app secret). Unsigned/forged requests are rejected.
 *
 * NOTE: This is the ONE webhook URL to register in the Meta App dashboard:
 *   {NEXTAUTH_URL}/api/webhooks/facebook
 * The legacy duplicate routes (/api/facebook/webhook, /api/webhook/facebook)
 * have been removed in favour of this handler.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhook, sendFacebookMessage, getMessengerUserProfile } from "@/lib/facebook";
import { hasOrderKeyword } from "@/lib/facebook-keywords";
import { verifyMetaWebhookSignature } from "@/lib/social/meta";
import { generateAutoReply } from "@/lib/openai";
import { cacheDelPrefix } from "@/lib/cache";
import { broadcast } from "@/app/api/sse/facebook/route";
import { captureError } from "@/lib/observability";

export const dynamic = "force-dynamic";

// GET — Webhook verification challenge
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode") ?? "";
  const token = searchParams.get("hub.verify_token") ?? "";
  const challenge = searchParams.get("hub.challenge") ?? "";

  const result = verifyWebhook(mode, token, challenge);
  if (result) return new Response(result, { status: 200 });
  return new Response("Forbidden", { status: 403 });
}

// POST — real-time comment + messenger events
export async function POST(req: NextRequest) {
  // Read the raw body ONCE so we can both verify the signature and parse it.
  const rawBody = await req.text();

  if (!verifyMetaWebhookSignature(rawBody, req.headers.get("x-hub-signature-256"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let body: FacebookWebhookPayload;
  try {
    body = JSON.parse(rawBody) as FacebookWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Always return 200 quickly to Meta; handle each entry best-effort.
  try {
    // ── Facebook Page: comments + Messenger ──
    if (body.object === "page") {
      for (const entry of body.entry ?? []) {
        for (const change of entry.changes ?? []) {
          if (change.field !== "feed") continue;
          await handleCommentEvent(entry.id, change.value);
        }
        for (const event of entry.messaging ?? []) {
          await handleMessengerEvent(entry.id, event);
        }
      }
    // ── Instagram Direct Messages ──
    } else if (body.object === "instagram") {
      for (const entry of body.entry ?? []) {
        for (const event of entry.messaging ?? []) {
          await handleInstagramEvent(entry.id, event);
        }
      }
    // ── WhatsApp Business inbound messages ──
    } else if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry ?? []) {
        for (const change of entry.changes ?? []) {
          await handleWhatsAppChange(change.value);
        }
      }
    }
  } catch (err) {
    captureError(err, { route: "webhooks/facebook" });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

async function handleCommentEvent(pageId: string, val: FeedChangeValue | undefined) {
  if (!val || val.item !== "comment") return;

  const commentText = val.message ?? "";
  const commentId = val.comment_id ?? "";
  if (!commentId) return;
  if (!hasOrderKeyword(commentText)) return;

  const page = await prisma.facebookPage.findFirst({
    where: { pageId, isActive: true },
  });
  if (!page) return;

  const commenterName = val.from?.name ?? val.sender_name ?? "Unknown";
  const commenterFbId = val.from?.id ?? val.sender_id ?? "";

  const order = await prisma.suggestedOrder.upsert({
    where: { commentId },
    create: {
      shopId: page.shopId,
      commenterName,
      commenterFbId,
      commentText,
      postId: val.post_id ?? "",
      commentId,
      pageName: page.pageName ?? null,
      fbProfile: commenterFbId ? `https://facebook.com/${commenterFbId}` : null,
      status: "pending",
    },
    update: {},
  });

  cacheDelPrefix(`shop:${page.shopId}:fb`);
  broadcast({ type: "NEW_ORDER", order: { ...order, pageName: order.pageName } });
}

async function handleMessengerEvent(pageId: string, event: MessagingEvent | undefined) {
  if (!event?.message || event.message.is_echo) return;

  const senderId = event.sender?.id ?? "";
  const msgText = event.message.text ?? "";
  if (!senderId || !msgText.trim()) return;

  const page = await prisma.facebookPage.findFirst({
    where: { pageId, isActive: true },
  });
  if (!page) return;

  let senderName: string | null = null;
  try {
    const profile = await getMessengerUserProfile(senderId, page.accessToken);
    senderName = profile?.name ?? null;
  } catch {
    /* non-fatal */
  }

  let reply: string | null = null;
  let repliedAt: Date | null = null;

  if (page.autoReply) {
    reply = await generateAutoReply(msgText, page.replyMessage);
    const sent = await sendFacebookMessage(senderId, reply, page.accessToken);
    if (sent.success) repliedAt = new Date();
    else console.error("[Webhook] Failed to send reply:", sent.error);
  }

  await prisma.messengerConversation.create({
    data: {
      shopId: page.shopId,
      channel: "messenger",
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

// ── Instagram Direct Message inbound ──
async function handleInstagramEvent(igAccountId: string, event: MessagingEvent | undefined) {
  if (!event?.message || event.message.is_echo) return;
  const senderId = event.sender?.id ?? "";
  const msgText = event.message.text ?? "";
  if (!senderId || !msgText.trim()) return;

  const conn = await prisma.socialConnection.findFirst({
    where: { platform: "instagram", accountId: igAccountId, status: "connected" },
    select: { shopId: true, accountName: true },
  });
  if (!conn) return;

  await prisma.messengerConversation.create({
    data: {
      shopId: conn.shopId,
      channel: "instagram",
      facebookPageId: null,
      fbPageId: igAccountId,
      senderId,
      senderName: null,
      message: msgText,
    },
  });
}

// ── WhatsApp Business inbound message ──
async function handleWhatsAppChange(val: WhatsAppChangeValue | undefined) {
  if (!val?.messages?.length) return;
  const phoneNumberId = val.metadata?.phone_number_id ?? "";
  if (!phoneNumberId) return;

  const settings = await prisma.whatsAppSettings.findFirst({
    where: { phoneNumberId },
    select: { userId: true },
  });
  if (!settings) return;
  const shop = await prisma.shop.findUnique({ where: { userId: settings.userId }, select: { id: true } });
  if (!shop) return;

  const contactName = val.contacts?.[0]?.profile?.name ?? null;

  for (const m of val.messages) {
    const text = m.text?.body ?? "";
    const from = m.from ?? "";
    if (!from || !text.trim()) continue;
    await prisma.messengerConversation.create({
      data: {
        shopId: shop.id,
        channel: "whatsapp",
        facebookPageId: null,
        fbPageId: phoneNumberId,
        senderId: from,
        senderName: contactName,
        message: text,
      },
    });
  }
}

// ── Webhook payload types ──
interface FacebookWebhookPayload {
  object?: string;
  entry?: WebhookEntry[];
}
interface WebhookEntry {
  id: string;
  changes?: { field?: string; value?: FeedChangeValue & WhatsAppChangeValue }[];
  messaging?: MessagingEvent[];
}
interface WhatsAppChangeValue {
  messaging_product?: string;
  metadata?: { phone_number_id?: string; display_phone_number?: string };
  contacts?: { profile?: { name?: string }; wa_id?: string }[];
  messages?: { from?: string; id?: string; type?: string; text?: { body?: string } }[];
}
interface FeedChangeValue {
  item?: string;
  message?: string;
  comment_id?: string;
  post_id?: string;
  sender_id?: string;
  sender_name?: string;
  from?: { id?: string; name?: string };
}
interface MessagingEvent {
  sender?: { id?: string };
  message?: { text?: string; is_echo?: boolean };
}
