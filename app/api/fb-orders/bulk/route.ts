import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["pending", "confirmed", "cancelled", "delivered", "converted"];

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { ids, status } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0 || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await prisma.suggestedOrder.updateMany({
    where: { id: { in: ids }, shopId: shop.id },
    data:  { status },
  });

  return NextResponse.json({ updated: result.count });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await prisma.suggestedOrder.deleteMany({
    where: { id: { in: ids }, shopId: shop.id },
  });

  return NextResponse.json({ deleted: result.count });
}
