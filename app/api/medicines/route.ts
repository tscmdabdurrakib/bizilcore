import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

function expiryStatus(batches: { expiryDate: Date; quantity: number }[]) {
  const activeBatches = batches.filter(b => b.quantity > 0);
  if (activeBatches.length === 0) return "none";
  const now = new Date();
  const soonest = activeBatches.reduce((a, b) => a.expiryDate < b.expiryDate ? a : b);
  const diffMs = soonest.expiryDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "critical";
  if (diffDays <= 90) return "warning";
  return "ok";
}

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? "";
  const category = url.searchParams.get("category") ?? "";

  const where: Record<string, unknown> = { shopId: shop.id };
  if (search) {
    where.OR = [
      { brandName: { contains: search, mode: "insensitive" } },
      { genericName: { contains: search, mode: "insensitive" } },
    ];
  }
  if (category) where.category = category;

  const medicines = await prisma.medicine.findMany({
    where,
    include: {
      batches: { orderBy: { expiryDate: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = medicines.map(m => ({
    ...m,
    expiryStatus: expiryStatus(m.batches),
    nearestExpiry: m.batches.filter(b => b.quantity > 0).sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())[0]?.expiryDate ?? null,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();

  const { brandName, genericName, manufacturer, category, unit, sellPrice, buyPrice, stockQty, lowStockAt, requiresRx, isControlled, batch } = body;

  if (!brandName || typeof brandName !== "string" || !brandName.trim()) {
    return NextResponse.json({ error: "brandName আবশ্যক।" }, { status: 400 });
  }
  if (sellPrice == null || isNaN(Number(sellPrice)) || Number(sellPrice) < 0) {
    return NextResponse.json({ error: "sellPrice অবশ্যই শূন্য বা ধনাত্মক হতে হবে।" }, { status: 400 });
  }

  const hasBatch = batch?.batchNumber && batch?.expiryDate;
  let batchQty = 0;
  if (hasBatch) {
    batchQty = Number(batch.quantity ?? 0);
    if (!Number.isInteger(batchQty) || batchQty <= 0) {
      return NextResponse.json({ error: "ব্যাচ পরিমাণ অবশ্যই ধনাত্মক পূর্ণসংখ্যা হতে হবে।" }, { status: 400 });
    }
  }

  const effectiveStockQty = hasBatch ? batchQty : Math.max(0, Number(stockQty ?? 0));

  const medicine = await prisma.medicine.create({
    data: {
      shopId: shop.id,
      brandName: brandName.trim(),
      genericName: genericName ? String(genericName) : null,
      manufacturer: manufacturer ? String(manufacturer) : null,
      category: category ?? "tablet",
      unit: unit ?? "পিস",
      sellPrice: Number(sellPrice),
      buyPrice: Number(buyPrice ?? 0),
      stockQty: effectiveStockQty,
      lowStockAt: Number(lowStockAt ?? 10),
      requiresRx: Boolean(requiresRx),
      isControlled: Boolean(isControlled),
      batches: hasBatch ? {
        create: {
          batchNumber: String(batch.batchNumber).trim(),
          expiryDate: new Date(batch.expiryDate),
          quantity: batchQty,
          buyPrice: batch.buyPrice != null ? Number(batch.buyPrice) : null,
        },
      } : undefined,
    },
    include: { batches: true },
  });

  return NextResponse.json(medicine, { status: 201 });
}
