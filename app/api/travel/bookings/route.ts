import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

async function generateBookingNumber(shopId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.tourBooking.count({
    where: { shopId, bookingNumber: { startsWith: `TRV-${year}-` } },
  });
  return `TRV-${year}-${String(count + 1).padStart(3, "0")}`;
}

export async function GET(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { shopId: shop.id };
    if (type && type !== "all") where.bookingType = type;
    if (status && status !== "all") where.status = status;

    const bookings = await prisma.tourBooking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        package: { select: { name: true } },
        tickets: true,
        payments: true,
        _count: { select: { tickets: true, payments: true } },
      },
    });
    return NextResponse.json(bookings);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const body = await req.json();
    const bookingNumber = await generateBookingNumber(shop.id);
    const totalAmount = parseFloat(body.totalAmount);
    const costAmount = parseFloat(body.costAmount ?? 0);
    const advancePaid = parseFloat(body.advancePaid ?? 0);
    const profit = totalAmount - costAmount;
    const dueAmount = totalAmount - advancePaid;

    const booking = await prisma.tourBooking.create({
      data: {
        shopId: shop.id,
        bookingNumber,
        packageId: body.packageId ?? null,
        customerId: body.customerId ?? null,
        clientName: body.clientName,
        clientPhone: body.clientPhone,
        bookingType: body.bookingType,
        travelDate: new Date(body.travelDate),
        returnDate: body.returnDate ? new Date(body.returnDate) : null,
        adults: parseInt(body.adults ?? 1),
        children: parseInt(body.children ?? 0),
        infants: parseInt(body.infants ?? 0),
        totalPersons: parseInt(body.adults ?? 1) + parseInt(body.children ?? 0) + parseInt(body.infants ?? 0),
        destination: body.destination,
        description: body.description ?? null,
        totalAmount,
        costAmount,
        profit,
        advancePaid,
        dueAmount,
        status: "confirmed",
        notes: body.notes ?? null,
      },
    });

    if (advancePaid > 0) {
      await prisma.travelPayment.create({
        data: {
          shopId: shop.id,
          bookingId: booking.id,
          amount: advancePaid,
          method: body.paymentMethod ?? "cash",
          note: "অগ্রিম পেমেন্ট",
        },
      });
    }

    return NextResponse.json({ ...booking, bookingNumber });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const body = await req.json();
    const { id, ...data } = body;

    const booking = await prisma.tourBooking.update({
      where: { id, shopId: shop.id },
      data: {
        status: data.status,
        notes: data.notes,
        dueAmount: data.dueAmount !== undefined ? parseFloat(data.dueAmount) : undefined,
        advancePaid: data.advancePaid !== undefined ? parseFloat(data.advancePaid) : undefined,
      },
    });
    return NextResponse.json(booking);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
