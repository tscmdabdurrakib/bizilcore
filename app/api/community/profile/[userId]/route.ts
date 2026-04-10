import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await params;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit  = 10;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const posts = await prisma.communityPost.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      user: { select: { id: true, name: true } },
      _count: { select: { comments: true, likes: true } },
      likes: { where: { userId: session.user.id }, select: { id: true } },
    },
  });

  const hasMore    = posts.length > limit;
  const items      = posts.slice(0, limit);
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  const postCount = await prisma.communityPost.count({ where: { userId } });

  return NextResponse.json({
    user: { ...user, postCount },
    posts: items.map((p) => ({
      id:           p.id,
      content:      p.content,
      imageUrl:     p.imageUrl,
      createdAt:    p.createdAt,
      user:         p.user,
      likeCount:    p._count.likes,
      commentCount: p._count.comments,
      liked:        p.likes.length > 0,
    })),
    nextCursor,
  });
}
