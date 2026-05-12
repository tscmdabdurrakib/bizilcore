import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();

  let body: { sourceTableId?: string; targetTableId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { sourceTableId, targetTableId } = body;
  if (!sourceTableId || !targetTableId) {
    return NextResponse.json({ error: "sourceTableId and targetTableId required" }, { status: 400 });
  }
  if (sourceTableId === targetTableId) {
    return NextResponse.json({ error: "Source and target tables must be different" }, { status: 400 });
  }

  const [source, target] = await Promise.all([
    prisma.diningTable.findFirst({ where: { id: sourceTableId, shopId: shop.id } }),
    prisma.diningTable.findFirst({ where: { id: targetTableId, shopId: shop.id } }),
  ]);

  if (!source) return NextResponse.json({ error: "Source table not found" }, { status: 404 });
  if (!target) return NextResponse.json({ error: "Target table not found" }, { status: 404 });

  const ACTIVE = ["pending", "preparing", "ready", "served", "billing"];

  const sourceOrders = await prisma.restaurantOrder.findMany({
    where: { tableId: sourceTableId, shopId: shop.id, status: { in: ACTIVE } },
    select: { id: true },
  });

  if (sourceOrders.length === 0) {
    return NextResponse.json({ error: "Source table has no active orders to merge" }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.restaurantOrder.updateMany({
      where: { id: { in: sourceOrders.map(o => o.id) } },
      data: { tableId: targetTableId },
    }),
    prisma.diningTable.update({
      where: { id: sourceTableId },
      data: { status: "available" },
    }),
    prisma.diningTable.update({
      where: { id: targetTableId },
      data: { status: "occupied" },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    message: `টেবিল ${source.number} থেকে অর্ডার টেবিল ${target.number}-এ মার্জ হয়েছে`,
    mergedOrderCount: sourceOrders.length,
  });
}
