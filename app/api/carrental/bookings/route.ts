import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const vehicleId = searchParams.get("vehicleId") || "";

  const where: Record<string, unknown> = { shopId: shop.id };
  if (status) where.status = status;
  if (vehicleId) where.vehicleId = vehicleId;

  const bookings = await prisma.rentalBooking.findMany({
    where,
    include: {
      vehicle: { select: { id: true, regNumber: true, brand: true, model: true, type: true } },
      driver: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();

  const {
    vehicleId, driverId, clientName, clientPhone, clientNID, purpose,
    startDateTime, endDateTime, pickupLocation, dropLocation,
    rateType, units, ratePerUnit, extraKmCharge, extraHrCharge,
    totalAmount, advancePaid, notes, customerId,
  } = body;

  if (!vehicleId || !clientName || !clientPhone || !startDateTime || !endDateTime || !ratePerUnit || !totalAmount) {
    return NextResponse.json({ error: "প্রয়োজনীয় তথ্য অপূর্ণ" }, { status: 400 });
  }

  // Check availability — no overlapping confirmed/on_trip bookings for this vehicle
  const conflict = await prisma.rentalBooking.findFirst({
    where: {
      vehicleId,
      status: { in: ["confirmed", "on_trip"] },
      startDateTime: { lt: new Date(endDateTime) },
      endDateTime: { gt: new Date(startDateTime) },
    },
  });
  if (conflict) {
    return NextResponse.json({ error: `এই সময়ে গাড়িটি ইতিমধ্যে বুক আছে (${conflict.bookingNumber})` }, { status: 409 });
  }

  // Auto booking number: CAR-YYYY-NNN
  const prefix = shop.carBookingPrefix ?? "CAR";
  const year = new Date().getFullYear();
  const count = await prisma.rentalBooking.count({ where: { shopId: shop.id } });
  const bookingNumber = `${prefix}-${year}-${String(count + 1).padStart(3, "0")}`;

  const due = Number(totalAmount) - Number(advancePaid ?? 0);

  const booking = await prisma.rentalBooking.create({
    data: {
      shopId: shop.id,
      bookingNumber,
      vehicleId,
      customerId: customerId || null,
      driverId: driverId || null,
      clientName,
      clientPhone,
      clientNID: clientNID || null,
      purpose: purpose || null,
      startDateTime: new Date(startDateTime),
      endDateTime: new Date(endDateTime),
      pickupLocation: pickupLocation || null,
      dropLocation: dropLocation || null,
      rateType: rateType || "daily",
      units: Number(units) || 1,
      ratePerUnit: Number(ratePerUnit),
      extraKmCharge: Number(extraKmCharge ?? 0),
      extraHrCharge: Number(extraHrCharge ?? 0),
      totalAmount: Number(totalAmount),
      advancePaid: Number(advancePaid ?? 0),
      dueAmount: due,
      status: "confirmed",
      notes: notes || null,
    },
    include: {
      vehicle: { select: { regNumber: true, brand: true, model: true } },
      driver: { select: { name: true, phone: true } },
    },
  });

  // Record advance payment
  if (Number(advancePaid ?? 0) > 0) {
    await prisma.rentalPayment.create({
      data: {
        shopId: shop.id,
        bookingId: booking.id,
        amount: Number(advancePaid),
        method: body.paymentMethod || "cash",
        note: "অগ্রিম",
      },
    });
  }

  return NextResponse.json(booking, { status: 201 });
}
