import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";
import { triggerOrderSMS } from "@/lib/sms";

function nightsBetween(checkIn: Date, checkOut: Date) {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const roomId = searchParams.get("roomId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = { shopId: shop.id };
  if (status && status !== "all") where.status = status;
  if (roomId) where.roomId = roomId;
  if (from || to) {
    where.checkIn = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }
  if (search) {
    where.OR = [
      { bookingNumber: { contains: search, mode: "insensitive" as const } },
      { guestName: { contains: search, mode: "insensitive" as const } },
      { guestPhone: { contains: search } },
    ];
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: { room: true },
    orderBy: { checkIn: "desc" },
    take: 200,
  });

  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  if (!body.roomId || !body.guestName || !body.guestPhone || !body.checkIn || !body.checkOut) {
    return NextResponse.json({ error: "প্রয়োজনীয় তথ্য নেই" }, { status: 400 });
  }

  const room = await prisma.room.findFirst({ where: { id: body.roomId, shopId: shop.id } });
  if (!room) return NextResponse.json({ error: "রুম পাওয়া যায়নি" }, { status: 404 });

  const checkIn = new Date(body.checkIn);
  const checkOut = new Date(body.checkOut);
  if (checkOut <= checkIn) {
    return NextResponse.json({ error: "চেক-আউট তারিখ চেক-ইন এর পরে হতে হবে" }, { status: 400 });
  }

  // Conflict check
  const conflict = await prisma.booking.findFirst({
    where: {
      roomId: room.id,
      status: { in: ["confirmed", "checked_in"] },
      AND: [
        { checkIn: { lt: checkOut } },
        { checkOut: { gt: checkIn } },
      ],
    },
  });
  if (conflict) {
    return NextResponse.json(
      { error: `এই তারিখে রুম ${room.number} ইতিমধ্যে বুক করা আছে (${conflict.bookingNumber})` },
      { status: 409 },
    );
  }

  const nights = nightsBetween(checkIn, checkOut);
  const ratePerNight = Number(body.ratePerNight) || room.ratePerNight;
  const extraCharges = Number(body.extraCharges) || 0;
  const totalAmount = ratePerNight * nights + extraCharges;
  const advancePaid = Number(body.advancePaid) || 0;
  const dueAmount = Math.max(0, totalAmount - advancePaid);

  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);

  // Find/create customer (best-effort) — never trust raw customerId across tenants
  let customerId: string | null = null;
  if (body.customerId) {
    const owned = await prisma.customer.findFirst({
      where: { id: String(body.customerId), shopId: shop.id },
      select: { id: true },
    });
    if (owned) customerId = owned.id;
  }
  if (!customerId && body.guestPhone) {
    const existing = await prisma.customer.findFirst({
      where: { shopId: shop.id, phone: body.guestPhone },
    });
    if (existing) {
      customerId = existing.id;
    } else {
      const created = await prisma.customer.create({
        data: {
          name: body.guestName,
          phone: body.guestPhone,
          address: body.guestAddress || null,
          shopId: shop.id,
        },
      });
      customerId = created.id;
    }
  }

  // Atomic conflict-safe booking creation with per-shop unique bookingNumber + retry on race
  let booking;
  let attempt = 0;
  const MAX_ATTEMPTS = 5;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    attempt++;
    try {
      booking = await prisma.$transaction(async (tx) => {
        const dupe = await tx.booking.findFirst({
          where: {
            roomId: room.id,
            status: { in: ["confirmed", "checked_in"] },
            AND: [
              { checkIn: { lt: checkOut } },
              { checkOut: { gt: checkIn } },
            ],
          },
          select: { bookingNumber: true },
        });
        if (dupe) throw new Error(`__CONFLICT__:${dupe.bookingNumber}`);

        // Compute next booking number for this shop & year inside the tx
        const count = await tx.booking.count({
          where: { shopId: shop.id, createdAt: { gte: yearStart } },
        });
        const bookingNumber = `BK-${year}-${String(count + 1).padStart(3, "0")}`;

        return tx.booking.create({
          data: {
            shopId: shop.id,
            bookingNumber,
            roomId: room.id,
            customerId,
            guestName: body.guestName,
            guestPhone: body.guestPhone,
            guestNID: body.guestNID || null,
            guestAddress: body.guestAddress || null,
            adults: Number(body.adults) || 1,
            children: Number(body.children) || 0,
            checkIn,
            checkOut,
            nights,
            ratePerNight,
            extraCharges,
            extraNote: body.extraNote || null,
            totalAmount,
            advancePaid,
            dueAmount,
            paymentMethod: body.paymentMethod || null,
            source: body.source || "walk_in",
            note: body.note || null,
          },
          include: { room: true },
        });
      });
      break; // success
    } catch (e) {
      const err = e as { code?: string; message?: string };
      const msg = err?.message ?? "";
      if (msg.startsWith("__CONFLICT__:")) {
        return NextResponse.json(
          { error: `এই তারিখে রুম ${room.number} এইমাত্র বুক করা হয়েছে (${msg.split(":")[1]})` },
          { status: 409 },
        );
      }
      // Retry on Prisma unique-constraint violation (race on bookingNumber)
      if (err?.code === "P2002" && attempt < MAX_ATTEMPTS) {
        continue;
      }
      throw e;
    }
  }

  // Mark room reserved if not today's check-in
  await prisma.room.update({
    where: { id: room.id },
    data: { status: "reserved" },
  });

  await logActivity({
    shopId: shop.id,
    userId: session.user.id,
    action: "নতুন বুকিং",
    detail: `${booking.bookingNumber} · ${booking.guestName} · রুম ${room.number}`,
  });

  // SMS confirmation (best-effort)
  const message = `${shop.name}: আপনার বুকিং নিশ্চিত হয়েছে। ${booking.bookingNumber} · রুম ${room.number} · ${checkIn.toLocaleDateString("bn-BD")} থেকে ${checkOut.toLocaleDateString("bn-BD")}। মোট: ৳${totalAmount}`;
  triggerOrderSMS(session.user.id, "orderConfirmed", booking.guestPhone, message).catch(() => {});

  return NextResponse.json(booking, { status: 201 });
}
