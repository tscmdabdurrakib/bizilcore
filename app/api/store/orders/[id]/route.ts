import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const order = await prisma.storeOrder.findFirst({
    where: { id, shopId: shop.id },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, imageUrl: true } } },
      },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const order = await prisma.storeOrder.findFirst({ where: { id, shopId: shop.id } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { status, paymentStatus } = body;

  const VALID_TRANSITIONS: Record<string, string[]> = {
    pending:    ["confirmed", "cancelled"],
    confirmed:  ["packed", "cancelled"],
    packed:     ["shipped", "cancelled"],
    shipped:    ["delivered", "cancelled"],
    delivered:  [],
    cancelled:  [],
  };

  if (status) {
    const current = order.status;
    const allowed = VALID_TRANSITIONS[current] ?? [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `'${current}' থেকে '${status}' স্ট্যাটাসে পরিবর্তন করা যাবে না` },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.storeOrder.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
    },
  });

  if (status) {
    await prisma.order.updateMany({
      where: { storeOrderId: id },
      data: { status },
    });
  }

  return NextResponse.json(updated);
}
