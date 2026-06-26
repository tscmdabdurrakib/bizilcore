import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveShopForApi } from "@/lib/shops/access";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const affiliates = await prisma.storeAffiliate.findMany({
    where: { shopId: shopCtx.activeShop.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(affiliates);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const { name, code, commissionRate } = await req.json();
  if (!name?.trim() || !code?.trim()) {
    return NextResponse.json({ error: "Name and code required" }, { status: 400 });
  }

  const affiliate = await prisma.storeAffiliate.create({
    data: {
      shopId: shopCtx.activeShop.id,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      commissionRate: parseFloat(commissionRate) || 5,
    },
  });
  return NextResponse.json(affiliate, { status: 201 });
}
