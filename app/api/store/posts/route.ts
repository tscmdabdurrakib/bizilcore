import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const posts = await prisma.scheduledPost.findMany({
    where: { shopId: shop.id },
    orderBy: { scheduledAt: "desc" },
    take: 100,
  });
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { platform, productId, caption, imageUrls, scheduledAt } = body as {
    platform?: string;
    productId?: string;
    caption?: string;
    imageUrls?: string[];
    scheduledAt?: string;
  };

  if (!caption?.trim()) return NextResponse.json({ error: "ক্যাপশন প্রয়োজন" }, { status: 400 });
  if (!scheduledAt) return NextResponse.json({ error: "সময় নির্বাচন করুন" }, { status: 400 });

  const when = new Date(scheduledAt);
  if (isNaN(when.getTime())) return NextResponse.json({ error: "অবৈধ সময়" }, { status: 400 });

  // Only Facebook is supported for publishing right now (IG = Phase 2).
  const plat = platform === "instagram" ? "instagram" : "facebook";

  const post = await prisma.scheduledPost.create({
    data: {
      shopId: shop.id,
      platform: plat,
      productId: productId || null,
      caption: caption.trim(),
      imageUrls: Array.isArray(imageUrls) ? imageUrls.filter((u) => typeof u === "string").slice(0, 5) : [],
      scheduledAt: when,
      status: "scheduled",
    },
  });

  return NextResponse.json(post, { status: 201 });
}
