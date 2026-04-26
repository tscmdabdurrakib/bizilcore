import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });
  return user?.isAdmin ? session.user.id : null;
}

// POST: mark a user as having a review request from admin (bypass eligibility)
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, isAdmin: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.isAdmin) {
    return NextResponse.json({ error: "Cannot request review from admin" }, { status: 400 });
  }

  // Atomic guard: only set reviewRequestedAt if user has zero reviews.
  // Using updateMany with relational filter prevents TOCTOU between
  // "check for existing review" and "set the flag".
  const result = await prisma.user.updateMany({
    where: { id, isAdmin: false, appReviews: { none: {} } },
    data: { reviewRequestedAt: new Date() },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "User already submitted a review" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE: cancel a pending review request
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, isAdmin: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.isAdmin) {
    return NextResponse.json({ error: "Cannot modify admin account" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id },
    data: { reviewRequestedAt: null },
  });
  return NextResponse.json({ ok: true });
}
