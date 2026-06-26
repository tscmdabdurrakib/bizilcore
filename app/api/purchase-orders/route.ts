import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";
import { generatePONumber } from "@/lib/purchase-orders/server";
import { getShopForUser } from "@/lib/purchase-orders/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForUser(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const supplierId = searchParams.get("supplierId");
  const search = searchParams.get("search");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const overdue = searchParams.get("overdue") === "1";
  const sort = searchParams.get("sort") ?? "createdAt";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "30");

  const where: Record<string, unknown> = { shopId: shop.id };
  if (status) where.status = status;
  if (supplierId) where.supplierId = supplierId;
  if (overdue) {
    where.status = { in: ["sent", "partially_received"] };
    where.expectedDate = { lt: new Date(new Date().setHours(0, 0, 0, 0)) };
  }
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999Z`) } : {}),
    };
  }
  if (search) {
    where.OR = [
      { poNumber: { contains: search, mode: "insensitive" } },
      { supplier: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const orderBy =
    sort === "total"
      ? { total: "desc" as const }
      : sort === "expectedDate"
        ? { expectedDate: "asc" as const }
        : { createdAt: "desc" as const };

  const [purchaseOrders, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
        items: { include: { product: { select: { id: true, name: true } } } },
        purchase: { select: { id: true, totalAmount: true, dueAmount: true } },
      },
      orderBy,
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

  const shop = await getShopForUser(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { supplierId, items, notes, expectedDate, duplicateFromId } = body;

  let poItems = items as { name: string; productId?: string; quantity: number; unitPrice: number }[];

  if (duplicateFromId) {
    const source = await prisma.purchaseOrder.findFirst({
      where: { id: duplicateFromId, shopId: shop.id },
      include: { items: true },
    });
    if (!source) return NextResponse.json({ error: "Source PO not found" }, { status: 404 });
    poItems = source.items.map((i) => ({
      name: i.name,
      productId: i.productId ?? undefined,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }));
  }

  if (!poItems || poItems.length === 0) {
    return NextResponse.json({ error: "Items required" }, { status: 400 });
  }

  const total = poItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const poNumber = await generatePONumber(shop.id);

  const resolvedSupplierId = supplierId ?? (duplicateFromId
    ? (await prisma.purchaseOrder.findFirst({ where: { id: duplicateFromId, shopId: shop.id }, select: { supplierId: true } }))?.supplierId
    : null);

  const po = await prisma.purchaseOrder.create({
    data: {
      shopId: shop.id,
      userId: session.user.id,
      supplierId: resolvedSupplierId || null,
      poNumber,
      status: "draft",
      total,
      notes: notes || (duplicateFromId ? `অনুলিপি থেকে তৈরি` : null),
      expectedDate: expectedDate ? new Date(expectedDate) : null,
      items: {
        create: poItems.map((item) => ({
          name: item.name,
          productId: item.productId || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.quantity * item.unitPrice,
        })),
      },
    },
    include: {
      items: { include: { product: { select: { id: true, name: true } } } },
      supplier: { select: { id: true, name: true, phone: true } },
    },
  });

  await logActivity({
    userId: session.user.id,
    shopId: shop.id,
    action: "po_create",
    detail: `ক্রয় অর্ডার: ${poNumber} — ৳${total}`,
  });

  return NextResponse.json(po, { status: 201 });
}
