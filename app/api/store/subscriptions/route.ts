import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStoreCustomer } from "@/lib/store-customer-auth";

export async function GET(req: Request) {
  const customer = await getStoreCustomer();
  if (!customer) return NextResponse.json({ subscriptions: [] });

  const subscriptions = await prisma.productSubscription.findMany({
    where: { storeCustomerId: customer.id },
    orderBy: { nextDeliveryAt: "asc" },
  });
  return NextResponse.json({ subscriptions });
}

export async function POST(req: Request) {
  const customer = await getStoreCustomer();
  if (!customer) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { slug, productId, frequency, quantity, discountPercent } = await req.json();
  if (!slug || !productId || !frequency) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({ where: { storeSlug: slug }, select: { id: true } });
  if (!shop || shop.id !== customer.shopId) {
    return NextResponse.json({ error: "Invalid store" }, { status: 400 });
  }

  const days = frequency === "weekly" ? 7 : frequency === "biweekly" ? 14 : 30;
  const sub = await prisma.productSubscription.create({
    data: {
      shopId: shop.id,
      storeCustomerId: customer.id,
      productId,
      frequency,
      quantity: parseInt(String(quantity), 10) || 1,
      discountPercent: parseFloat(discountPercent) || 0,
      nextDeliveryAt: new Date(Date.now() + days * 86400000),
    },
  });

  return NextResponse.json(sub, { status: 201 });
}

export async function PATCH(req: Request) {
  const customer = await getStoreCustomer();
  if (!customer) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { id, status } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const sub = await prisma.productSubscription.updateMany({
    where: { id, storeCustomerId: customer.id },
    data: { status },
  });
  return NextResponse.json({ updated: sub.count });
}
