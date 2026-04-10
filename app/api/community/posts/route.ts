import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImageToCloudinary, ALLOWED_TYPES, MAX_IMAGE_SIZE } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cursor  = searchParams.get("cursor");
  const mine    = searchParams.get("mine") === "1";
  const limit   = 10;

  const posts = await prisma.communityPost.findMany({
    where: mine ? { userId: session.user.id } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      user: { select: { id: true, name: true } },
      _count: { select: { comments: true, likes: true } },
      likes: { where: { userId: session.user.id }, select: { id: true } },
    },
  });

  const hasMore = posts.length > limit;
  const items   = posts.slice(0, limit);
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({
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

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const content  = (formData.get("content") as string | null)?.trim() ?? "";
  const file     = formData.get("image") as File | null;

  if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });
  if (content.length > 2000) return NextResponse.json({ error: "Content too long" }, { status: 400 });

  let imageUrl: string | null = null;
  let imageId: string | null  = null;

  if (file && file.size > 0) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_SIZE * 2.5) {
      return NextResponse.json({ error: "Image too large (max 2MB)" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadImageToCloudinary(buffer, `bizilcore/community/${session.user.id}`);
    imageUrl = result.url;
    imageId  = result.publicId;
  }

  const post = await prisma.communityPost.create({
    data: {
      userId:   session.user.id,
      content,
      imageUrl,
      imageId,
    },
    include: {
      user: { select: { id: true, name: true } },
      _count: { select: { comments: true, likes: true } },
    },
  });

  return NextResponse.json({
    id:           post.id,
    content:      post.content,
    imageUrl:     post.imageUrl,
    createdAt:    post.createdAt,
    user:         post.user,
    likeCount:    post._count.likes,
    commentCount: post._count.comments,
    liked:        false,
  });
}
