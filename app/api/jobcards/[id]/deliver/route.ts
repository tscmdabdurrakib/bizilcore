import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();
  const { mileageOut, finalPayment } = body;

  const jobCard = await prisma.jobCard.findFirst({ where: { id, shopId: shop.id } });
  if (!jobCard) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const extra = Number(finalPayment || 0);
  const newAdvance = jobCard.advancePaid + extra;
  const newDue = Math.max(0, jobCard.totalAmount - newAdvance);

  const updated = await prisma.jobCard.update({
    where: { id },
    data: {
      status: "delivered",
      deliveredAt: new Date(),
      mileageOut: mileageOut ? Number(mileageOut) : null,
      advancePaid: newAdvance,
      dueAmount: newDue,
    },
    include: {
      vehicle: { include: { customer: true } },
      parts: true,
      services: true,
    },
  });

  if (mileageOut) {
    await prisma.vehicle.update({
      where: { id: jobCard.vehicleId },
      data: { lastMileage: Number(mileageOut) },
    });
  }

  return NextResponse.json(updated);
}
