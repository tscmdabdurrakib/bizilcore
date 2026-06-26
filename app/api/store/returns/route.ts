import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStoreCustomer } from "@/lib/store-customer-auth";

export async function GET(req: Request) {
  const customer = await getStoreCustomer();
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const shop = await prisma.shop.findUnique({ where: { storeSlug: slug }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  const where: { shopId: string; storeCustomerId?: string; customerPhone?: string } = { shopId: shop.id };
  if (customer && customer.shopId === shop.id) {
    where.storeCustomerId = customer.id;
  }

  const returns = await prisma.storeReturnRequest.findMany({
    where,
    include: { items: true, storeOrder: { select: { orderNumber: true, totalAmount: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ returns });
}

export async function POST(req: Request) {
  const customer = await getStoreCustomer();
  const body = await req.json();
  const { slug, orderNumber, reason, items, photos } = body;
  if (!slug || !orderNumber || !reason || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({ where: { storeSlug: slug }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  const order = await prisma.storeOrder.findFirst({
    where: { shopId: shop.id, orderNumber },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const ret = await prisma.storeReturnRequest.create({
    data: {
      shopId: shop.id,
      storeOrderId: order.id,
      storeCustomerId: customer?.shopId === shop.id ? customer.id : null,
      reason,
      photos: photos ?? undefined,
      items: {
        create: items.map((i: { productName: string; quantity: number; unitPrice: number }) => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json({ return: ret }, { status: 201 });
}
