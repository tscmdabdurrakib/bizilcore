import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializePost, BLOG_POST_INCLUDE } from "@/lib/blog-editor/api-helpers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const posts = await prisma.blogPost.findMany({
    where: {
      status: "published",
      visibility: "public",
      OR: [{ publishedAt: { lte: new Date() } }, { publishedAt: null }],
      ...(category
        ? { categories: { some: { category: { slug: category } } } }
        : {}),
    },
    include: BLOG_POST_INCLUDE,
    orderBy: { publishedAt: "desc" },
  });

  return NextResponse.json(posts.map(serializePost));
}
