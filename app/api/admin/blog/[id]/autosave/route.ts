import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/auth";
import { updatePostSchema } from "@/lib/blog-editor/schema";
import { BLOG_POST_INCLUDE, serializePost, toJsonContent } from "@/lib/blog-editor/api-helpers";

type RouteParams = { params: Promise<{ id: string }> };

/** Autosave endpoint — lightweight content/title sync every 30s */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updatePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.excerpt !== undefined && { excerpt: data.excerpt }),
      ...(data.content !== undefined && { content: toJsonContent(data.content) }),
    },
    include: BLOG_POST_INCLUDE,
  });

  return NextResponse.json({ ...serializePost(post), autosavedAt: new Date().toISOString() });
}
