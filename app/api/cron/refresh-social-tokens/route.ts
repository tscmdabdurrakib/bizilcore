/**
 * Refresh long-lived Meta (Facebook/Instagram) access tokens before they expire.
 *
 * Long-lived Page tokens last ~60 days. Without refresh, integrations silently
 * stop working. This cron re-exchanges tokens that expire within 10 days and,
 * on failure, marks the connection `expired` and notifies the shop owner so
 * they can reconnect from the Integrations page.
 *
 * Scheduled daily via vercel.json.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { encryptToken, decryptToken } from "@/lib/crypto";
import { exchangeForLongLivedToken, expiresInToDate } from "@/lib/social/meta";
import { captureError } from "@/lib/observability";

const REFRESH_WINDOW_MS = 10 * 24 * 60 * 60 * 1000; // 10 days

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() + REFRESH_WINDOW_MS);

  // FB/IG long-lived tokens that are connected and expiring soon.
  const connections = await prisma.socialConnection.findMany({
    where: {
      platform: { in: ["facebook", "instagram"] },
      status: "connected",
      tokenExpiresAt: { not: null, lte: cutoff },
    },
    include: { shop: { select: { userId: true, name: true } } },
  });

  let refreshed = 0;
  let expired = 0;

  for (const conn of connections) {
    try {
      const current = decryptToken(conn.accessToken);
      if (!current) throw new Error("token decrypt failed");

      const res = await exchangeForLongLivedToken(current);
      if (!res.access_token) throw new Error("no token returned");

      await prisma.socialConnection.update({
        where: { id: conn.id },
        data: {
          accessToken: encryptToken(res.access_token),
          tokenExpiresAt: expiresInToDate(res.expires_in),
        },
      });

      // Keep the legacy FacebookPage token (plaintext) in sync for the webhook path.
      if (conn.platform === "facebook") {
        await prisma.facebookPage.updateMany({
          where: { shopId: conn.shopId, pageId: conn.accountId },
          data: { accessToken: res.access_token },
        });
      }
      refreshed++;
    } catch (err) {
      expired++;
      captureError(err, { route: "cron/refresh-social-tokens", platform: conn.platform, shopId: conn.shopId });
      await prisma.socialConnection.update({
        where: { id: conn.id },
        data: { status: "expired" },
      });
      if (conn.shop?.userId) {
        await prisma.notification
          .create({
            data: {
              userId: conn.shop.userId,
              type: "integration_expired",
              title: `${conn.platform === "instagram" ? "Instagram" : "Facebook"} সংযোগ মেয়াদোত্তীর্ণ`,
              body: "আপনার সোশ্যাল অ্যাকাউন্টের টোকেন রিফ্রেশ করা যায়নি। অনুগ্রহ করে Integrations পেজ থেকে পুনরায় কানেক্ট করুন।",
              link: "/integrations",
            },
          })
          .catch(() => {});
      }
    }
  }

  return NextResponse.json({
    checked: connections.length,
    refreshed,
    expired,
    timestamp: now.toISOString(),
  });
}
