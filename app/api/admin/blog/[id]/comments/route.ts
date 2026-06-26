import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/auth";
import { blockCommentSchema } from "@/lib/blog-editor/schema";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const { id: postId } = await params;
  const comments = await prisma.blogBlockComment.findMany({
    where: { postId },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const { id: postId } = await params;
  const body = await req.json();
  const parsed = blockCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const comment = await prisma.blogBlockComment.create({
    data: {
      postId,
      blockId: parsed.data.blockId,
      body: parsed.data.body,
      authorId: auth.user.id,
      mentions: parsed.data.mentions ?? [],
    },
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json(comment, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const { id: postId } = await params;
  const { commentId, resolved, body } = await req.json();
  if (!commentId) return NextResponse.json({ error: "commentId required" }, { status: 400 });

  const comment = await prisma.blogBlockComment.update({
    where: { id: commentId, postId },
    data: {
      ...(resolved !== undefined && { resolved }),
      ...(body !== undefined && { body }),
    },
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json(comment);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const { id: postId } = await params;
  const { searchParams } = new URL(req.url);
  const commentId = searchParams.get("commentId");
  if (!commentId) return NextResponse.json({ error: "commentId required" }, { status: 400 });

  await prisma.blogBlockComment.delete({ where: { id: commentId, postId } });
  return NextResponse.json({ success: true });
}
