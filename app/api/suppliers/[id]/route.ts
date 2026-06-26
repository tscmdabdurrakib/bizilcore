import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getApiShop } from "@/lib/shops/api-shop";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await getApiShop();
  if ("error" in ctx) return ctx.error;
  const { id } = await params;

  const supplier = await prisma.supplier.findUnique({
    where: { id, shopId: ctx.activeShop.id },
    include: {
      purchases: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { items: true },
      },
      purchaseOrders: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { items: true },
      },
    },
  });
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(supplier);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await getApiShop();
  if ("error" in ctx) return ctx.error;
  const { id } = await params;

  const body = await req.json();
  const supplier = await prisma.supplier.update({
    where: { id, shopId: ctx.activeShop.id },
    data: {
      name: body.name,
      phone: body.phone || null,
      address: body.address || null,
      email: body.email || null,
      note: body.note || null,
    },
  });
  return NextResponse.json(supplier);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await getApiShop();
  if ("error" in ctx) return ctx.error;
  const { id } = await params;

  await prisma.supplier.delete({ where: { id, shopId: ctx.activeShop.id } });
  return NextResponse.json({ success: true });
}
