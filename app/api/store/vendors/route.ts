import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveShopForApi } from "@/lib/shops/access";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const vendors = await prisma.storeVendor.findMany({
    where: { shopId: shopCtx.activeShop.id },
    include: { _count: { select: { products: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(vendors);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const { name, email, phone, commissionRate } = await req.json();
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email required" }, { status: 400 });
  }

  await prisma.shop.update({
    where: { id: shopCtx.activeShop.id },
    data: { storeMultiVendorEnabled: true },
  });

  const vendor = await prisma.storeVendor.create({
    data: {
      shopId: shopCtx.activeShop.id,
      name: name.trim(),
      email: email.trim(),
      phone: phone || null,
      commissionRate: parseFloat(commissionRate) || 10,
    },
  });
  return NextResponse.json(vendor, { status: 201 });
}
