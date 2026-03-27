import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") ?? "1month";

  const now = new Date();

  let dateFilter: Record<string, unknown>;

  if (filter === "expired") {
    dateFilter = { lt: now };
  } else if (filter === "1month") {
    const cutoff = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    dateFilter = { gte: now, lte: cutoff };
  } else {
    const cutoff = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const oneMonthOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    dateFilter = { gt: oneMonthOut, lte: cutoff };
  }

  const batches = await prisma.medicineBatch.findMany({
    where: {
      medicine: { shopId: shop.id },
      quantity: { gt: 0 },
      expiryDate: dateFilter,
    },
    include: {
      medicine: { select: { id: true, brandName: true, genericName: true, category: true, unit: true } },
    },
    orderBy: { expiryDate: "asc" },
  });

  return NextResponse.json(batches);
}
