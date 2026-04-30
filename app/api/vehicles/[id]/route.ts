import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, shopId: shop.id },
    include: {
      customer: true,
      jobCards: {
        include: {
          parts: true,
          services: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(vehicle);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();

  const vehicle = await prisma.vehicle.findFirst({ where: { id, shopId: shop.id } });
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.vehicle.update({
    where: { id },
    data: {
      ...(body.brand && { brand: body.brand }),
      ...(body.model && { model: body.model }),
      ...(body.type && { type: body.type }),
      ...(body.year !== undefined && { year: body.year ? Number(body.year) : null }),
      ...(body.color !== undefined && { color: body.color }),
      ...(body.engineCC !== undefined && { engineCC: body.engineCC ? Number(body.engineCC) : null }),
      ...(body.lastMileage !== undefined && { lastMileage: body.lastMileage ? Number(body.lastMileage) : null }),
      ...(body.fuelType !== undefined && { fuelType: body.fuelType }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.customerId !== undefined && { customerId: body.customerId }),
    },
    include: { customer: true },
  });

  return NextResponse.json(updated);
}
