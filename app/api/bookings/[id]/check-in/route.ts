import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const booking = await prisma.booking.findFirst({
    where: { id, shopId: shop.id },
    include: { room: true },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status !== "confirmed") {
    return NextResponse.json({ error: "শুধু confirmed বুকিং চেক-ইন করা যাবে" }, { status: 400 });
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "checked_in", checkedInAt: new Date() },
    include: { room: true },
  });

  await prisma.room.update({
    where: { id: booking.roomId },
    data: { status: "occupied" },
  });

  await logActivity({
    shopId: shop.id,
    userId: session.user.id,
    action: "চেক-ইন",
    detail: `${booking.bookingNumber} · ${booking.guestName} · রুম ${booking.room.number}`,
  });

  return NextResponse.json(updated);
}
