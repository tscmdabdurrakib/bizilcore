import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveShopForApi } from "@/lib/shops/access";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const sales = await prisma.flashSale.findMany({
    where: { shopId: shopCtx.activeShop.id },
    include: { products: { include: { product: { select: { id: true, name: true, sellPrice: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(sales);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const { name, startAt, endAt, products } = await req.json();
  if (!name?.trim() || !startAt || !endAt || !Array.isArray(products) || products.length === 0) {
    return NextResponse.json({ error: "Invalid flash sale data" }, { status: 400 });
  }

  const sale = await prisma.flashSale.create({
    data: {
      shopId: shopCtx.activeShop.id,
      name: name.trim(),
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      products: {
        create: products.map((p: { productId: string; salePrice: number; maxQty?: number }) => ({
          productId: p.productId,
          salePrice: parseFloat(String(p.salePrice)),
          maxQty: p.maxQty ? parseInt(String(p.maxQty), 10) : null,
        })),
      },
    },
    include: { products: true },
  });

  return NextResponse.json(sale, { status: 201 });
}
