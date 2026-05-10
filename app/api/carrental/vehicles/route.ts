import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const type = searchParams.get("type") || "";

  const where: Record<string, unknown> = { shopId: shop.id };
  if (status) where.status = status;
  if (type) where.type = type;

  const vehicles = await prisma.rentalVehicle.findMany({
    where,
    include: {
      defaultDriver: { select: { id: true, name: true, phone: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { regNumber: "asc" },
  });

  return NextResponse.json(vehicles);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();

  const {
    regNumber, type, brand, model, year, color, seats, fuelType,
    acAvailable, dailyRate, halfDayRate, hourlyRate, monthlyRate,
    defaultDriverId, nextService, imageUrl, notes, status,
  } = body;

  if (!regNumber || !type || !brand || !model || !color || !dailyRate) {
    return NextResponse.json({ error: "প্রয়োজনীয় তথ্য দিন" }, { status: 400 });
  }

  const existing = await prisma.rentalVehicle.findFirst({ where: { shopId: shop.id, regNumber } });
  if (existing) return NextResponse.json({ error: "এই রেজিস্ট্রেশন নম্বর ইতিমধ্যে আছে" }, { status: 400 });

  const vehicle = await prisma.rentalVehicle.create({
    data: {
      shopId: shop.id,
      regNumber,
      type: type || "car",
      brand,
      model,
      year: year ? Number(year) : null,
      color,
      seats: Number(seats) || 4,
      fuelType: fuelType || "petrol",
      acAvailable: !!acAvailable,
      dailyRate: Number(dailyRate),
      halfDayRate: halfDayRate ? Number(halfDayRate) : null,
      hourlyRate: hourlyRate ? Number(hourlyRate) : null,
      monthlyRate: monthlyRate ? Number(monthlyRate) : null,
      defaultDriverId: defaultDriverId || null,
      nextService: nextService ? new Date(nextService) : null,
      imageUrl: imageUrl || null,
      notes: notes || null,
      status: status || "available",
    },
  });

  return NextResponse.json(vehicle, { status: 201 });
}
