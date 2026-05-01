import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();
  const harvests = await prisma.harvestRecord.findMany({
    where: { shopId: shop.id },
    include: {
      cycle: { select: { cropName: true, cropType: true, land: { select: { name: true } } } },
      sellRecords: { select: { quantityKg: true, totalAmount: true, saleDate: true, buyerName: true } },
    },
    orderBy: { harvestDate: "desc" },
  });

  const enriched = harvests.map((h) => {
    const soldKg = h.sellRecords.reduce((s, r) => s + r.quantityKg, 0);
    const revenue = h.sellRecords.reduce((s, r) => s + r.totalAmount, 0);
    return { ...h, soldKg, remainingKg: h.quantityKg - soldKg, revenue };
  });

  return NextResponse.json(enriched);
}
