import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const cycle = await prisma.cropCycle.findFirst({
    where: { id, shopId: shop.id },
    include: {
      land: { select: { id: true, name: true, areaBigha: true } },
      logs: { orderBy: { activityDate: "desc" } },
      harvests: { include: { sellRecords: { include: { buyer: { select: { name: true } } } } } },
    },
  });
  if (!cycle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const logCost = cycle.logs.reduce((s, l) => s + l.cost, 0);
  const totalCost = cycle.seedCost + cycle.fertilizerCost + cycle.pesticideCost + cycle.irrigationCost + cycle.laborCost + cycle.otherCost + logCost;
  const totalHarvested = cycle.harvests.reduce((s, h) => s + h.quantityKg, 0);
  const totalRevenue = cycle.harvests.flatMap((h) => h.sellRecords).reduce((s, r) => s + r.totalAmount, 0);

  return NextResponse.json({ ...cycle, totalCost, totalHarvested, totalRevenue });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const body = await req.json();
  const cycle = await prisma.cropCycle.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.actualHarvestDate !== undefined && { actualHarvestDate: body.actualHarvestDate ? new Date(body.actualHarvestDate) : null }),
      ...(body.actualYieldKg !== undefined && { actualYieldKg: body.actualYieldKg ? parseFloat(body.actualYieldKg) : null }),
      ...(body.fertilizerCost !== undefined && { fertilizerCost: parseFloat(body.fertilizerCost) }),
      ...(body.pesticideCost !== undefined && { pesticideCost: parseFloat(body.pesticideCost) }),
      ...(body.irrigationCost !== undefined && { irrigationCost: parseFloat(body.irrigationCost) }),
      ...(body.laborCost !== undefined && { laborCost: parseFloat(body.laborCost) }),
      ...(body.otherCost !== undefined && { otherCost: parseFloat(body.otherCost) }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });
  return NextResponse.json(cycle);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const body = await req.json();

  if (body.action === "log") {
    const log = await prisma.farmActivityLog.create({
      data: {
        shopId: shop.id,
        cycleId: id,
        activityType: body.activityType,
        description: body.description,
        quantity: body.quantity || null,
        cost: parseFloat(body.cost ?? 0),
        laborCount: body.laborCount ? parseInt(body.laborCount) : null,
        weather: body.weather || null,
        activityDate: body.activityDate ? new Date(body.activityDate) : new Date(),
      },
    });
    return NextResponse.json(log, { status: 201 });
  }

  if (body.action === "harvest") {
    const harvest = await prisma.harvestRecord.create({
      data: {
        shopId: shop.id,
        cycleId: id,
        harvestDate: body.harvestDate ? new Date(body.harvestDate) : new Date(),
        quantityKg: parseFloat(body.quantityKg),
        qualityGrade: body.qualityGrade || null,
        storageLocation: body.storageLocation || null,
        notes: body.notes || null,
      },
    });
    return NextResponse.json(harvest, { status: 201 });
  }

  if (body.action === "sale") {
    const sale = await prisma.harvestSale.create({
      data: {
        shopId: shop.id,
        harvestId: body.harvestId,
        buyerId: body.buyerId || null,
        buyerName: body.buyerName || null,
        buyerPhone: body.buyerPhone || null,
        quantityKg: parseFloat(body.quantityKg),
        pricePerKg: parseFloat(body.pricePerKg),
        totalAmount: parseFloat(body.quantityKg) * parseFloat(body.pricePerKg),
        saleDate: body.saleDate ? new Date(body.saleDate) : new Date(),
        paymentStatus: body.paymentStatus ?? "paid",
        note: body.note || null,
      },
    });
    return NextResponse.json(sale, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
