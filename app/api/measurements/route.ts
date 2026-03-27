import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();

  if (shop.businessType !== "tailor") {
    return NextResponse.json({ error: "এই API শুধুমাত্র দর্জি শপের জন্য।" }, { status: 403 });
  }

  const customers = await prisma.customer.findMany({
    where: { shopId: shop.id },
    select: {
      id: true,
      name: true,
      phone: true,
      measurements: {
        where: { shopId: shop.id },
        select: {
          id: true, chest: true, waist: true, hip: true, shoulder: true,
          sleeve: true, length: true, neck: true, inseam: true,
          notes: true, updatedAt: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();

  if (shop.businessType !== "tailor") {
    return NextResponse.json({ error: "এই API শুধুমাত্র দর্জি শপের জন্য।" }, { status: 403 });
  }

  const body = await req.json();
  const { customerId, chest, waist, hip, shoulder, sleeve, length, neck, inseam, notes } = body;

  if (!customerId || typeof customerId !== "string") {
    return NextResponse.json({ error: "কাস্টমার ID আবশ্যিক।" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true, shopId: true } });
  if (!customer || customer.shopId !== shop.id) {
    return NextResponse.json({ error: "কাস্টমার পাওয়া যায়নি।" }, { status: 404 });
  }

  const numField = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null);

  const measurement = await prisma.measurement.upsert({
    where: { shopId_customerId: { shopId: shop.id, customerId } },
    create: {
      shopId: shop.id, customerId,
      chest: numField(chest), waist: numField(waist), hip: numField(hip),
      shoulder: numField(shoulder), sleeve: numField(sleeve), length: numField(length),
      neck: numField(neck), inseam: numField(inseam),
      notes: typeof notes === "string" ? notes.trim() || null : null,
    },
    update: {
      chest: numField(chest), waist: numField(waist), hip: numField(hip),
      shoulder: numField(shoulder), sleeve: numField(sleeve), length: numField(length),
      neck: numField(neck), inseam: numField(inseam),
      notes: typeof notes === "string" ? notes.trim() || null : null,
    },
  });

  return NextResponse.json(measurement, { status: 201 });
}
