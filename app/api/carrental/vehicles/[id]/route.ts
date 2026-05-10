import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { shop } = await requireShop();

  const vehicle = await prisma.rentalVehicle.findFirst({
    where: { id, shopId: shop.id },
    include: {
      defaultDriver: true,
      bookings: { orderBy: { createdAt: "desc" }, take: 20 },
      fuelLogs: { orderBy: { fuelDate: "desc" }, take: 30 },
    },
  });

  if (!vehicle) return NextResponse.json({ error: "গাড়ি পাওয়া যায়নি" }, { status: 404 });
  return NextResponse.json(vehicle);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { shop } = await requireShop();
  const body = await req.json();

  const vehicle = await prisma.rentalVehicle.findFirst({ where: { id, shopId: shop.id } });
  if (!vehicle) return NextResponse.json({ error: "গাড়ি পাওয়া যায়নি" }, { status: 404 });

  const updated = await prisma.rentalVehicle.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes || null }),
      ...(body.dailyRate !== undefined && { dailyRate: Number(body.dailyRate) }),
      ...(body.halfDayRate !== undefined && { halfDayRate: body.halfDayRate ? Number(body.halfDayRate) : null }),
      ...(body.hourlyRate !== undefined && { hourlyRate: body.hourlyRate ? Number(body.hourlyRate) : null }),
      ...(body.monthlyRate !== undefined && { monthlyRate: body.monthlyRate ? Number(body.monthlyRate) : null }),
      ...(body.defaultDriverId !== undefined && { defaultDriverId: body.defaultDriverId || null }),
      ...(body.nextService !== undefined && { nextService: body.nextService ? new Date(body.nextService) : null }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
      ...(body.color !== undefined && { color: body.color }),
      ...(body.seats !== undefined && { seats: Number(body.seats) }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { shop } = await requireShop();

  const vehicle = await prisma.rentalVehicle.findFirst({ where: { id, shopId: shop.id } });
  if (!vehicle) return NextResponse.json({ error: "গাড়ি পাওয়া যায়নি" }, { status: 404 });

  const activeBooking = await prisma.rentalBooking.findFirst({
    where: { vehicleId: id, status: { in: ["confirmed", "on_trip"] } },
  });
  if (activeBooking) return NextResponse.json({ error: "সক্রিয় বুকিং আছে — গাড়ি মুছতে পারবেন না" }, { status: 400 });

  await prisma.rentalVehicle.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
