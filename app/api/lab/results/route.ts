import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  if (shop.businessType !== "lab") return NextResponse.json({ error: "Access Denied" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("orderNumber");

  if (orderNumber) {
    const order = await prisma.testOrder.findFirst({
      where: { orderNumber, shopId: shop.id },
      include: {
        patient: { select: { id: true, name: true, phone: true, address: true } },
        items: { include: { test: true } },
        results: { include: { test: { select: { id: true, name: true, banglaName: true, unit: true, normalRangeMale: true, normalRangeFemale: true, category: true } } } },
      },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(order);
  }

  const orders = await prisma.testOrder.findMany({
    where: {
      shopId: shop.id,
      status: { in: ["sample_collected", "processing"] },
    },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      items: { include: { test: { select: { id: true, name: true, shortCode: true } } } },
    },
    orderBy: [{ urgency: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  if (shop.businessType !== "lab") return NextResponse.json({ error: "Access Denied" }, { status: 403 });

  const body = await req.json();
  const { testOrderId, results } = body;

  if (!testOrderId || !Array.isArray(results)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.testResult.deleteMany({ where: { testOrderId } });

    await tx.testResult.createMany({
      data: results.map((r: {
        testId: string; value: string; unit?: string; normalRange?: string; flag?: string; note?: string;
      }) => ({
        shopId: shop.id,
        testOrderId,
        testId: r.testId,
        value: r.value,
        unit: r.unit || null,
        normalRange: r.normalRange || null,
        flag: r.flag || null,
        note: r.note || null,
      })),
    });

    await tx.testOrderItem.updateMany({
      where: { testOrderId },
      data: { resultEntered: true },
    });

    await tx.testOrder.update({
      where: { id: testOrderId },
      data: { status: "ready" },
    });
  });

  const order = await prisma.testOrder.findUnique({
    where: { id: testOrderId },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      items: { include: { test: { select: { id: true, name: true, shortCode: true } } } },
      results: true,
    },
  });

  return NextResponse.json(order);
}
