import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const customerId = searchParams.get("customerId") || "";

  const where: Record<string, unknown> = { shopId: shop.id };
  if (customerId) where.customerId = customerId;
  if (search) {
    where.OR = [
      { imei: { contains: search, mode: "insensitive" } },
      { imei2: { contains: search, mode: "insensitive" } },
      { serialNumber: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
      { customer: { phone: { contains: search, mode: "insensitive" } } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const devices = await prisma.device.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      jobCards: {
        select: { id: true, jobNumber: true, status: true, advancePaid: true, dueAmount: true, totalAmount: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(devices);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { customerId, customerName, customerPhone, type, brand, model, imei, imei2, serialNumber, color, storageGB, condition, accessories, notes } = body;

  if (!type || !brand || !model) {
    return NextResponse.json({ error: "ডিভাইসের ধরন, ব্র্যান্ড ও মডেল আবশ্যক" }, { status: 400 });
  }

  let resolvedCustomerId = customerId;
  if (!customerId && customerName && customerPhone) {
    let customer = await prisma.customer.findFirst({ where: { shopId: shop.id, phone: customerPhone } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { shopId: shop.id, name: customerName, phone: customerPhone },
      });
    }
    resolvedCustomerId = customer.id;
  }

  if (!resolvedCustomerId) {
    return NextResponse.json({ error: "মালিকের তথ্য আবশ্যক" }, { status: 400 });
  }

  const device = await prisma.device.create({
    data: {
      shopId: shop.id,
      customerId: resolvedCustomerId,
      type,
      brand,
      model,
      imei: imei || null,
      imei2: imei2 || null,
      serialNumber: serialNumber || null,
      color: color || null,
      storageGB: storageGB || null,
      condition: condition || null,
      accessories: accessories || [],
      notes: notes || null,
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
    },
  });

  return NextResponse.json(device, { status: 201 });
}
