import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStoreCustomer } from "@/lib/store-customer-auth";

export async function GET(req: Request) {
  const customer = await getStoreCustomer();
  if (!customer) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const shop = await prisma.shop.findUnique({ where: { storeSlug: slug }, select: { id: true } });
  if (!shop || shop.id !== customer.shopId) return NextResponse.json({ error: "Invalid store" }, { status: 400 });

  const orders = await prisma.storeOrder.findMany({
    where: { shopId: shop.id, storeCustomerId: customer.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const dbCustomer = await prisma.storeCustomer.findUnique({
    where: { id: customer.id },
    select: { loyaltyPoints: true, walletBalance: true, referralCode: true },
  });

  return NextResponse.json({ orders, customer: dbCustomer });
}
