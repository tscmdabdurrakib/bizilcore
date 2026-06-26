/**
 * Publish due scheduled social posts.
 *
 * Runs every ~15 min via vercel.json. Picks scheduled posts whose time has
 * arrived and publishes them to the shop's connected Facebook Page. Instagram
 * publishing is Phase-2 (requires Meta app review) and is skipped with a clear
 * error recorded on the post.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { publishFacebookPagePost } from "@/lib/facebook";
import { captureError } from "@/lib/observability";

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const due = await prisma.scheduledPost.findMany({
    where: { status: "scheduled", scheduledAt: { lte: now } },
    take: 50,
  });

  let published = 0;
  let failed = 0;
  const pageCache = new Map<string, { pageId: string; accessToken: string } | null>();

  for (const post of due) {
    try {
      if (post.platform !== "facebook") {
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: { status: "failed", error: "Instagram পাবলিশিং এখনও সমর্থিত নয় (Meta অ্যাপ রিভিউ প্রয়োজন)।" },
        });
        failed++;
        continue;
      }

      let page = pageCache.get(post.shopId);
      if (page === undefined) {
        const fbPage = await prisma.facebookPage.findFirst({
          where: { shopId: post.shopId, isActive: true },
          select: { pageId: true, accessToken: true },
        });
        page = fbPage ? { pageId: fbPage.pageId, accessToken: fbPage.accessToken } : null;
        pageCache.set(post.shopId, page);
      }

      if (!page) {
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: { status: "failed", error: "কোনো সক্রিয় Facebook পেজ সংযুক্ত নেই।" },
        });
        failed++;
        continue;
      }

      const res = await publishFacebookPagePost(page.pageId, page.accessToken, post.caption, post.imageUrls[0]);
      if (res.success) {
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: { status: "published", postId: res.postId ?? null, publishedAt: new Date(), error: null },
        });
        published++;
      } else {
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: { status: "failed", error: res.error ?? "পাবলিশ ব্যর্থ হয়েছে।" },
        });
        failed++;
      }
    } catch (err) {
      failed++;
      captureError(err, { route: "cron/publish-posts", postId: post.id });
      await prisma.scheduledPost
        .update({ where: { id: post.id }, data: { status: "failed", error: "অপ্রত্যাশিত ত্রুটি।" } })
        .catch(() => {});
    }
  }

  return NextResponse.json({ checked: due.length, published, failed, timestamp: now.toISOString() });
}
