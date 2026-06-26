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
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";

  const users = await prisma.user.findMany({
    where: {
      isAdmin: false,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
      ...(status ? { accountStatus: status } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      adminRole: true,
      isAdmin: true,
      accountStatus: true,
      statusReason: true,
      statusUpdatedAt: true,
      createdAt: true,
      onboarded: true,
      totalOrders: true,
      reviewRequestedAt: true,
      subscription: { select: { plan: true, status: true, endDate: true } },
      shop: { select: { name: true, businessType: true } },
      appReviews: { select: { id: true, rating: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(users);
}

export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id }, select: { isAdmin: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.isAdmin) return NextResponse.json({ error: "Admin account cannot be deleted" }, { status: 403 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
