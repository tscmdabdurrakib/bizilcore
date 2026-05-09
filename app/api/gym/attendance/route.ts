import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "No shop" }, { status: 404 });

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

  const [currentlyIn, todayAll] = await Promise.all([
    prisma.gymAttendance.findMany({
      where: { shopId: shop.id, checkIn: { gte: todayStart, lte: todayEnd }, checkOut: null },
      include: { member: { select: { id: true, name: true, memberId: true, plan: { select: { name: true } } } } },
      orderBy: { checkIn: "desc" },
    }),
    prisma.gymAttendance.findMany({
      where: { shopId: shop.id, checkIn: { gte: todayStart, lte: todayEnd } },
      include: { member: { select: { id: true, name: true, memberId: true } } },
      orderBy: { checkIn: "desc" },
    }),
  ]);

  return NextResponse.json({ currentlyIn, todayAll });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "No shop" }, { status: 404 });

  const body = await req.json();

  if (body.action === "checkin") {
    const record = await prisma.gymAttendance.create({
      data: { shopId: shop.id, memberId: body.memberId, checkIn: new Date() },
      include: { member: { select: { name: true, memberId: true } } },
    });
    return NextResponse.json(record);
  }

  if (body.action === "checkout") {
    const record = await prisma.gymAttendance.update({
      where: { id: body.attendanceId },
      data: { checkOut: new Date() },
    });
    return NextResponse.json(record);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
