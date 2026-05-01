import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where: Record<string, unknown> = { shopId: shop.id };
  if (status === "active") where.status = { in: ["planned", "sowing", "growing", "harvesting"] };
  if (status === "completed") where.status = "completed";

  const cycles = await prisma.cropCycle.findMany({
    where,
    include: {
      land: { select: { id: true, name: true } },
      logs: { select: { cost: true } },
      harvests: { include: { sellRecords: { select: { quantityKg: true, totalAmount: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const enriched = cycles.map((c) => {
    const logCost = c.logs.reduce((s, l) => s + l.cost, 0);
    const totalCost = c.seedCost + c.fertilizerCost + c.pesticideCost + c.irrigationCost + c.laborCost + c.otherCost + logCost;
    const totalHarvested = c.harvests.reduce((s, h) => s + h.quantityKg, 0);
    const totalRevenue = c.harvests.flatMap((h) => h.sellRecords).reduce((s, r) => s + r.totalAmount, 0);
    const now = new Date();
    const daysGrowing = c.sowingDate ? Math.floor((now.getTime() - new Date(c.sowingDate).getTime()) / 86400000) : 0;
    const daysToHarvest = c.expectedHarvestDate ? Math.ceil((new Date(c.expectedHarvestDate).getTime() - now.getTime()) / 86400000) : null;
    return { ...c, totalCost, totalHarvested, totalRevenue, daysGrowing, daysToHarvest };
  });

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();
  const cycle = await prisma.cropCycle.create({
    data: {
      shopId: shop.id,
      landId: body.landId,
      cropName: body.cropName,
      cropType: body.cropType,
      season: body.season || null,
      sowingDate: body.sowingDate ? new Date(body.sowingDate) : null,
      expectedHarvestDate: body.expectedHarvestDate ? new Date(body.expectedHarvestDate) : null,
      seedSource: body.seedSource || null,
      seedCost: parseFloat(body.seedCost ?? 0),
      fertilizerCost: parseFloat(body.fertilizerCost ?? 0),
      expectedYieldKg: body.expectedYieldKg ? parseFloat(body.expectedYieldKg) : null,
      notes: body.notes || null,
      status: "planned",
    },
    include: { land: { select: { name: true } } },
  });
  return NextResponse.json(cycle, { status: 201 });
}
