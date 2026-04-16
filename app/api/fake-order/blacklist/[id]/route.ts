import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID দিন" }, { status: 400 });

  await prisma.phoneBlacklist.deleteMany({ where: { id, shopId: shop.id } });
  return NextResponse.json({ ok: true });
}
