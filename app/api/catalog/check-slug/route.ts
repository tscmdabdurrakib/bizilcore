import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeSlugStrict } from "@/lib/slug";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawSlug = req.nextUrl.searchParams.get("slug");
  if (!rawSlug || rawSlug.length < 3) {
    return NextResponse.json({ available: false, error: "Slug too short" });
  }

  const slug = normalizeSlugStrict(rawSlug);
  if (slug.length < 3) {
    return NextResponse.json({ available: false, error: "Slug too short after normalization" });
  }

  const existing = await prisma.shop.findUnique({ where: { slug } });

  const myShop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  const isMine = existing?.id === myShop?.id;

  return NextResponse.json({ available: !existing || isMine });
}
