import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasOrderKeyword } from "@/lib/facebook-keywords";
import { broadcast } from "@/app/api/sse/facebook/route";

export const dynamic = "force-dynamic";

const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN ?? "bizilcore_verify_2024";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entries = body?.entry ?? [];

    for (const entry of entries) {
      const changes = entry?.changes ?? [];
      for (const change of changes) {
        if (change.field !== "feed") continue;
        const val = change.value;
        if (val?.item !== "comment") continue;

        const commentId    = val.comment_id;
        const message      = val.message ?? "";
        const commenterName = val.from?.name ?? "Unknown";
        const commenterFbId = val.from?.id ?? "";
        const postId       = val.post_id ?? "";
        const recipientId  = val.recipient_id ?? "";

        if (!hasOrderKeyword(message)) continue;

        const page = await prisma.facebookPage.findFirst({
          where: { pageId: recipientId, isActive: true },
        });

        const order = await prisma.suggestedOrder.create({
          data: {
            shopId: page?.shopId ?? "",
            commenterName,
            commenterFbId,
            commentText: message,
            postId,
            commentId,
            pageName: page?.pageName ?? null,
            status: "pending",
          },
        });

        broadcast({ type: "NEW_ORDER", order: { ...order, pageName: order.pageName } });
      }
    }
  } catch {
    // always return 200 to Facebook
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
