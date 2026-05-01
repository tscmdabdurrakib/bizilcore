import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysLater = new Date(now); sevenDaysLater.setDate(now.getDate() + 7);
  const fourteenDaysLater = new Date(now); fourteenDaysLater.setDate(now.getDate() + 14);

  const [
    activeCropCycles, totalLands, activeAnimals,
    monthSales, vaccinationDue, harvestDue, unsoldHarvests,
    cropCyclesFull, lands,
  ] = await Promise.all([
    prisma.cropCycle.count({ where: { shopId: shop.id, status: { in: ["sowing", "growing", "harvesting", "planned"] } } }),
    prisma.land.aggregate({ where: { shopId: shop.id, isActive: true }, _sum: { areaBigha: true }, _count: true }),
    prisma.livestock.findMany({ where: { shopId: shop.id, isActive: true }, select: { quantity: true } }),
    prisma.harvestSale.aggregate({ where: { shopId: shop.id, saleDate: { gte: monthStart } }, _sum: { totalAmount: true } }),
    prisma.livestockLog.findMany({
      where: { shopId: shop.id, logType: "vaccination", nextDueDate: { gte: now, lte: sevenDaysLater } },
      select: { description: true, nextDueDate: true, livestock: { select: { type: true } } },
      orderBy: { nextDueDate: "asc" },
      take: 5,
    }),
    prisma.cropCycle.findMany({
      where: { shopId: shop.id, status: { not: "completed" }, expectedHarvestDate: { gte: now, lte: fourteenDaysLater } },
      select: { cropName: true, expectedHarvestDate: true, land: { select: { name: true } } },
      orderBy: { expectedHarvestDate: "asc" },
      take: 5,
    }),
    prisma.harvestRecord.findMany({
      where: { shopId: shop.id },
      include: { sellRecords: { select: { quantityKg: true } } },
    }),
    prisma.cropCycle.findMany({
      where: { shopId: shop.id, status: { not: "completed" } },
      include: { land: { select: { name: true } }, logs: { select: { cost: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.land.findMany({ where: { shopId: shop.id, isActive: true }, select: { id: true, name: true, areaBigha: true, type: true } }),
  ]);

  const totalAnimals = activeAnimals.reduce((s, l) => s + l.quantity, 0);
  const monthRevenue = monthSales._sum.totalAmount ?? 0;

  const unsoldHarvestsFiltered = unsoldHarvests
    .map((h) => {
      const soldKg = h.sellRecords.reduce((s, r) => s + r.quantityKg, 0);
      return { id: h.id, quantityKg: h.quantityKg, remaining: h.quantityKg - soldKg };
    })
    .filter((h) => h.remaining > 0);

  const activeCyclesWithCost = cropCyclesFull.map((c) => {
    const logCost = c.logs.reduce((s, l) => s + l.cost, 0);
    const totalCost = c.seedCost + c.fertilizerCost + c.pesticideCost + c.irrigationCost + c.laborCost + c.otherCost + logCost;
    const daysGrowing = c.sowingDate ? Math.floor((now.getTime() - c.sowingDate.getTime()) / 86400000) : 0;
    const daysToHarvest = c.expectedHarvestDate ? Math.ceil((c.expectedHarvestDate.getTime() - now.getTime()) / 86400000) : null;
    return { id: c.id, cropName: c.cropName, cropType: c.cropType, landName: c.land.name, status: c.status, daysGrowing, daysToHarvest, totalCost };
  });

  return NextResponse.json({
    activeCropCycles,
    totalLandBigha: totalLands._sum.areaBigha ?? 0,
    totalLandCount: totalLands._count,
    totalAnimals,
    monthRevenue,
    vaccinationDue,
    harvestDue,
    unsoldHarvests: unsoldHarvestsFiltered,
    activeCycles: activeCyclesWithCost,
    lands,
  });
}
