import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { shop } = await requireShop();
    const rooms = await prisma.treatmentRoom.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(rooms);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const body = await req.json();
    const { name, type, capacity, amenities, rateExtra } = body;
    if (!name?.trim()) return NextResponse.json({ error: "নামটি আবশ্যিক।" }, { status: 400 });

    const room = await prisma.treatmentRoom.create({
      data: {
        shopId: shop.id,
        name: name.trim(),
        type: type ?? "standard",
        capacity: Number(capacity) || 1,
        amenities: Array.isArray(amenities) ? amenities : [],
        rateExtra: Number(rateExtra) || 0,
      },
    });
    return NextResponse.json(room, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
