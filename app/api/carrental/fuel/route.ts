import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId") || "";

  const where: Record<string, unknown> = { shopId: shop.id };
  if (vehicleId) where.vehicleId = vehicleId;

  const logs = await prisma.fuelLog.findMany({
    where,
    include: { vehicle: { select: { regNumber: true, brand: true, model: true } } },
    orderBy: { fuelDate: "desc" },
    take: 100,
  });

  // Per-vehicle monthly totals
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthlyTotals = await prisma.fuelLog.groupBy({
    by: ["vehicleId"],
    where: { shopId: shop.id, fuelDate: { gte: monthStart } },
    _sum: { totalCost: true, liters: true },
  });

  return NextResponse.json({ logs, monthlyTotals });
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();

  const { vehicleId, liters, costPerL, totalCost, kmAtFill, station, fuelDate, note } = body;

  if (!vehicleId || !liters || !totalCost) {
    return NextResponse.json({ error: "গাড়ি, লিটার ও মোট খরচ আবশ্যক" }, { status: 400 });
  }

  const vehicle = await prisma.rentalVehicle.findFirst({ where: { id: vehicleId, shopId: shop.id } });
  if (!vehicle) return NextResponse.json({ error: "গাড়ি পাওয়া যায়নি" }, { status: 404 });

  const log = await prisma.fuelLog.create({
    data: {
      shopId: shop.id,
      vehicleId,
      liters: Number(liters),
      costPerL: costPerL ? Number(costPerL) : null,
      totalCost: Number(totalCost),
      kmAtFill: kmAtFill ? Number(kmAtFill) : null,
      station: station || null,
      fuelDate: fuelDate ? new Date(fuelDate) : new Date(),
      note: note || null,
    },
    include: { vehicle: { select: { regNumber: true, brand: true, model: true } } },
  });

  return NextResponse.json(log, { status: 201 });
}
