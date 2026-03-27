import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json([]);

  const suggestions = await prisma.suggestedOrder.findMany({
    where: { shopId: shop.id, status: "pending" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(suggestions);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status } = await req.json();
  if (!id || !["converted", "dismissed"].includes(status)) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const updated = await prisma.suggestedOrder.updateMany({
    where: { id, shopId: shop.id },
    data: { status },
  });

  return NextResponse.json({ success: updated.count > 0 });
}
