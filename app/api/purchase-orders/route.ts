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
  const status = searchParams.get("status");
  const supplierId = searchParams.get("supplierId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "30");

  const where: Record<string, unknown> = { shopId: shop.id };
  if (status) where.status = status;
  if (supplierId) where.supplierId = supplierId;

  const [purchaseOrders, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return NextResponse.json({ purchaseOrders, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { supplierId, items, notes, expectedDate } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Items required" }, { status: 400 });
  }

  const total = (items as { quantity: number; unitPrice: number }[]).reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const count = await prisma.purchaseOrder.count({ where: { shopId: shop.id } });
  const poNumber = `PO-${String(count + 1).padStart(4, "0")}`;

  const po = await prisma.purchaseOrder.create({
    data: {
      shopId: shop.id,
      userId: session.user.id,
      supplierId: supplierId || null,
      poNumber,
      status: "draft",
      total,
      notes: notes || null,
      expectedDate: expectedDate ? new Date(expectedDate) : null,
      items: {
        create: (items as { name: string; quantity: number; unitPrice: number }[]).map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.quantity * item.unitPrice,
        })),
      },
    },
    include: { items: true, supplier: true },
  });

  await logActivity({ userId: session.user.id, shopId: shop.id, action: "po_create", detail: `ক্রয় অর্ডার: ${poNumber} — ৳${total}` });

  return NextResponse.json(po, { status: 201 });
}
