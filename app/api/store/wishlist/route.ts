import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStoreCustomer } from "@/lib/store-customer-auth";

export async function GET(req: Request) {
  const customer = await getStoreCustomer();
  if (!customer) return NextResponse.json({ items: [] });

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const shop = await prisma.shop.findUnique({ where: { storeSlug: slug }, select: { id: true } });
  if (!shop || shop.id !== customer.shopId) return NextResponse.json({ items: [] });

  const items = await prisma.storeWishlistItem.findMany({
    where: { storeCustomerId: customer.id },
    include: {
      product: {
        select: { id: true, name: true, sellPrice: true, imageUrl: true, stockQty: true, storeVisible: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    items: items
      .filter((i) => i.product.storeVisible)
      .map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        sellPrice: i.product.sellPrice,
        productImage: i.product.imageUrl,
        inStock: i.product.stockQty > 0,
      })),
  });
}

export async function POST(req: Request) {
  const customer = await getStoreCustomer();
  if (!customer) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { productId, slug } = await req.json();
  if (!productId || !slug) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const shop = await prisma.shop.findUnique({ where: { storeSlug: slug }, select: { id: true } });
  if (!shop || shop.id !== customer.shopId) return NextResponse.json({ error: "Invalid store" }, { status: 400 });

  const product = await prisma.product.findFirst({
    where: { id: productId, shopId: shop.id, storeVisible: true },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  await prisma.storeWishlistItem.upsert({
    where: { storeCustomerId_productId: { storeCustomerId: customer.id, productId } },
    create: { storeCustomerId: customer.id, productId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const customer = await getStoreCustomer();
  if (!customer) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  await prisma.storeWishlistItem.deleteMany({
    where: { storeCustomerId: customer.id, productId },
  });

  return NextResponse.json({ ok: true });
}
