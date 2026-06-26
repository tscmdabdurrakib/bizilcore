import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateProductCaption } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true, name: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { productId, name } = body as { productId?: string; name?: string };

  let pName = name?.trim() || "";
  let price: number | null = null;
  let description: string | null = null;

  if (productId) {
    const product = await prisma.product.findFirst({
      where: { id: productId, shopId: shop.id },
      select: { name: true, sellPrice: true, description: true },
    });
    if (product) {
      pName = product.name;
      price = product.sellPrice;
      description = product.description;
    }
  }

  if (!pName) return NextResponse.json({ error: "পণ্যের নাম প্রয়োজন" }, { status: 400 });

  const caption = await generateProductCaption({ name: pName, price, description, shopName: shop.name });
  return NextResponse.json({ caption });
}
