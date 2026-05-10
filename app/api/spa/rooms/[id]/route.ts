import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { shop } = await requireShop();
    const { id } = await params;
    const body = await req.json();
    const { name, type, capacity, amenities, rateExtra, isActive } = body;

    const existing = await prisma.treatmentRoom.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const room = await prisma.treatmentRoom.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(type !== undefined && { type }),
        ...(capacity !== undefined && { capacity: Number(capacity) }),
        ...(amenities !== undefined && { amenities }),
        ...(rateExtra !== undefined && { rateExtra: Number(rateExtra) }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    return NextResponse.json(room);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { shop } = await requireShop();
    const { id } = await params;
    const existing = await prisma.treatmentRoom.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const activeAppts = await prisma.appointment.count({
      where: { roomId: id, status: { in: ["scheduled", "confirmed", "in_progress"] } },
    });
    if (activeAppts > 0) {
      return NextResponse.json({ error: "এই রুমে সক্রিয় বুকিং আছে, মুছতে পারবেন না।" }, { status: 400 });
    }

    await prisma.treatmentRoom.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
