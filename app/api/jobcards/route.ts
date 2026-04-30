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

  const where: Record<string, unknown> = { shopId: shop.id };
  if (status && status !== "all") where.status = status;
  if (today) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    where.createdAt = { gte: start, lte: end };
  }
  if (search) {
    where.OR = [
      { jobNumber: { contains: search, mode: "insensitive" } },
      { vehicle: { regNumber: { contains: search, mode: "insensitive" } } },
      { vehicle: { customer: { name: { contains: search, mode: "insensitive" } } } },
      { vehicle: { customer: { phone: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const jobCards = await prisma.jobCard.findMany({
    where,
    include: {
      vehicle: {
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
    vehicleId, complaint, priority, assignedToId, estimatedDone, mileageIn,
    estimatedAmt, advancePaid, services,
    // Vehicle creation
    regNumber, vehicleType, brand, model, year, color, fuelType, engineCC,
    // Customer
    customerId, customerName, customerPhone,
  } = body;

  if (!complaint) return NextResponse.json({ error: "অভিযোগ আবশ্যক" }, { status: 400 });

  let resolvedVehicleId = vehicleId;

  if (!vehicleId) {
    if (!regNumber || !brand || !model) {
      return NextResponse.json({ error: "গাড়ির রেজিস্ট্রেশন, ব্র্যান্ড ও মডেল আবশ্যক" }, { status: 400 });
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

    const existingVehicle = await prisma.vehicle.findUnique({
      where: { shopId_regNumber: { shopId: shop.id, regNumber } },
    });

    if (existingVehicle) {
      resolvedVehicleId = existingVehicle.id;
    } else {
      const newVehicle = await prisma.vehicle.create({
        data: {
          shopId: shop.id,
          customerId: resolvedCustomerId,
          regNumber,
          type: vehicleType || "car",
          brand,
          model,
          year: year ? Number(year) : null,
          color: color || null,
          fuelType: fuelType || null,
          engineCC: engineCC ? Number(engineCC) : null,
          lastMileage: mileageIn ? Number(mileageIn) : null,
        },
      });
      resolvedVehicleId = newVehicle.id;
    }
  }

  if (!resolvedVehicleId) {
    return NextResponse.json({ error: "গাড়ির তথ্য আবশ্যক" }, { status: 400 });
  }

  const prefix = shop.garageJobPrefix || "JOB";
  const year = new Date().getFullYear();
  const count = await prisma.jobCard.count({ where: { shopId: shop.id } });
  const jobNumber = `${prefix}-${year}-${String(count + 1).padStart(3, "0")}`;

  const laborCharge = (services || []).reduce((sum: number, s: { laborCost: number }) => sum + Number(s.laborCost || 0), 0);
  const advance = Number(advancePaid || 0);
  const estimated = Number(estimatedAmt || 0);

  const jobCard = await prisma.jobCard.create({
    data: {
      shopId: shop.id,
      jobNumber,
      vehicleId: resolvedVehicleId,
      complaint,
      priority: priority || "normal",
      assignedToId: assignedToId || null,
      estimatedDone: estimatedDone ? new Date(estimatedDone) : null,
      mileageIn: mileageIn ? Number(mileageIn) : null,
      estimatedAmt: estimated || null,
      advancePaid: advance,
      laborCharge,
      totalAmount: laborCharge + advance,
      dueAmount: Math.max(0, estimated - advance),
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
      vehicle: { include: { customer: true } },
      parts: true,
      services: true,
    },
  });

  return NextResponse.json(jobCard, { status: 201 });
}
