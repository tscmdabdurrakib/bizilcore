import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole, logAdminAction } from "@/lib/admin/auth";
import { createPostSchema } from "@/lib/blog-editor/schema";
import { BLOG_POST_INCLUDE, serializePost, toJsonContent } from "@/lib/blog-editor/api-helpers";
import { createEmptyDocument } from "@/lib/blog-editor/utils/blocks";
import { slugify, uniqueSlug } from "@/lib/blog-editor/utils/slugify";

export async function GET(req: NextRequest) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");

  const posts = await prisma.blogPost.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: BLOG_POST_INCLUDE,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(posts.map(serializePost));
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existingSlugs = (await prisma.blogPost.findMany({ select: { slug: true } })).map(p => p.slug);
  const title = parsed.data.title?.trim() || "Untitled";
  const slug = parsed.data.slug
    ? slugify(parsed.data.slug)
    : uniqueSlug(title, existingSlugs);

  const post = await prisma.blogPost.create({
    data: {
      title,
      slug,
      content: toJsonContent(createEmptyDocument()),
      authorId: auth.user.id,
    },
    include: BLOG_POST_INCLUDE,
  });

  await logAdminAction(auth.user.id, "blog_post_create", "BlogPost", post.id);

  return NextResponse.json(serializePost(post), { status: 201 });
}
