import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const review = await prisma.storeReview.findFirst({ where: { id, shopId: shop.id } });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { isApproved } = body;

  const updated = await prisma.storeReview.update({
    where: { id },
    data: { isApproved: Boolean(isApproved) },
  });

  return NextResponse.json(updated);
}
