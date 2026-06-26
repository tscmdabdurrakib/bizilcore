import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/auth";
import { tagSchema } from "@/lib/blog-editor/schema";
import { slugify } from "@/lib/blog-editor/utils/slugify";

export async function GET(req: NextRequest) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  const tags = await prisma.blogTag.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
    take: 20,
  });

  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = tagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const slug = parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.name);
  const tag = await prisma.blogTag.upsert({
    where: { slug },
    create: { name: parsed.data.name.trim(), slug },
    update: {},
  });

  return NextResponse.json(tag, { status: 201 });
}
