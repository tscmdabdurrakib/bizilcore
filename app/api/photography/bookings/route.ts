import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

async function generateBookingNumber(shopId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.photoBooking.count({
    where: { shopId, bookingNumber: { startsWith: `PHO-${year}-` } },
  });
  return `PHO-${year}-${String(count + 1).padStart(3, "0")}`;
}

export async function GET(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const upcoming = searchParams.get("upcoming");

    const where: Record<string, unknown> = { shopId: shop.id };
    if (status && status !== "all") where.status = status;
    if (upcoming === "true") {
      const now = new Date();
      const soon = new Date();
      soon.setDate(soon.getDate() + 14);
      where.eventDate = { gte: now, lte: soon };
    }

    const bookings = await prisma.photoBooking.findMany({
      where,
      orderBy: { eventDate: "asc" },
      include: {
        package: { select: { name: true, type: true, editingDays: true } },
        team: true,
        equipment: { include: { equipment: { select: { name: true, category: true } } } },
        payments: { orderBy: { paidAt: "desc" } },
        customer: { select: { id: true, name: true, phone: true } },
      },
    });
    return NextResponse.json(bookings);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const body = await req.json();

    const bookingNumber = await generateBookingNumber(shop.id);
    const totalAmount = parseFloat(body.totalAmount);
    const costAmount = parseFloat(body.costAmount ?? 0);
    const advancePaid = parseFloat(body.advancePaid ?? 0);
    const dueAmount = totalAmount - advancePaid;

    const DEFAULT_CHECKLIST = {
      advanceConfirmed: false,
      venueConfirmed: false,
      shotListDiscussed: false,
      equipmentPacked: false,
      teamInformed: false,
      backupCharged: false,
    };

    const booking = await prisma.photoBooking.create({
      data: {
        shopId: shop.id,
        bookingNumber,
        customerId: body.customerId ?? null,
        clientName: body.clientName,
        clientPhone: body.clientPhone,
        packageId: body.packageId ?? null,
        eventType: body.eventType,
        eventDate: new Date(body.eventDate),
        eventTime: body.eventTime ?? null,
        venue: body.venue ?? null,
        duration: body.duration ?? null,
        totalAmount,
        costAmount,
        advancePaid,
        dueAmount,
        status: "confirmed",
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
        notes: body.notes ?? null,
        checklist: DEFAULT_CHECKLIST,
        team: body.team?.length
          ? { create: body.team.map((t: { staffName: string; role: string }) => ({ staffName: t.staffName, role: t.role })) }
          : undefined,
        equipment: body.equipment?.length
          ? { create: body.equipment.map((e: { equipmentId: string; quantity: number }) => ({ equipmentId: e.equipmentId, quantity: e.quantity ?? 1 })) }
          : undefined,
      },
      include: { team: true, equipment: true, payments: true },
    });

    if (advancePaid > 0) {
      await prisma.photoPayment.create({
        data: {
          bookingId: booking.id,
          shopId: shop.id,
          amount: advancePaid,
          method: body.paymentMethod ?? "cash",
          note: "অগ্রিম পেমেন্ট",
        },
      });
    }

    return NextResponse.json(booking);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
