import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MIN_AGE_DAYS = 30;
const MIN_ORDERS = 10;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const rating = Number(body.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "রেটিং ১–৫ এর মধ্যে হতে হবে" }, { status: 400 });
  }

  // Server-side eligibility — must mirror /api/reviews/eligibility
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, createdAt: true, totalOrders: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const ageDays = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  if (ageDays < MIN_AGE_DAYS) {
    return NextResponse.json({ error: "অ্যাকাউন্ট ৩০ দিনের পুরাতন হতে হবে" }, { status: 403 });
  }
  if ((user.totalOrders ?? 0) < MIN_ORDERS) {
    return NextResponse.json({ error: "কমপক্ষে ১০টি অর্ডার থাকতে হবে" }, { status: 403 });
  }

  const shop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    select: { businessType: true },
  });

  // Race-safe insert via DB unique([userId]); handle P2002 as 409
  try {
    const review = await prisma.appReview.create({
      data: {
        userId: session.user.id,
        rating: Math.round(rating),
        title: body.title ? String(body.title).slice(0, 120) : null,
        body: body.body ? String(body.body).slice(0, 1000) : null,
        improvementNote: body.improvementNote ? String(body.improvementNote).slice(0, 1000) : null,
        businessType: shop?.businessType ?? null,
        isApproved: false,
        showOnSite: false,
      },
    });
    return NextResponse.json({ ok: true, id: review.id }, { status: 201 });
  } catch (e) {
    const err = e as { code?: string };
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "আপনি ইতিমধ্যে রিভিউ দিয়েছেন" }, { status: 409 });
    }
    throw e;
  }
}

export async function PATCH(req: NextRequest) {
  // Update improvement note for low-rating users (after they submit the second modal)
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const note = String(body.improvementNote || "").slice(0, 1000);
  if (!note) return NextResponse.json({ error: "নোট দরকার" }, { status: 400 });

  const review = await prisma.appReview.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  await prisma.appReview.update({
    where: { id: review.id },
    data: { improvementNote: note },
  });
  return NextResponse.json({ ok: true });
}
