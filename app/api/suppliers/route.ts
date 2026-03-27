import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const search = new URL(req.url).searchParams.get("search") ?? "";

  const suppliers = await prisma.supplier.findMany({
    where: {
      shopId: shop.id,
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    },
    include: { _count: { select: { purchases: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(suppliers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const supplier = await prisma.supplier.create({
    data: {
      name: body.name,
      phone: body.phone || null,
      address: body.address || null,
      email: body.email || null,
      note: body.note || null,
      shopId: shop.id,
    },
  });
  await logActivity({
    shopId: shop.id,
    userId: session.user.id,
    action: "নতুন সরবরাহকারী যোগ",
    detail: `${supplier.name}${supplier.phone ? ` · ${supplier.phone}` : ""}`,
  });
  return NextResponse.json(supplier, { status: 201 });
}
