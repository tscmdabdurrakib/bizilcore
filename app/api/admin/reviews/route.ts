import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isAdmin: true } });
  return user?.isAdmin ? session.user.id : null;
}

export async function GET(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "all"; // all | pending | approved | onsite

  const where: Record<string, unknown> = {};
  if (filter === "pending") where.isApproved = false;
  if (filter === "approved") where.isApproved = true;
  if (filter === "onsite") {
    where.isApproved = true;
    where.showOnSite = true;
  }

  const reviews = await prisma.appReview.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(reviews);
}
