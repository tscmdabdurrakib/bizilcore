import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/auth";
import { parseContent } from "@/lib/blog-editor/api-helpers";
import { blocksToHtml, blocksToMarkdown } from "@/lib/blog-editor/export/serializers";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "json";

  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const content = parseContent(post.content);

  if (format === "html") {
    const html = `<!DOCTYPE html><html><head><title>${post.title}</title></head><body>${blocksToHtml(content)}</body></html>`;
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html", "Content-Disposition": `attachment; filename="${post.slug}.html"` },
    });
  }

  if (format === "markdown") {
    const md = `# ${post.title}\n\n${blocksToMarkdown(content)}`;
    return new NextResponse(md, {
      headers: { "Content-Type": "text/markdown", "Content-Disposition": `attachment; filename="${post.slug}.md"` },
    });
  }

  return NextResponse.json({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content,
    meta: {
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      schemaType: post.schemaType,
    },
  });
}
