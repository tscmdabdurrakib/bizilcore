import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const month = searchParams.get("month");
  const hallId = searchParams.get("hallId");

  const where: Record<string, unknown> = { shopId: shop.id };
  if (status && status !== "all") where.status = status;
  if (hallId) where.hallId = hallId;
  if (month) {
    const d = new Date(month);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    where.eventDate = { gte: start, lt: end };
  }

  const events = await prisma.hallEvent.findMany({
    where,
    include: {
      hall: { select: { id: true, name: true, capacity: true } },
      package: { select: { id: true, name: true, price: true } },
      vendors: true,
      payments: { orderBy: { paidAt: "desc" } },
    },
    orderBy: { eventDate: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const {
    hallId, clientName, clientPhone, clientAddress,
    eventType, eventDate, startTime, endTime, setupTime,
    guestCount, packageId, customItems, totalAmount,
    advancePaid, paymentMethod, paymentNote,
    vendors: vendorList, internalNotes,
  } = body;

  if (!hallId || !clientName || !clientPhone || !eventType || !eventDate || !startTime || !endTime || !guestCount || !totalAmount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const evtDate = new Date(eventDate);
  const dayStart = new Date(evtDate); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(evtDate); dayEnd.setHours(23, 59, 59, 999);

  const conflict = await prisma.hallEvent.findFirst({
    where: {
      shopId: shop.id,
      hallId,
      eventDate: { gte: dayStart, lte: dayEnd },
      status: { not: "cancelled" },
    },
  });

  if (conflict) {
    return NextResponse.json({
      error: `এই তারিখে হলটি বুকড আছে (${conflict.bookingNumber})। অন্য তারিখ বা হল বেছে নিন।`,
    }, { status: 409 });
  }

  const prefix = shop.conventionEventPrefix ?? "EVT";
  const year = evtDate.getFullYear();
  const lastEvent = await prisma.hallEvent.findFirst({
    where: { shopId: shop.id, bookingNumber: { startsWith: `${prefix}-${year}-` } },
    orderBy: { createdAt: "desc" },
  });
  let seq = 1;
  if (lastEvent) {
    const parts = lastEvent.bookingNumber.split("-");
    seq = (parseInt(parts[parts.length - 1], 10) || 0) + 1;
  }
  const bookingNumber = `${prefix}-${year}-${String(seq).padStart(3, "0")}`;

  const advance = Number(advancePaid) || 0;
  const total = Number(totalAmount);
  const due = total - advance;

  const status = advance > 0 ? "advance_paid" : "confirmed";

  const event = await prisma.hallEvent.create({
    data: {
      shopId: shop.id,
      bookingNumber,
      hallId,
      clientName,
      clientPhone,
      clientAddress: clientAddress ?? null,
      eventType,
      eventDate: evtDate,
      startTime,
      endTime,
      setupTime: setupTime ?? null,
      guestCount: Number(guestCount),
      packageId: packageId ?? null,
      customItems: customItems ?? null,
      totalAmount: total,
      advancePaid: advance,
      dueAmount: due,
      status,
      internalNotes: internalNotes ?? null,
      vendors: vendorList?.length
        ? {
            create: vendorList.map((v: Record<string, unknown>) => ({
              category: v.category as string,
              vendorName: v.vendorName as string,
              contactPhone: (v.contactPhone as string) ?? null,
              quotedAmount: v.quotedAmount ? Number(v.quotedAmount) : null,
            })),
          }
        : undefined,
      payments: advance > 0
        ? {
            create: [{
              amount: advance,
              method: paymentMethod ?? "cash",
              note: paymentNote ?? null,
            }],
          }
        : undefined,
    },
    include: {
      hall: { select: { name: true } },
      vendors: true,
      payments: true,
    },
  });

  return NextResponse.json(event);
}
