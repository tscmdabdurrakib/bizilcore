import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    totalVehicles,
    totalBookings,
    completedBookings,
    revenueAgg,
    fuelCostAgg,
    vehicleStats,
    monthlyData,
    driverStats,
  ] = await Promise.all([
    prisma.rentalVehicle.count({ where: { shopId: shop.id } }),
    prisma.rentalBooking.count({ where: { shopId: shop.id } }),
    prisma.rentalBooking.count({ where: { shopId: shop.id, status: "completed" } }),
    prisma.rentalPayment.aggregate({ where: { shopId: shop.id }, _sum: { amount: true } }),
    prisma.fuelLog.aggregate({ where: { shopId: shop.id }, _sum: { totalCost: true, liters: true } }),
    prisma.rentalBooking.groupBy({
      by: ["vehicleId"],
      where: { shopId: shop.id, status: { not: "cancelled" } },
      _count: true,
      _sum: { totalAmount: true },
    }),
    prisma.rentalPayment.findMany({
      where: { shopId: shop.id, paidAt: { gte: sixMonthsAgo } },
      select: { amount: true, paidAt: true },
    }),
    prisma.rentalBooking.groupBy({
      by: ["driverId"],
      where: { shopId: shop.id, status: "completed", driverId: { not: null } },
      _count: true,
    }),
  ]);

  // Vehicle details for stats
  const vehicles = await prisma.rentalVehicle.findMany({
    where: { shopId: shop.id },
    select: { id: true, regNumber: true, brand: true, model: true, type: true },
  });
  const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));

  const vehicleBreakdown = vehicleStats.map(s => ({
    vehicle: vehicleMap[s.vehicleId],
    bookings: s._count,
    revenue: s._sum.totalAmount ?? 0,
  })).sort((a, b) => b.bookings - a.bookings);

  // Monthly revenue by month
  const monthlyMap = new Map<string, number>();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyMap.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
  }
  for (const p of monthlyData) {
    const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap.has(key)) monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + p.amount);
  }
  const monthlyRevenue = Array.from(monthlyMap.entries())
    .map(([month, revenue]) => ({ month, revenue }))
    .reverse();

  // Driver stats
  const drivers = await prisma.rentalDriver.findMany({ where: { shopId: shop.id }, select: { id: true, name: true } });
  const driverMap = Object.fromEntries(drivers.map(d => [d.id, d]));
  const driverBreakdown = driverStats
    .filter(d => d.driverId && driverMap[d.driverId!])
    .map(d => ({ driver: driverMap[d.driverId!], trips: d._count }))
    .sort((a, b) => b.trips - a.trips)
    .slice(0, 5);

  const utilizationRate = totalVehicles > 0 && totalBookings > 0
    ? Math.round((completedBookings / (totalVehicles * 30)) * 100)
    : 0;

  return NextResponse.json({
    totalVehicles,
    totalBookings,
    completedBookings,
    totalRevenue: revenueAgg._sum.amount ?? 0,
    totalFuelCost: fuelCostAgg._sum.totalCost ?? 0,
    totalFuelLiters: fuelCostAgg._sum.liters ?? 0,
    vehicleBreakdown,
    monthlyRevenue,
    driverBreakdown,
    utilizationRate,
  });
}
