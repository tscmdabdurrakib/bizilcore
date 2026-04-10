import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, productId, reviewerName, rating, comment } = body;

    if (!slug || !reviewerName || !rating) {
      return NextResponse.json({ error: "প্রয়োজনীয় তথ্য দিন" }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "রেটিং ১-৫ এর মধ্যে হতে হবে" }, { status: 400 });
    }
    if (reviewerName.length < 2 || reviewerName.length > 80) {
      return NextResponse.json({ error: "নাম সঠিকভাবে দিন" }, { status: 400 });
    }

    const shop = await prisma.shop.findUnique({
      where: { storeSlug: slug },
      select: { id: true, storeShowReviews: true, storeEnabled: true },
    });
    if (!shop || !shop.storeEnabled) {
      return NextResponse.json({ error: "স্টোর পাওয়া যায়নি" }, { status: 404 });
    }
    if (!shop.storeShowReviews) {
      return NextResponse.json({ error: "রিভিউ বন্ধ আছে" }, { status: 403 });
    }

    let resolvedProductId: string | null = null;
    if (productId) {
      const product = await prisma.product.findFirst({
        where: { id: productId, shopId: shop.id, storeVisible: true },
        select: { id: true },
      });
      resolvedProductId = product?.id ?? null;
    }

    await prisma.storeReview.create({
      data: {
        shopId: shop.id,
        productId: resolvedProductId,
        reviewerName: reviewerName.trim(),
        rating: Math.round(rating),
        comment: comment?.trim() || null,
        isApproved: false,
      },
    });

    return NextResponse.json({ success: true, message: "রিভিউ জমা হয়েছে। অনুমোদনের পর প্রকাশিত হবে।" });
  } catch {
    return NextResponse.json({ error: "রিভিউ জমা করা যায়নি" }, { status: 500 });
  }
}
