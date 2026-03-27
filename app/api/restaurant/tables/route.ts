import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getShop(userId: string) {
  return prisma.shop.findUnique({ where: { userId }, select: { id: true } });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const tables = await prisma.diningTable.findMany({
    where: { shopId: shop.id },
    include: {
      restaurantOrders: {
        where: { status: { in: ["pending", "preparing", "ready", "served"] } },
        select: { id: true, status: true, totalAmount: true, createdAt: true, type: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: [{ floor: "asc" }, { number: "asc" }],
  });

  return NextResponse.json(tables);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  let body: { number?: number; capacity?: number; floor?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.number) return NextResponse.json({ error: "Table number required" }, { status: 400 });

  const existing = await prisma.diningTable.findFirst({
    where: { shopId: shop.id, number: body.number },
  });
  if (existing) return NextResponse.json({ error: "Table number already exists" }, { status: 409 });

  const table = await prisma.diningTable.create({
    data: {
      shopId: shop.id,
      number: body.number,
      capacity: body.capacity ?? 4,
      floor: body.floor ?? "Ground",
    },
  });

  return NextResponse.json(table, { status: 201 });
}
