import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classifySegment } from "@/lib/segments";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const customer = await prisma.customer.findUnique({
    where: { id, shopId: shop.id },
    include: {
      orders: {
        include: { items: { include: { product: { select: { name: true } }, combo: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const completed = customer.orders.filter(o => o.status !== "cancelled");
  const orderCount = completed.length;
  const totalSpend = completed.reduce((s, o) => s + o.totalAmount, 0);
  const lastOrder = completed[0]?.createdAt ?? null;
  const firstOrder = completed[completed.length - 1]?.createdAt ?? null;
  const segment = classifySegment(orderCount, totalSpend, firstOrder, lastOrder, new Date());

  return NextResponse.json({ ...customer, segment });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const customer = await prisma.customer.update({
    where: { id, shopId: shop.id },
    data: {
      name: body.name,
      phone: body.phone || null,
      address: body.address || null,
      fbProfile: body.fbProfile || null,
      ...(body.group ? { group: body.group } : {}),
      ...(typeof body.loyaltyPoints === "number" ? { loyaltyPoints: body.loyaltyPoints } : {}),
    },
  });
  return NextResponse.json(customer);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const customer = await prisma.customer.findUnique({ where: { id, shopId: shop.id } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.order.updateMany({ where: { customerId: id }, data: { customerId: null } });
  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
