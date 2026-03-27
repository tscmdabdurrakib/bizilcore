import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPagePosts, looksLikeOrder } from "@/lib/facebook";
import { cacheGet, cacheSet, CK, TTL } from "@/lib/cache";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const connection = await prisma.facebookConnection.findUnique({
    where: { shopId: shop.id },
  });

  if (!connection || !connection.isActive) {
    return NextResponse.json({ connected: false, suggestions: [] });
  }

  // Check cache first
  const cacheKey = CK.fbComments(shop.id);
  const cached = cacheGet<{ connected: boolean; suggestions: unknown[] }>(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const posts = await getPagePosts(connection.pageId, connection.accessToken, 10);

    const orderComments: {
      commentId: string; commenterName: string; commenterFbId: string;
      commentText: string; postId: string; postText: string;
    }[] = [];

    for (const post of posts) {
      const comments = post.comments?.data ?? [];
      for (const comment of comments) {
        if (looksLikeOrder(comment.message)) {
          orderComments.push({
            commentId: comment.id,
            commenterName: comment.from?.name ?? "Unknown",
            commenterFbId: comment.from?.id ?? "",
            commentText: comment.message,
            postId: post.id,
            postText: post.message?.slice(0, 100) ?? "",
          });
        }
      }
    }

    // Save new suggestions to DB (skip existing commentIds)
    for (const c of orderComments) {
      await prisma.suggestedOrder.upsert({
        where: { commentId: c.commentId },
        create: {
          shopId: shop.id,
          commenterName: c.commenterName,
          commenterFbId: c.commenterFbId,
          commentText: c.commentText,
          postId: c.postId,
          commentId: c.commentId,
          fbProfile: c.commenterFbId ? `https://facebook.com/${c.commenterFbId}` : null,
          status: "pending",
        },
        update: {},
      });
    }

    const result = { connected: true, suggestions: orderComments, pageName: connection.pageName };
    cacheSet(cacheKey, result, TTL.PRODUCTS);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Facebook comments error:", err);
    return NextResponse.json({ connected: true, suggestions: [], error: "Could not fetch comments" });
  }
}
