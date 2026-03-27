import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const supplierId = searchParams.get("supplierId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "30");

  const where = {
    shopId: shop.id,
    ...(supplierId ? { supplierId } : {}),
  };

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.purchase.count({ where }),
  ]);

  return NextResponse.json({ purchases, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { supplierId, items, paidAmount, note } = body;

  const totalAmount = (items as { quantity: number; unitPrice: number }[]).reduce(
    (s, i) => s + i.quantity * i.unitPrice,
    0
  );
  const paid = parseFloat(paidAmount ?? 0);
  const dueAmount = totalAmount - paid;

  const purchase = await prisma.purchase.create({
    data: {
      supplierId: supplierId || null,
      shopId: shop.id,
      userId: session.user.id,
      totalAmount,
      paidAmount: paid,
      dueAmount,
      note: note || null,
      status: dueAmount <= 0 ? "paid" : "pending",
      items: {
        create: (items as { name: string; productId?: string; quantity: number; unitPrice: number }[]).map((i) => ({
          name: i.name,
          productId: i.productId || null,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          subtotal: i.quantity * i.unitPrice,
        })),
      },
    },
    include: { items: true, supplier: true },
  });

  // Update supplier due if supplier set
  if (supplierId && dueAmount > 0) {
    await prisma.supplier.update({
      where: { id: supplierId },
      data: { dueAmount: { increment: dueAmount } },
    });
  }

  // Update product stock (increment for purchases)
  for (const item of items as { productId?: string; quantity: number }[]) {
    if (item.productId) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stockQty: { increment: item.quantity } },
      });
      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          userId: session.user.id,
          type: "in",
          quantity: item.quantity,
          reason: `Purchase entry`,
        },
      });
    }
  }

  await logActivity({
    shopId: shop.id,
    userId: session.user.id,
    action: "নতুন পার্চেজ এন্ট্রি",
    detail: `৳${totalAmount.toLocaleString()}${purchase.supplier ? ` · ${purchase.supplier.name}` : ""}${note ? ` · ${note}` : ""}`,
  });

  return NextResponse.json(purchase, { status: 201 });
}
