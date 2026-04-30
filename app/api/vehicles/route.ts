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

  const vehicles = await prisma.vehicle.findMany({
    where: {
      shopId: shop.id,
      ...(search ? {
        OR: [
          { regNumber: { contains: search, mode: "insensitive" } },
          { brand: { contains: search, mode: "insensitive" } },
          { model: { contains: search, mode: "insensitive" } },
          { customer: { name: { contains: search, mode: "insensitive" } } },
          { customer: { phone: { contains: search, mode: "insensitive" } } },
        ],
      } : {}),
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      jobCards: { select: { id: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { jobCards: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(vehicles);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { regNumber, type, brand, model, year, color, engineCC, lastMileage, fuelType, notes, customerId, customerName, customerPhone } = body;

  if (!regNumber || !brand || !model) {
    return NextResponse.json({ error: "রেজিস্ট্রেশন নম্বর, ব্র্যান্ড ও মডেল আবশ্যক" }, { status: 400 });
  }

  const existing = await prisma.vehicle.findUnique({ where: { shopId_regNumber: { shopId: shop.id, regNumber } } });
  if (existing) return NextResponse.json({ error: "এই রেজিস্ট্রেশন নম্বরের গাড়ি আগেই আছে" }, { status: 400 });

  let resolvedCustomerId = customerId || null;
  if (!customerId && customerName && customerPhone) {
    let customer = await prisma.customer.findFirst({ where: { shopId: shop.id, phone: customerPhone } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { shopId: shop.id, name: customerName, phone: customerPhone },
      });
    }
    resolvedCustomerId = customer.id;
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      shopId: shop.id,
      customerId: resolvedCustomerId,
      regNumber,
      type: type || "car",
      brand,
      model,
      year: year ? Number(year) : null,
      color: color || null,
      engineCC: engineCC ? Number(engineCC) : null,
      lastMileage: lastMileage ? Number(lastMileage) : null,
      fuelType: fuelType || null,
      notes: notes || null,
    },
    include: { customer: { select: { id: true, name: true, phone: true } } },
  });

  return NextResponse.json(vehicle, { status: 201 });
}
