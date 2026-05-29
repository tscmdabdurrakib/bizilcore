import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getShop(userId: string) {
  return prisma.shop.findUnique({ where: { userId }, select: { id: true } });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const order = await prisma.restaurantOrder.findFirst({ where: { id, shopId: shop.id } });
  if (!order) return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি" }, { status: 404 });
  if (order.status === "paid" || order.status === "cancelled") {
    return NextResponse.json({ error: "এই অর্ডার পার্ক করা যাবে না" }, { status: 400 });
  }
  if (order.isHeld) return NextResponse.json({ error: "অর্ডার ইতিমধ্যে পার্ক করা আছে" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } });

  const updated = await prisma.restaurantOrder.update({
    where: { id },
    data: { isHeld: true, heldAt: new Date(), heldBy: user?.name ?? "Staff" },
  });

  return NextResponse.json(updated);
}
