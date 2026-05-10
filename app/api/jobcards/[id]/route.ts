import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;

  const jobCard = await prisma.jobCard.findFirst({
    where: { id, shopId: shop.id },
    include: {
      vehicle: { include: { customer: true } },
      device: { include: { customer: true } },
      parts: { include: { product: { select: { id: true, name: true, stockQty: true } } } },
      services: true,
    },
  });

  if (!jobCard) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(jobCard);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();

  const jobCard = await prisma.jobCard.findFirst({ where: { id, shopId: shop.id } });
  if (!jobCard) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.jobCard.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.diagnosis !== undefined && { diagnosis: body.diagnosis }),
      ...(body.workDescription !== undefined && { workDescription: body.workDescription }),
      ...(body.assignedToId !== undefined && { assignedToId: body.assignedToId }),
      ...(body.estimatedDone !== undefined && { estimatedDone: body.estimatedDone ? new Date(body.estimatedDone) : null }),
      ...(body.estimatedAmt !== undefined && { estimatedAmt: Number(body.estimatedAmt) }),
      ...(body.laborCharge !== undefined && { laborCharge: Number(body.laborCharge) }),
      ...(body.partsTotal !== undefined && { partsTotal: Number(body.partsTotal) }),
      ...(body.totalAmount !== undefined && { totalAmount: Number(body.totalAmount) }),
      ...(body.advancePaid !== undefined && { advancePaid: Number(body.advancePaid) }),
      ...(body.dueAmount !== undefined && { dueAmount: Number(body.dueAmount) }),
      ...(body.mileageOut !== undefined && { mileageOut: body.mileageOut ? Number(body.mileageOut) : null }),
      ...(body.deliveredAt !== undefined && { deliveredAt: body.deliveredAt ? new Date(body.deliveredAt) : null }),
    },
    include: {
      vehicle: { include: { customer: true } },
      device: { include: { customer: true } },
      parts: { include: { product: { select: { id: true, name: true, stockQty: true } } } },
      services: true,
    },
  });

  return NextResponse.json(updated);
}
