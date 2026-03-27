import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const purchase = await prisma.purchase.findUnique({
    where: { id, shopId: shop.id },
    include: { supplier: true, items: { include: { product: { select: { name: true } } } } },
  });
  if (!purchase) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(purchase);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const purchase = await prisma.purchase.findUnique({ where: { id, shopId: shop.id } });
  if (!purchase) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Handle payment
  if (body.addPayment) {
    const extra = parseFloat(body.addPayment);
    const newPaid = Math.min(purchase.paidAmount + extra, purchase.totalAmount);
    const newDue = purchase.totalAmount - newPaid;
    const updated = await prisma.purchase.update({
      where: { id },
      data: {
        paidAmount: newPaid,
        dueAmount: newDue,
        status: newDue <= 0 ? "paid" : "pending",
      },
    });
    // Update supplier due
    if (purchase.supplierId) {
      await prisma.supplier.update({
        where: { id: purchase.supplierId },
        data: { dueAmount: { decrement: extra } },
      });
    }
    return NextResponse.json(updated);
  }

  const updated = await prisma.purchase.update({
    where: { id },
    data: { note: body.note ?? purchase.note, status: body.status ?? purchase.status },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  await prisma.purchase.delete({ where: { id, shopId: shop.id } });
  return NextResponse.json({ success: true });
}
