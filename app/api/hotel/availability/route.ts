import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  if (!fromStr || !toStr) return NextResponse.json({ error: "from/to দরকার" }, { status: 400 });

  const from = new Date(fromStr);
  const to = new Date(toStr);
  if (to <= from) return NextResponse.json({ error: "to > from হতে হবে" }, { status: 400 });

  // Get all rooms (excluding maintenance)
  const rooms = await prisma.room.findMany({
    where: { shopId: shop.id, status: { not: "maintenance" } },
    orderBy: [{ floor: "asc" }, { number: "asc" }],
  });

  // Find conflicting bookings within the date range
  const conflicts = await prisma.booking.findMany({
    where: {
      shopId: shop.id,
      status: { in: ["confirmed", "checked_in"] },
      AND: [
        { checkIn: { lt: to } },
        { checkOut: { gt: from } },
      ],
    },
    select: { roomId: true },
  });
  const blocked = new Set(conflicts.map(c => c.roomId));

  const available = rooms.filter(r => !blocked.has(r.id));
  return NextResponse.json({ rooms, available, blockedRoomIds: Array.from(blocked) });
}
