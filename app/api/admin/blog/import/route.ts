import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole, logAdminAction } from "@/lib/admin/auth";
import { BLOG_POST_INCLUDE, toJsonContent } from "@/lib/blog-editor/api-helpers";
import { createEmptyDocument, createBlock } from "@/lib/blog-editor/utils/blocks";
import { slugify, uniqueSlug } from "@/lib/blog-editor/utils/slugify";
import { marked } from "marked";
import { XMLParser } from "fast-xml-parser";

export async function POST(req: NextRequest) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const formData = await req.formData();
  const format = formData.get("format") as string;
  const file = formData.get("file") as File | null;
  const markdown = formData.get("markdown") as string | null;

  let title = "Imported Post";
  let content = createEmptyDocument();

  if (format === "markdown" && markdown) {
    title = markdown.split("\n").find(l => l.startsWith("# "))?.slice(2) ?? title;
    const html = await marked.parse(markdown);
    content = [createBlock("paragraph", {}), createBlock("customHtml", { html })];
  } else if (file) {
    const text = await file.text();
    if (format === "wordpress" || file.name.endsWith(".xml")) {
      const parsed = parseWordPressXml(text);
      title = parsed.title;
      content = parsed.content;
    } else if (format === "markdown" || file.name.endsWith(".md")) {
      title = text.split("\n").find(l => l.startsWith("# "))?.slice(2) ?? title;
      const html = await marked.parse(text);
      content = [createBlock("customHtml", { html })];
    }
  } else {
    return NextResponse.json({ error: "No content provided" }, { status: 400 });
  }

  const existingSlugs = (await prisma.blogPost.findMany({ select: { slug: true } })).map(p => p.slug);
  const slug = uniqueSlug(title, existingSlugs);

  const post = await prisma.blogPost.create({
    data: {
      title,
      slug,
      content: toJsonContent(content),
      authorId: auth.user.id,
      status: "draft",
    },
  });

  await logAdminAction(auth.user.id, "blog_post_import", "BlogPost", post.id, { format });

  return NextResponse.json({ id: post.id, slug: post.slug }, { status: 201 });
}

function parseWordPressXml(xml: string): { title: string; content: ReturnType<typeof createEmptyDocument> } {
  const parser = new XMLParser({ ignoreAttributes: false });
  const doc = parser.parse(xml);
  const items = doc?.rss?.channel?.item ?? doc?.channel?.item ?? [];
  const item = Array.isArray(items) ? items[0] : items;
  const title = item?.title ?? "Imported Post";
  const html = item?.["content:encoded"] ?? item?.description ?? "";
  return {
    title: String(title),
    content: [createBlock("customHtml", { html: String(html) })],
  };
}
