import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eachDateInRange, getShopForOwner } from "@/lib/hr/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

  const where: Record<string, unknown> = { shopId: shop.id };
  if (status) where.status = status;

  const [requests, balances] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      include: { staff: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.leaveBalance.findMany({
      where: { shopId: shop.id, year },
      include: { staff: { include: { user: { select: { name: true } } } } },
    }),
  ]);

  return NextResponse.json({ requests, balances });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { staffId, startDate, endDate, type, reason, autoApprove } = body;

  if (!staffId || !startDate || !endDate) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  const staff = await prisma.staffMember.findFirst({
    where: { id: staffId, shopId: shop.id, isActive: true },
  });
  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  const request = await prisma.leaveRequest.create({
    data: {
      shopId: shop.id,
      staffId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type: type || "casual",
      reason: reason || null,
      status: autoApprove ? "approved" : "pending",
      reviewedBy: autoApprove ? session.user.id : null,
      reviewedAt: autoApprove ? new Date() : null,
    },
    include: { staff: { include: { user: { select: { name: true } } } } },
  });

  if (autoApprove) {
    await applyApprovedLeave(shop.id, staffId, new Date(startDate), new Date(endDate), type || "casual", session.user.id);
  }

  return NextResponse.json(request, { status: 201 });
}

async function applyApprovedLeave(
  shopId: string,
  staffId: string,
  start: Date,
  end: Date,
  type: string,
  reviewerId: string,
) {
  const year = start.getFullYear();
  const days = eachDateInRange(start, end).length;

  await prisma.leaveBalance.upsert({
    where: { staffId_year: { staffId, year } },
    create: {
      shopId,
      staffId,
      year,
      usedCasual: type === "casual" ? days : 0,
      usedSick: type === "sick" ? days : 0,
    },
    update: {
      usedCasual: type === "casual" ? { increment: days } : undefined,
      usedSick: type === "sick" ? { increment: days } : undefined,
    },
  });

  for (const d of eachDateInRange(start, end)) {
    await prisma.attendance.upsert({
      where: { staffId_date: { staffId, date: d } },
      create: {
        shopId,
        staffId,
        date: d,
        status: "leave",
        notes: `${type} leave approved by owner`,
      },
      update: { status: "leave" },
    });
  }

  void reviewerId;
}
