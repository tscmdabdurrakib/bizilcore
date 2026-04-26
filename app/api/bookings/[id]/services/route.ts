import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const booking = await prisma.booking.findFirst({ where: { id, shopId: shop.id } });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const items = await prisma.roomServiceOrder.findMany({
    where: { bookingId: booking.id },
    orderBy: { orderedAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const booking = await prisma.booking.findFirst({ where: { id, shopId: shop.id } });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status !== "checked_in") {
    return NextResponse.json(
      { error: "শুধু checked-in গেস্টের জন্য রুম-সার্ভিস যোগ করা যাবে" },
      { status: 400 },
    );
  }

  const body = await req.json();
  if (!body.item || body.price === undefined) {
    return NextResponse.json({ error: "আইটেম ও দাম দরকার" }, { status: 400 });
  }
  const price = Number(body.price);
  const quantity = Number(body.quantity) || 1;
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "দাম ০ বা তার বেশি হতে হবে" }, { status: 400 });
  }
  if (!Number.isFinite(quantity) || quantity < 1) {
    return NextResponse.json({ error: "পরিমাণ ১ বা তার বেশি হতে হবে" }, { status: 400 });
  }

  const item = await prisma.roomServiceOrder.create({
    data: {
      bookingId: booking.id,
      item: String(body.item).trim(),
      quantity,
      price,
      status: body.status || "pending",
    },
  });

  // Add to booking total/due
  const addAmount = item.price * item.quantity;
  const newTotal = booking.totalAmount + addAmount;
  const newDue = Math.max(0, newTotal - booking.advancePaid);
  await prisma.booking.update({
    where: { id: booking.id },
    data: { totalAmount: newTotal, dueAmount: newDue },
  });

  await logActivity({
    shopId: shop.id,
    userId: session.user.id,
    action: "রুম-সার্ভিস",
    detail: `${booking.bookingNumber} · ${item.item} ×${item.quantity} · ৳${addAmount}`,
  });

  return NextResponse.json(item, { status: 201 });
}
