import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { shop } = await requireShop();

  const booking = await prisma.rentalBooking.findFirst({
    where: { id, shopId: shop.id },
    include: {
      vehicle: true,
      driver: true,
      payments: { orderBy: { paidAt: "desc" } },
    },
  });

  if (!booking) return NextResponse.json({ error: "বুকিং পাওয়া যায়নি" }, { status: 404 });
  return NextResponse.json(booking);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { shop } = await requireShop();
  const body = await req.json();

  const booking = await prisma.rentalBooking.findFirst({ where: { id, shopId: shop.id }, include: { vehicle: true } });
  if (!booking) return NextResponse.json({ error: "বুকিং পাওয়া যায়নি" }, { status: 404 });

  let updateData: Record<string, unknown> = {};

  if (body.action === "start_trip") {
    updateData = { status: "on_trip", startKm: body.startKm ? Number(body.startKm) : null };
    // Update vehicle status
    await prisma.rentalVehicle.update({ where: { id: booking.vehicleId }, data: { status: "on_trip" } });
  } else if (body.action === "end_trip") {
    const endKm = body.endKm ? Number(body.endKm) : null;
    const startKm = booking.startKm;
    let extraKm = 0;
    let extraKmCharge = 0;
    if (endKm && startKm) {
      const totalKm = endKm - startKm;
      const limitKm = body.kmLimit ? Number(body.kmLimit) : 0;
      if (limitKm > 0 && totalKm > limitKm) {
        extraKm = totalKm - limitKm;
        extraKmCharge = extraKm * (shop.carExtraKmRate ?? 5);
      }
    }
    const finalTotal = booking.totalAmount + extraKmCharge + Number(body.extraHrCharge ?? 0);
    const finalDue = finalTotal - booking.advancePaid - (body.finalPayment ?? 0);
    updateData = {
      status: "completed",
      endKm,
      extraKmCharge,
      extraHrCharge: Number(body.extraHrCharge ?? 0),
      totalAmount: finalTotal,
      dueAmount: Math.max(0, finalDue),
    };
    // Record final payment
    if (body.finalPayment && Number(body.finalPayment) > 0) {
      await prisma.rentalPayment.create({
        data: {
          shopId: shop.id,
          bookingId: id,
          amount: Number(body.finalPayment),
          method: body.paymentMethod || "cash",
          note: "চূড়ান্ত পেমেন্ট",
        },
      });
    }
    // Free vehicle
    await prisma.rentalVehicle.update({ where: { id: booking.vehicleId }, data: { status: "available" } });
  } else if (body.action === "cancel") {
    updateData = { status: "cancelled" };
    await prisma.rentalVehicle.update({ where: { id: booking.vehicleId }, data: { status: "available" } });
  } else if (body.action === "add_payment") {
    await prisma.rentalPayment.create({
      data: {
        shopId: shop.id,
        bookingId: id,
        amount: Number(body.amount),
        method: body.method || "cash",
        note: body.note || null,
      },
    });
    const totalPaid = await prisma.rentalPayment.aggregate({ where: { bookingId: id }, _sum: { amount: true } });
    updateData = {
      advancePaid: totalPaid._sum.amount ?? 0,
      dueAmount: Math.max(0, booking.totalAmount - (totalPaid._sum.amount ?? 0)),
    };
  } else {
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.driverId !== undefined) updateData.driverId = body.driverId || null;
    if (body.status !== undefined) updateData.status = body.status;
  }

  const updated = await prisma.rentalBooking.update({ where: { id }, data: updateData });
  return NextResponse.json(updated);
}
