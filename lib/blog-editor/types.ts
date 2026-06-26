/** Block tree types for the Gutenberg-style blog editor */

export type BlockType =
  | "paragraph"
  | "heading"
  | "image"
  | "video"
  | "gallery"
  | "quote"
  | "code"
  | "list"
  | "table"
  | "embed"
  | "button"
  | "columns"
  | "spacer"
  | "divider"
  | "fileDownload"
  | "customHtml"
  | "group";

export type BlockAlign = "left" | "center" | "right" | "wide" | "full";

export interface BlockDesign {
  padding?: string;
  margin?: string;
  borderRadius?: string;
  border?: string;
  shadow?: string;
  background?: string;
  customCss?: string;
}

export interface BlockNode {
  id: string;
  type: BlockType;
  attrs?: Record<string, unknown>;
  innerBlocks?: BlockNode[];
  content?: string;
  design?: BlockDesign;
}

export type PostStatus = "draft" | "published" | "scheduled" | "private";
export type PostVisibility = "public" | "private" | "password";
export type PostTemplate = "default" | "full-width" | "sidebar" | "hero";
export type SchemaType = "Article" | "BlogPosting" | "NewsArticle";

export interface BlogPostDTO {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: BlockNode[];
  status: PostStatus;
  visibility: PostVisibility;
  password: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  featuredImageUrl: string | null;
  template: PostTemplate;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  schemaType: SchemaType;
  ogImageUrl: string | null;
  authorId: string;
  author?: { id: string; name: string; email: string };
  categories?: { id: string; name: string; slug: string }[];
  tags?: { id: string; name: string; slug: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface BlogRevisionDTO {
  id: string;
  postId: string;
  title: string;
  excerpt: string | null;
  content: BlockNode[];
  label: string | null;
  createdById: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
}

export interface BlogMediaDTO {
  id: string;
  url: string;
  publicId: string | null;
  type: "image" | "video" | "file";
  alt: string | null;
  caption: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export interface BlockCommentDTO {
  id: string;
  postId: string;
  blockId: string;
  body: string;
  authorId: string;
  author?: { id: string; name: string };
  resolved: boolean;
  mentions: string[];
  createdAt: string;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";
