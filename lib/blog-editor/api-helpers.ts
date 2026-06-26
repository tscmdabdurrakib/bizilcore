import type { Prisma } from "@prisma/client";
import type { BlockNode, BlogPostDTO } from "./types";

export function parseContent(content: Prisma.JsonValue): BlockNode[] {
  if (Array.isArray(content)) return content as unknown as BlockNode[];
  return [];
}

export function toJsonContent(content: BlockNode[] | unknown): Prisma.InputJsonValue {
  return content as Prisma.InputJsonValue;
}

export function serializePost(post: {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: Prisma.JsonValue;
  status: string;
  visibility: string;
  password: string | null;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  featuredImageUrl: string | null;
  template: string;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  schemaType: string;
  ogImageUrl: string | null;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  author?: { id: string; name: string; email: string };
  categories?: { category: { id: string; name: string; slug: string } }[];
  tags?: { tag: { id: string; name: string; slug: string } }[];
}): BlogPostDTO {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: parseContent(post.content),
    status: post.status as BlogPostDTO["status"],
    visibility: post.visibility as BlogPostDTO["visibility"],
    password: post.password,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    scheduledAt: post.scheduledAt?.toISOString() ?? null,
    featuredImageUrl: post.featuredImageUrl,
    template: post.template as BlogPostDTO["template"],
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    canonicalUrl: post.canonicalUrl,
    schemaType: post.schemaType as BlogPostDTO["schemaType"],
    ogImageUrl: post.ogImageUrl,
    authorId: post.authorId,
    author: post.author,
    categories: post.categories?.map(c => c.category),
    tags: post.tags?.map(t => t.tag),
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

export const BLOG_POST_INCLUDE = {
  author: { select: { id: true, name: true, email: true } },
  categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
  tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
} as const;

export const MAX_REVISIONS = Number(process.env.BLOG_MAX_REVISIONS ?? 50);
export const AUTOSAVE_INTERVAL_MS = Number(process.env.BLOG_AUTOSAVE_INTERVAL_MS ?? 30000);
export const BLOG_MEDIA_FOLDER = process.env.BLOG_MEDIA_FOLDER ?? "bizilcore/blog";
