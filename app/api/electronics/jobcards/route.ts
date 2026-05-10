import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const search = searchParams.get("search") || "";
  const today = searchParams.get("today") === "1";
  const warranty = searchParams.get("warranty") === "1";

  const where: Record<string, unknown> = { shopId: shop.id, deviceId: { not: null } };
  if (status && status !== "all") where.status = status;
  if (today) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    where.createdAt = { gte: start, lte: end };
  }
  if (warranty) {
    where.warrantyDays = { gt: 0 };
    where.status = "delivered";
    where.deliveredAt = { not: null };
  }
  if (search) {
    where.OR = [
      { jobNumber: { contains: search, mode: "insensitive" } },
      { device: { imei: { contains: search, mode: "insensitive" } } },
      { device: { serialNumber: { contains: search, mode: "insensitive" } } },
      { device: { brand: { contains: search, mode: "insensitive" } } },
      { device: { customer: { name: { contains: search, mode: "insensitive" } } } },
      { device: { customer: { phone: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const jobCards = await prisma.jobCard.findMany({
    where,
    include: {
      device: {
        include: { customer: { select: { id: true, name: true, phone: true } } },
      },
      parts: true,
      services: true,
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return NextResponse.json(jobCards);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const {
    deviceId, complaint, priority, assignedToId, estimatedDone,
    estimatedAmt, advancePaid, services, lockCode, dataBackedUp,
    // Device creation fields
    deviceType, brand, model, imei, imei2, serialNumber, color, storageGB, condition, accessories,
    // Customer
    customerId, customerName, customerPhone,
  } = body;

  if (!complaint) return NextResponse.json({ error: "অভিযোগ আবশ্যক" }, { status: 400 });

  let resolvedDeviceId = deviceId;

  if (!deviceId) {
    if (!brand || !model || !deviceType) {
      return NextResponse.json({ error: "ডিভাইসের ধরন, ব্র্যান্ড ও মডেল আবশ্যক" }, { status: 400 });
    }

    let resolvedCustomerId: string | null = customerId || null;
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

    const newDevice = await prisma.device.create({
      data: {
        shopId: shop.id,
        customerId: resolvedCustomerId,
        type: deviceType,
        brand,
        model,
        imei: imei || null,
        imei2: imei2 || null,
        serialNumber: serialNumber || null,
        color: color || null,
        storageGB: storageGB || null,
        condition: condition || null,
        accessories: accessories || [],
      },
    });
    resolvedDeviceId = newDevice.id;
  }

  if (!resolvedDeviceId) {
    return NextResponse.json({ error: "ডিভাইসের তথ্য আবশ্যক" }, { status: 400 });
  }

  const prefix = shop.electronicsJobPrefix || "ELC";
  const jobYear = new Date().getFullYear();
  const count = await prisma.jobCard.count({ where: { shopId: shop.id, deviceId: { not: null } } });
  const jobNumber = `${prefix}-${jobYear}-${String(count + 1).padStart(3, "0")}`;

  const laborCharge = (services || []).reduce((sum: number, s: { laborCost: number }) => sum + Number(s.laborCost || 0), 0);
  const advance = Number(advancePaid || 0);
  const estimated = Number(estimatedAmt || 0);

  const jobCard = await prisma.jobCard.create({
    data: {
      shopId: shop.id,
      jobNumber,
      deviceId: resolvedDeviceId,
      complaint,
      priority: priority || "normal",
      assignedToId: assignedToId || null,
      estimatedDone: estimatedDone ? new Date(estimatedDone) : null,
      estimatedAmt: estimated || null,
      advancePaid: advance,
      laborCharge,
      totalAmount: laborCharge + advance,
      dueAmount: Math.max(0, estimated - advance),
      lockCode: lockCode || null,
      dataBackedUp: dataBackedUp || false,
      services: services?.length
        ? {
            create: services.map((s: { serviceName: string; laborCost: number; mechanicId?: string }) => ({
              serviceName: s.serviceName,
              laborCost: Number(s.laborCost || 0),
              mechanicId: s.mechanicId || null,
            })),
          }
        : undefined,
    },
    include: {
      device: { include: { customer: true } },
      parts: true,
      services: true,
    },
  });

  return NextResponse.json(jobCard, { status: 201 });
}
