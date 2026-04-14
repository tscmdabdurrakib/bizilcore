import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getShopId(userId: string) {
  const shop = await prisma.shop.findUnique({ where: { userId }, select: { id: true } });
  return shop?.id ?? null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();
  const { name, phone, address, emailVerified } = body;

  const existing = await prisma.storeCustomer.findFirst({ where: { id, shopId } });
  if (!existing) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const updated = await prisma.storeCustomer.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: String(name).trim() }),
      ...(phone !== undefined && { phone: phone ? String(phone).trim() : null }),
      ...(address !== undefined && { address: address ? String(address).trim() : null }),
      ...(emailVerified !== undefined && { emailVerified: Boolean(emailVerified) }),
    },
    select: { id: true, name: true, email: true, phone: true, address: true, avatar: true, emailVerified: true, googleId: true, createdAt: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;

  const existing = await prisma.storeCustomer.findFirst({ where: { id, shopId } });
  if (!existing) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  await prisma.storeCustomer.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
