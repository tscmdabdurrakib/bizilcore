import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/auth";
import { MAX_REVISIONS, parseContent } from "@/lib/blog-editor/api-helpers";
import type { BlockNode } from "@/lib/blog-editor/types";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const revisions = await prisma.blogRevision.findMany({
    where: { postId: id },
    include: { createdBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: MAX_REVISIONS,
  });

  return NextResponse.json(
    revisions.map(r => ({
      id: r.id,
      postId: r.postId,
      title: r.title,
      excerpt: r.excerpt,
      content: parseContent(r.content) as BlockNode[],
      label: r.label,
      createdById: r.createdById,
      createdBy: r.createdBy,
      createdAt: r.createdAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const { label } = await req.json().catch(() => ({}));

  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const revision = await prisma.blogRevision.create({
    data: {
      postId: id,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content ?? [],
      label: label ?? "Manual snapshot",
      createdById: auth.user.id,
    },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  const count = await prisma.blogRevision.count({ where: { postId: id } });
  if (count > MAX_REVISIONS) {
    const oldest = await prisma.blogRevision.findMany({
      where: { postId: id },
      orderBy: { createdAt: "asc" },
      take: count - MAX_REVISIONS,
      select: { id: true },
    });
    await prisma.blogRevision.deleteMany({ where: { id: { in: oldest.map(o => o.id) } } });
  }

  return NextResponse.json(revision, { status: 201 });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const { revisionId } = await req.json();
  if (!revisionId) return NextResponse.json({ error: "revisionId required" }, { status: 400 });

  const revision = await prisma.blogRevision.findFirst({
    where: { id: revisionId, postId: id },
  });
  if (!revision) return NextResponse.json({ error: "Revision not found" }, { status: 404 });

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      title: revision.title,
      excerpt: revision.excerpt,
      content: revision.content ?? [],
    },
  });

  return NextResponse.json({ success: true, postId: post.id });
}
