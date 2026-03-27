import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slug = req.nextUrl.searchParams.get("slug")?.toLowerCase().trim();
  if (!slug) return NextResponse.json({ available: false, error: "Slug required" });

  if (!/^[a-z0-9-]{3,50}$/.test(slug)) {
    return NextResponse.json({ available: false, error: "শুধু ছোট হাতের অক্ষর, সংখ্যা ও (-) ব্যবহার করুন। ৩-৫০ অক্ষর।" });
  }

  const myShop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    select: { storeSlug: true },
  });

  if (myShop?.storeSlug === slug) {
    return NextResponse.json({ available: true });
  }

  const existing = await prisma.shop.findUnique({
    where: { storeSlug: slug },
    select: { id: true },
  });

  return NextResponse.json({ available: !existing });
}
