import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheDelPrefix } from "@/lib/cache";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  await prisma.facebookConnection.updateMany({
    where: { shopId: shop.id },
    data: { isActive: false },
  });

  cacheDelPrefix(`shop:${shop.id}:fb`);
  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ connected: false });

  const connection = await prisma.facebookConnection.findUnique({
    where: { shopId: shop.id },
    select: { pageId: true, pageName: true, connectedAt: true, isActive: true },
  });

  return NextResponse.json(connection?.isActive ? { connected: true, ...connection } : { connected: false });
}
