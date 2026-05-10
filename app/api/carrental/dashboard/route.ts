import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();

  const now = new Date();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    vehicles,
    todayBookings,
    overdueBookings,
    monthRevenue,
    recentBookings,
  ] = await Promise.all([
    prisma.rentalVehicle.findMany({
      where: { shopId: shop.id },
      include: {
        defaultDriver: { select: { id: true, name: true, phone: true } },
        bookings: {
          where: { status: "on_trip" },
          select: { id: true, endDateTime: true, clientName: true, clientPhone: true, bookingNumber: true },
          take: 1,
          orderBy: { startDateTime: "desc" },
        },
      },
      orderBy: { regNumber: "asc" },
    }),
    prisma.rentalBooking.count({
      where: {
        shopId: shop.id,
        startDateTime: { gte: today, lt: tomorrow },
        status: { not: "cancelled" },
      },
    }),
    prisma.rentalBooking.findMany({
      where: {
        shopId: shop.id,
        status: "on_trip",
        endDateTime: { lt: now },
      },
      include: {
        vehicle: { select: { regNumber: true, brand: true, model: true } },
      },
      orderBy: { endDateTime: "asc" },
    }),
    prisma.rentalPayment.aggregate({
      where: { shopId: shop.id, paidAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.rentalBooking.findMany({
      where: { shopId: shop.id, status: { not: "cancelled" } },
      include: { vehicle: { select: { regNumber: true, brand: true, model: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const available = vehicles.filter(v => v.status === "available").length;
  const onTrip = vehicles.filter(v => v.status === "on_trip").length;
  const maintenance = vehicles.filter(v => v.status === "maintenance").length;

  return NextResponse.json({
    vehicles,
    totalVehicles: vehicles.length,
    available,
    onTrip,
    maintenance,
    todayBookings,
    overdueBookings,
    monthRevenue: monthRevenue._sum.amount ?? 0,
    recentBookings,
  });
}
