import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });

  const [notifications, lowStockProducts, suggestedOrders] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    shop ? prisma.$queryRaw<{ id: string; name: string; stockQty: number; lowStockAt: number }[]>`
      SELECT id, name, "stockQty", "lowStockAt"
      FROM "Product"
      WHERE "shopId" = ${shop.id} AND "stockQty" <= "lowStockAt"
      ORDER BY "stockQty" ASC
      LIMIT 5
    `.catch(() => []) : [],
    shop ? prisma.suggestedOrder.findMany({
      where: { shopId: shop.id, status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 3,
    }) : [],
  ]);

  const unread = notifications.filter(n => !n.read).length;

  return NextResponse.json({ notifications, unread, lowStockProducts, suggestedOrders });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { markAllRead, id } = await req.json();

  if (markAllRead) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  }

  if (id) {
    await prisma.notification.update({ where: { id }, data: { read: true } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid" }, { status: 400 });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.notification.deleteMany({ where: { userId: session.user.id, read: true } });
  return NextResponse.json({ success: true });
}
