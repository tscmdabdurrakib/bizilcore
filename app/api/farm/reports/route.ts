import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();
  const now = new Date();
  const sixMonthsAgo = new Date(now); sixMonthsAgo.setMonth(now.getMonth() - 6);

  const [lands, cycles, livestock, sales] = await Promise.all([
    prisma.land.findMany({ where: { shopId: shop.id }, select: { id: true, name: true, areaBigha: true } }),
    prisma.cropCycle.findMany({
      where: { shopId: shop.id },
      include: {
        logs: { select: { cost: true } },
        harvests: { include: { sellRecords: { select: { totalAmount: true, quantityKg: true } } } },
      },
    }),
    prisma.livestock.findMany({ where: { shopId: shop.id }, select: { type: true, quantity: true, purchaseCost: true, currentValue: true } }),
    prisma.harvestSale.findMany({
      where: { shopId: shop.id, saleDate: { gte: sixMonthsAgo } },
      select: { totalAmount: true, quantityKg: true, saleDate: true },
    }),
  ]);

  const landProfitability = lands.map((land) => {
    const landCycles = cycles.filter((c) => {
      const l = c as typeof c & { landId: string };
      return l.landId === land.id;
    });
    const totalCost = landCycles.reduce((s, c) => {
      const logCost = c.logs.reduce((ls, l) => ls + l.cost, 0);
      return s + c.seedCost + c.fertilizerCost + c.pesticideCost + c.irrigationCost + c.laborCost + c.otherCost + logCost;
    }, 0);
    const totalRevenue = landCycles.flatMap((c) => c.harvests).flatMap((h) => h.sellRecords).reduce((s, r) => s + r.totalAmount, 0);
    return { landName: land.name, areaBigha: land.areaBigha, totalCost, totalRevenue, profit: totalRevenue - totalCost };
  });

  const cropProfitability = cycles.map((c) => {
    const logCost = c.logs.reduce((s, l) => s + l.cost, 0);
    const totalCost = c.seedCost + c.fertilizerCost + c.pesticideCost + c.irrigationCost + c.laborCost + c.otherCost + logCost;
    const totalRevenue = c.harvests.flatMap((h) => h.sellRecords).reduce((s, r) => s + r.totalAmount, 0);
    const totalKg = c.harvests.flatMap((h) => h.sellRecords).reduce((s, r) => s + r.quantityKg, 0);
    return { cropName: c.cropName, status: c.status, totalCost, totalRevenue, profit: totalRevenue - totalCost, totalKg, margin: totalRevenue > 0 ? Math.round(((totalRevenue - totalCost) / totalRevenue) * 100) : 0 };
  });

  const monthlyMap: Record<string, { revenue: number; month: string }> = {};
  for (const sale of sales) {
    const key = `${sale.saleDate.getFullYear()}-${String(sale.saleDate.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, month: key };
    monthlyMap[key].revenue += sale.totalAmount;
  }
  const monthlyRevenue = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

  const livestockValuation = livestock.map((l) => ({
    type: l.type,
    quantity: l.quantity,
    purchaseCost: l.purchaseCost,
    currentValue: l.currentValue ?? l.purchaseCost,
    appreciation: (l.currentValue ?? l.purchaseCost) - l.purchaseCost,
  }));

  return NextResponse.json({ landProfitability, cropProfitability, monthlyRevenue, livestockValuation });
}
