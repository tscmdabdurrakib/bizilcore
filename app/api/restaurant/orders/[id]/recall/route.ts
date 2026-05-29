import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getShop(userId: string) {
  return prisma.shop.findUnique({ where: { userId }, select: { id: true } });
}

const ORDER_INCLUDE = {
  items: { include: { menuItem: { select: { id: true, name: true, category: true } } } },
  table: { select: { id: true, number: true, floor: true } },
  kotTickets: { select: { id: true, kotNumber: true, sentAt: true, kitchenStatus: true } },
  waiter: { select: { id: true, user: { select: { name: true } } } },
  splits: true,
};

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const order = await prisma.restaurantOrder.findFirst({ where: { id, shopId: shop.id } });
  if (!order) return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি" }, { status: 404 });
  if (!order.isHeld) return NextResponse.json({ error: "অর্ডার পার্ক করা নেই" }, { status: 400 });

  const updated = await prisma.restaurantOrder.update({
    where: { id },
    data: { isHeld: false, heldAt: null, heldBy: null },
    include: ORDER_INCLUDE,
  });

  return NextResponse.json(updated);
}
