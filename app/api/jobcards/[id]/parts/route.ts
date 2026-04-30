import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();
  const { partName, partNumber, quantity, unitPrice, productId, isFromStock } = body;

  if (!partName || !unitPrice || !quantity) {
    return NextResponse.json({ error: "পার্টসের তথ্য অসম্পূর্ণ" }, { status: 400 });
  }

  const jobCard = await prisma.jobCard.findFirst({ where: { id, shopId: shop.id } });
  if (!jobCard) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const qty = Number(quantity);
  const price = Number(unitPrice);
  const subtotal = qty * price;

  if (isFromStock && productId) {
    const product = await prisma.product.findFirst({ where: { id: productId, shopId: shop.id } });
    if (!product || product.stockQty < qty) {
      return NextResponse.json({ error: "স্টকে যথেষ্ট পরিমাণ নেই" }, { status: 400 });
    }
    await prisma.product.update({ where: { id: productId }, data: { stockQty: { decrement: qty } } });
  }

  const part = await prisma.jobCardPart.create({
    data: {
      jobCardId: id,
      productId: productId || null,
      partName,
      partNumber: partNumber || null,
      quantity: qty,
      unitPrice: price,
      subtotal,
      isFromStock: Boolean(isFromStock),
    },
  });

  const allParts = await prisma.jobCardPart.findMany({ where: { jobCardId: id } });
  const partsTotal = allParts.reduce((sum, p) => sum + p.subtotal, 0);
  const newTotal = jobCard.laborCharge + partsTotal;
  const newDue = Math.max(0, newTotal - jobCard.advancePaid);

  await prisma.jobCard.update({
    where: { id },
    data: { partsTotal, totalAmount: newTotal, dueAmount: newDue },
  });

  return NextResponse.json(part, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const partId = searchParams.get("partId");
  if (!partId) return NextResponse.json({ error: "partId required" }, { status: 400 });

  const jobCard = await prisma.jobCard.findFirst({ where: { id, shopId: shop.id } });
  if (!jobCard) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const part = await prisma.jobCardPart.findFirst({ where: { id: partId, jobCardId: id } });
  if (!part) return NextResponse.json({ error: "Part not found" }, { status: 404 });

  if (part.isFromStock && part.productId) {
    await prisma.product.update({ where: { id: part.productId }, data: { stockQty: { increment: part.quantity } } });
  }

  await prisma.jobCardPart.delete({ where: { id: partId } });

  const allParts = await prisma.jobCardPart.findMany({ where: { jobCardId: id } });
  const partsTotal = allParts.reduce((sum, p) => sum + p.subtotal, 0);
  const newTotal = jobCard.laborCharge + partsTotal;
  const newDue = Math.max(0, newTotal - jobCard.advancePaid);
  await prisma.jobCard.update({ where: { id }, data: { partsTotal, totalAmount: newTotal, dueAmount: newDue } });

  return NextResponse.json({ success: true });
}
