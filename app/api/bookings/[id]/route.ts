import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";

async function loadBooking(userId: string, id: string) {
  const shop = await prisma.shop.findUnique({ where: { userId } });
  if (!shop) return { error: NextResponse.json({ error: "Shop not found" }, { status: 404 }) };
  const booking = await prisma.booking.findFirst({
    where: { id, shopId: shop.id },
    include: { room: true, roomServices: { orderBy: { orderedAt: "desc" } }, customer: true },
  });
  if (!booking) return { error: NextResponse.json({ error: "Booking not found" }, { status: 404 }) };
  return { shop, booking };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const r = await loadBooking(session.user.id, id);
  if ("error" in r) return r.error;
  return NextResponse.json(r.booking);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const r = await loadBooking(session.user.id, id);
  if ("error" in r) return r.error;
  const { shop, booking } = r;

  const body = await req.json();

  // Cancellation flow
  if (body.action === "cancel") {
    if (booking.status === "cancelled") {
      return NextResponse.json({ error: "ইতিমধ্যে বাতিল করা" }, { status: 400 });
    }
    if (booking.status === "checked_in" || booking.status === "checked_out") {
      return NextResponse.json({ error: "চেক-ইন/চেক-আউট হওয়া বুকিং বাতিল করা যাবে না" }, { status: 400 });
    }
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "cancelled", cancelledAt: new Date(), note: body.reason ? `${booking.note ?? ""}\n[বাতিল কারণ] ${body.reason}`.trim() : booking.note },
      include: { room: true },
    });
    // Free up room if no other active bookings
    const otherActive = await prisma.booking.count({
      where: { roomId: booking.roomId, status: { in: ["confirmed", "checked_in"] }, id: { not: booking.id } },
    });
    if (otherActive === 0 && booking.room.status === "reserved") {
      await prisma.room.update({ where: { id: booking.roomId }, data: { status: "vacant" } });
    }
    await logActivity({
      shopId: shop.id,
      userId: session.user.id,
      action: "বুকিং বাতিল",
      detail: `${booking.bookingNumber} · ${booking.guestName}`,
    });
    return NextResponse.json(updated);
  }

  // Generic field update (only allowed before check-in)
  if (booking.status !== "confirmed") {
    return NextResponse.json({ error: "এই অবস্থায় এডিট করা যাবে না" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.guestName !== undefined) data.guestName = body.guestName;
  if (body.guestPhone !== undefined) data.guestPhone = body.guestPhone;
  if (body.guestNID !== undefined) data.guestNID = body.guestNID || null;
  if (body.guestAddress !== undefined) data.guestAddress = body.guestAddress || null;
  if (body.adults !== undefined) data.adults = Number(body.adults);
  if (body.children !== undefined) data.children = Number(body.children);
  if (body.note !== undefined) data.note = body.note || null;
  if (body.extraCharges !== undefined) {
    const extra = Number(body.extraCharges) || 0;
    const total = booking.ratePerNight * booking.nights + extra;
    data.extraCharges = extra;
    data.totalAmount = total;
    data.dueAmount = Math.max(0, total - booking.advancePaid);
  }
  if (body.extraNote !== undefined) data.extraNote = body.extraNote || null;

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data,
    include: { room: true },
  });
  return NextResponse.json(updated);
}
