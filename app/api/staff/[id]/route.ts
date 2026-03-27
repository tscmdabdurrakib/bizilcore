import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const member = await prisma.staffMember.findFirst({ where: { id, shopId: shop.id } });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.staffMember.update({
    where: { id },
    data: { role: body.role ?? member.role, isActive: body.isActive ?? member.isActive },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  await prisma.staffMember.updateMany({
    where: { id, shopId: shop.id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
