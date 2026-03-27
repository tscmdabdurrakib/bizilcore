import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get("staffId");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const where: Record<string, unknown> = { shopId: shop.id };
  if (staffId) where.staffId = staffId;
  if (month && year) {
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 0);
    where.date = { gte: start, lte: end };
  }

  const attendances = await prisma.attendance.findMany({
    where,
    include: { staff: { include: { user: { select: { name: true } } } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ attendances });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { staffId, date, status, checkIn, checkOut, notes } = body;

  if (!staffId || !date || !status) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  const attendance = await prisma.attendance.upsert({
    where: { staffId_date: { staffId, date: new Date(date) } },
    create: {
      shopId: shop.id,
      staffId,
      date: new Date(date),
      status,
      checkIn: checkIn ? new Date(checkIn) : null,
      checkOut: checkOut ? new Date(checkOut) : null,
      notes: notes || null,
    },
    update: {
      status,
      checkIn: checkIn ? new Date(checkIn) : null,
      checkOut: checkOut ? new Date(checkOut) : null,
      notes: notes || null,
    },
  });

  return NextResponse.json(attendance, { status: 201 });
}
