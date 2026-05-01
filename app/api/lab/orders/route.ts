import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  if (shop.businessType !== "lab") return NextResponse.json({ error: "Access Denied" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const date = searchParams.get("date");
  const urgency = searchParams.get("urgency");

  const where: Record<string, unknown> = { shopId: shop.id };
  if (status) where.status = status;
  if (urgency) where.urgency = urgency;
  if (date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    where.createdAt = { gte: d, lt: next };
  }

  const orders = await prisma.testOrder.findMany({
    where,
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      items: { include: { test: { select: { id: true, name: true, shortCode: true } } } },
    },
    orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  if (shop.businessType !== "lab") return NextResponse.json({ error: "Access Denied" }, { status: 403 });

  const body = await req.json();
  const {
    patientData, refDoctorName, refDoctorPhone,
    collectionType, homeAddress, homeTime, urgency,
    items, totalAmount, discountAmount, netAmount, paidAmount, paymentMethod,
  } = body;

  if (!patientData || !items?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let patientId: string;
  if (patientData.id) {
    patientId = patientData.id;
  } else {
    const patient = await prisma.customer.create({
      data: {
        shopId: shop.id,
        name: patientData.name,
        phone: patientData.phone || null,
        address: patientData.address || null,
        group: "regular",
      },
    });
    patientId = patient.id;
  }

  const today = new Date();
  const year = today.getFullYear();
  const prefix = shop.labOrderPrefix ?? "LAB";
  const count = await prisma.testOrder.count({ where: { shopId: shop.id } });
  const orderNumber = `${prefix}-${year}-${String(count + 1).padStart(3, "0")}`;

  const dueAmount = parseFloat(netAmount) - parseFloat(paidAmount || 0);

  const order = await prisma.testOrder.create({
    data: {
      shopId: shop.id,
      orderNumber,
      patientId,
      refDoctorName: refDoctorName || null,
      refDoctorPhone: refDoctorPhone || null,
      collectionType: collectionType || "lab",
      homeAddress: homeAddress || null,
      homeTime: homeTime ? new Date(homeTime) : null,
      urgency: urgency || "normal",
      totalAmount: parseFloat(totalAmount),
      discountAmount: parseFloat(discountAmount || 0),
      netAmount: parseFloat(netAmount),
      paidAmount: parseFloat(paidAmount || 0),
      dueAmount,
      paymentMethod: paymentMethod || null,
      items: {
        create: items.map((item: { testId: string; price: number }) => ({
          testId: item.testId,
          price: parseFloat(String(item.price)),
        })),
      },
    },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      items: { include: { test: { select: { id: true, name: true, shortCode: true } } } },
    },
  });

  return NextResponse.json(order);
}
