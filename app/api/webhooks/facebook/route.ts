import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhook, looksLikeOrder } from "@/lib/facebook";
import { cacheDelPrefix } from "@/lib/cache";

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

// POST — Receive real-time comment events
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "feed") continue;
        const val = change.value;

        // Only process comment events
        if (val.item !== "comment") continue;

        const commentText = val.message ?? "";
        const commenterName = val.sender_name ?? "Unknown";
        const commenterFbId = val.sender_id ?? "";
        const postId = val.post_id ?? "";
        const commentId = val.comment_id ?? "";

        if (!looksLikeOrder(commentText)) continue;

        // Find the shop that owns this page
        const fbConn = await prisma.facebookConnection.findFirst({
          where: { pageId: entry.id, isActive: true },
        });
        if (!fbConn) continue;

        // Save as suggested order (upsert to avoid duplicates)
        await prisma.suggestedOrder.upsert({
          where: { commentId },
          create: {
            shopId: fbConn.shopId,
            commenterName,
            commenterFbId,
            commentText,
            postId,
            commentId,
            fbProfile: commenterFbId ? `https://facebook.com/${commenterFbId}` : null,
            status: "pending",
          },
          update: {},
        });

        // Invalidate cache
        cacheDelPrefix(`shop:${fbConn.shopId}:fb`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Facebook webhook error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
