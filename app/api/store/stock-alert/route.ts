import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { slug, productId, email, phone } = await req.json();
  if (!slug || !productId || (!email && !phone)) {
    return NextResponse.json({ error: "slug, productId, and email or phone required" }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({ where: { storeSlug: slug }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  const product = await prisma.product.findFirst({
    where: { id: productId, shopId: shop.id, storeVisible: true },
    select: { id: true, stockQty: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (product.stockQty > 0) {
    return NextResponse.json({ error: "Product is already in stock" }, { status: 400 });
  }

  await prisma.storeStockAlert.create({
    data: { shopId: shop.id, productId, email: email || null, phone: phone || null },
  });

  return NextResponse.json({ ok: true, message: "We'll notify you when back in stock" });
}
