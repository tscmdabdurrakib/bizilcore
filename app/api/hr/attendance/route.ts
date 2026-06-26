import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getShopForOwner, parseAttendanceTime } from "@/lib/hr/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get("staffId");
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const date = searchParams.get("date");

  const where: Record<string, unknown> = { shopId: shop.id };
  if (staffId) where.staffId = staffId;
  if (date) {
    where.date = new Date(date);
  } else if (month && year) {
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 0);
    where.date = { gte: start, lte: end };
  }

  const attendances = await prisma.attendance.findMany({
    where,
    include: { staff: { include: { user: { select: { name: true, email: true } } } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ attendances });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { staffId, date, status, checkIn, checkOut, notes } = body;

  if (!staffId || !date || !status) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  const dateStr = String(date).slice(0, 10);
  const checkInDt = parseAttendanceTime(checkIn, dateStr);
  const checkOutDt = parseAttendanceTime(checkOut, dateStr);

  const attendance = await prisma.attendance.upsert({
    where: { staffId_date: { staffId, date: new Date(dateStr) } },
    create: {
      shopId: shop.id,
      staffId,
      date: new Date(dateStr),
      status,
      checkIn: checkInDt,
      checkOut: checkOutDt,
      notes: notes || null,
    },
    update: {
      status,
      checkIn: checkInDt,
      checkOut: checkOutDt,
      notes: notes || null,
    },
    include: { staff: { include: { user: { select: { name: true } } } } },
  });

  return NextResponse.json(attendance, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { id, status, checkIn, checkOut, notes, date } = body;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const existing = await prisma.attendance.findFirst({ where: { id, shopId: shop.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const dateStr = (date ?? existing.date.toISOString()).slice(0, 10);

  const updated = await prisma.attendance.update({
    where: { id },
    data: {
      status: status ?? existing.status,
      checkIn: checkIn !== undefined ? parseAttendanceTime(checkIn, dateStr) : existing.checkIn,
      checkOut: checkOut !== undefined ? parseAttendanceTime(checkOut, dateStr) : existing.checkOut,
      notes: notes !== undefined ? notes : existing.notes,
    },
    include: { staff: { include: { user: { select: { name: true } } } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const existing = await prisma.attendance.findFirst({ where: { id, shopId: shop.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.attendance.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
