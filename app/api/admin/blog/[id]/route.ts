import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole, logAdminAction } from "@/lib/admin/auth";
import { updatePostSchema } from "@/lib/blog-editor/schema";
import { BLOG_POST_INCLUDE, serializePost, toJsonContent } from "@/lib/blog-editor/api-helpers";
import { slugify } from "@/lib/blog-editor/utils/slugify";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: BLOG_POST_INCLUDE,
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(serializePost(post));
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updatePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  if (data.slug) {
    const conflict = await prisma.blogPost.findFirst({
      where: { slug: slugify(data.slug), NOT: { id } },
    });
    if (conflict) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const tagIds = data.tagIds ?? [];
  if (data.tagNames?.length) {
    for (const name of data.tagNames) {
      const slug = slugify(name);
      const tag = await prisma.blogTag.upsert({
        where: { slug },
        create: { name: name.trim(), slug },
        update: {},
      });
      tagIds.push(tag.id);
    }
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.slug !== undefined && { slug: slugify(data.slug) }),
      ...(data.excerpt !== undefined && { excerpt: data.excerpt }),
      ...(data.content !== undefined && { content: toJsonContent(data.content) }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.visibility !== undefined && { visibility: data.visibility }),
      ...(data.password !== undefined && { password: data.password }),
      ...(data.publishedAt !== undefined && {
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      }),
      ...(data.scheduledAt !== undefined && {
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      }),
      ...(data.featuredImageUrl !== undefined && { featuredImageUrl: data.featuredImageUrl }),
      ...(data.template !== undefined && { template: data.template }),
      ...(data.metaTitle !== undefined && { metaTitle: data.metaTitle }),
      ...(data.metaDescription !== undefined && { metaDescription: data.metaDescription }),
      ...(data.canonicalUrl !== undefined && { canonicalUrl: data.canonicalUrl }),
      ...(data.schemaType !== undefined && { schemaType: data.schemaType }),
      ...(data.ogImageUrl !== undefined && { ogImageUrl: data.ogImageUrl }),
      ...(data.authorId !== undefined && { authorId: data.authorId }),
      ...(data.categoryIds !== undefined && {
        categories: {
          deleteMany: {},
          create: data.categoryIds.map(categoryId => ({ categoryId })),
        },
      }),
      ...(tagIds.length > 0 && {
        tags: {
          deleteMany: {},
          create: [...new Set(tagIds)].map(tagId => ({ tagId })),
        },
      }),
    },
    include: BLOG_POST_INCLUDE,
  });

  await logAdminAction(auth.user.id, "blog_post_update", "BlogPost", id);

  return NextResponse.json(serializePost(post));
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  await prisma.blogPost.delete({ where: { id } });
  await logAdminAction(auth.user.id, "blog_post_delete", "BlogPost", id);

  return NextResponse.json({ success: true });
}
