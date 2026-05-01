import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  if (shop.businessType !== "lab") return NextResponse.json({ error: "Access Denied" }, { status: 403 });

  const { id } = await params;
  const order = await prisma.testOrder.findFirst({
    where: { id, shopId: shop.id },
    include: {
      patient: { select: { id: true, name: true, phone: true, address: true } },
      items: { include: { test: true } },
      results: { include: { test: { select: { id: true, name: true, unit: true, normalRangeMale: true, normalRangeFemale: true } } } },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  if (shop.businessType !== "lab") return NextResponse.json({ error: "Access Denied" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { action, ...data } = body;

  let updateData: Record<string, unknown> = {};

  if (action === "collect_sample") {
    updateData = { sampleCollected: true, sampleCollectedAt: new Date(), status: "sample_collected" };
  } else if (action === "mark_ready") {
    updateData = { status: "ready" };
  } else if (action === "mark_delivered") {
    updateData = { status: "delivered" };
  } else if (action === "update_payment") {
    updateData = { paidAmount: parseFloat(data.paidAmount), dueAmount: parseFloat(data.dueAmount), paymentMethod: data.paymentMethod };
  } else {
    updateData = data;
  }

  const order = await prisma.testOrder.update({
    where: { id },
    data: updateData,
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      items: { include: { test: { select: { id: true, name: true, shortCode: true } } } },
    },
  });
  return NextResponse.json(order);
}
