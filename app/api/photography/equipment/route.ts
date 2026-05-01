import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { shop } = await requireShop();
    const equipment = await prisma.photoEquipment.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: "desc" },
      include: {
        bookings: {
          include: {
            booking: {
              select: { id: true, eventDate: true, status: true, clientName: true },
            },
          },
        },
      },
    });
    return NextResponse.json(equipment);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const body = await req.json();

    const item = await prisma.photoEquipment.create({
      data: {
        shopId: shop.id,
        name: body.name,
        category: body.category,
        serialNumber: body.serialNumber ?? null,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchaseCost: body.purchaseCost ? parseFloat(body.purchaseCost) : null,
        condition: body.condition ?? "good",
        insuranceExp: body.insuranceExp ? new Date(body.insuranceExp) : null,
        notes: body.notes ?? null,
      },
    });

    return NextResponse.json(item);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create equipment" }, { status: 500 });
  }
}
