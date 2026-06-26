import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/auth";
import { categorySchema } from "@/lib/blog-editor/schema";
import { slugify } from "@/lib/blog-editor/utils/slugify";

export async function GET() {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const categories = await prisma.blogCategory.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const slug = parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.name);
  const category = await prisma.blogCategory.create({
    data: {
      name: parsed.data.name.trim(),
      slug,
      parentId: parsed.data.parentId ?? null,
    },
  });

  return NextResponse.json(category, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.blogCategory.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
