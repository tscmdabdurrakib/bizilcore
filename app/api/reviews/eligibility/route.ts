import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MIN_AGE_DAYS = 30;
const MIN_ORDERS = 10;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ eligible: false, reason: "unauthenticated" });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, createdAt: true, totalOrders: true, reviewRequestedAt: true },
  });
  if (!user) return NextResponse.json({ eligible: false, reason: "no_user" });

  // Already reviewed? Block regardless of admin request.
  const existing = await prisma.appReview.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ eligible: false, reason: "already_reviewed" });
  }

  // Admin override: if admin requested a review, bypass age + order checks.
  if (user.reviewRequestedAt) {
    return NextResponse.json({ eligible: true, reason: "admin_requested" });
  }

  const ageDays = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  if (ageDays < MIN_AGE_DAYS) {
    return NextResponse.json({ eligible: false, reason: "too_new", ageDays });
  }
  if ((user.totalOrders ?? 0) < MIN_ORDERS) {
    return NextResponse.json({ eligible: false, reason: "not_enough_orders", totalOrders: user.totalOrders });
  }

  return NextResponse.json({ eligible: true });
}
