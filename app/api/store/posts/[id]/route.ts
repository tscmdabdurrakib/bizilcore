import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const post = await prisma.scheduledPost.findFirst({ where: { id, shopId: shop.id }, select: { id: true, status: true } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Cancel pending posts; hard-delete already-finished ones.
  if (post.status === "scheduled") {
    await prisma.scheduledPost.update({ where: { id }, data: { status: "cancelled" } });
  } else {
    await prisma.scheduledPost.delete({ where: { id } });
  }
  return NextResponse.json({ ok: true });
}
