import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { shop } = await requireShop();
    const { id } = await params;

    const booking = await prisma.photoBooking.findFirst({
      where: { id, shopId: shop.id },
      include: {
        package: true,
        team: true,
        equipment: { include: { equipment: true } },
        payments: { orderBy: { paidAt: "desc" } },
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(booking);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { shop } = await requireShop();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.photoBooking.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.shootingDone !== undefined) {
      updateData.shootingDone = body.shootingDone;
      if (body.shootingDone) updateData.status = "editing";
    }
    if (body.editingDone !== undefined) updateData.editingDone = body.editingDone;
    if (body.driveLink !== undefined) updateData.driveLink = body.driveLink;
    if (body.deliveredAt !== undefined) updateData.deliveredAt = new Date(body.deliveredAt);
    if (body.deliveryDate !== undefined) updateData.deliveryDate = new Date(body.deliveryDate);
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.checklist !== undefined) updateData.checklist = body.checklist;
    if (body.showInPortfolio !== undefined) updateData.showInPortfolio = body.showInPortfolio;
    if (body.venue !== undefined) updateData.venue = body.venue;
    if (body.eventTime !== undefined) updateData.eventTime = body.eventTime;

    if (body.team !== undefined) {
      await prisma.bookingTeamMember.deleteMany({ where: { bookingId: id } });
      if (body.team.length > 0) {
        await prisma.bookingTeamMember.createMany({
          data: body.team.map((t: { staffName: string; role: string }) => ({
            bookingId: id,
            staffName: t.staffName,
            role: t.role,
          })),
        });
      }
    }

    if (body.equipment !== undefined) {
      await prisma.bookingEquipmentItem.deleteMany({ where: { bookingId: id } });
      if (body.equipment.length > 0) {
        await prisma.bookingEquipmentItem.createMany({
          data: body.equipment.map((e: { equipmentId: string; quantity: number }) => ({
            bookingId: id,
            equipmentId: e.equipmentId,
            quantity: e.quantity ?? 1,
          })),
        });
      }
    }

    if (body.driveLink && body.status === "delivered") {
      updateData.status = "delivered";
      updateData.deliveredAt = new Date();
      updateData.dueAmount = 0;
      updateData.advancePaid = existing.totalAmount;
    }

    const booking = await prisma.photoBooking.update({
      where: { id },
      data: updateData,
      include: {
        package: true,
        team: true,
        equipment: { include: { equipment: true } },
        payments: { orderBy: { paidAt: "desc" } },
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json(booking);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { shop } = await requireShop();
    const { id } = await params;

    const existing = await prisma.photoBooking.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.photoBooking.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
