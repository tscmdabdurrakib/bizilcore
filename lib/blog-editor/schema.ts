import { z } from "zod";

export const blockDesignSchema = z.object({
  padding: z.string().optional(),
  margin: z.string().optional(),
  borderRadius: z.string().optional(),
  border: z.string().optional(),
  shadow: z.string().optional(),
  background: z.string().optional(),
  customCss: z.string().optional(),
});

export const blockNodeSchema: z.ZodType<{
  id: string;
  type: string;
  attrs?: Record<string, unknown>;
  innerBlocks?: unknown[];
  content?: string;
  design?: z.infer<typeof blockDesignSchema>;
}> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    attrs: z.record(z.string(), z.unknown()).optional(),
    innerBlocks: z.array(blockNodeSchema).optional(),
    content: z.string().optional(),
    design: blockDesignSchema.optional(),
  })
);

export const createPostSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
});

export const updatePostSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  excerpt: z.string().nullable().optional(),
  content: z.array(blockNodeSchema).optional(),
  status: z.enum(["draft", "published", "scheduled", "private"]).optional(),
  visibility: z.enum(["public", "private", "password"]).optional(),
  password: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  featuredImageUrl: z.string().nullable().optional(),
  template: z.enum(["default", "full-width", "sidebar", "hero"]).optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  canonicalUrl: z.string().nullable().optional(),
  schemaType: z.enum(["Article", "BlogPosting", "NewsArticle"]).optional(),
  ogImageUrl: z.string().nullable().optional(),
  authorId: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
  tagNames: z.array(z.string()).optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  parentId: z.string().nullable().optional(),
});

export const tagSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
});

export const blockCommentSchema = z.object({
  blockId: z.string().min(1),
  body: z.string().min(1),
  mentions: z.array(z.string()).optional(),
});
