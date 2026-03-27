import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  const { shop } = await requireShop();
  const { customerId } = await params;

  if (shop.businessType !== "tailor") {
    return NextResponse.json({ error: "এই API শুধুমাত্র দর্জি শপের জন্য।" }, { status: 403 });
  }

  const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true, shopId: true, name: true, phone: true } });
  if (!customer || customer.shopId !== shop.id) {
    return NextResponse.json({ error: "কাস্টমার পাওয়া যায়নি।" }, { status: 404 });
  }

  const measurement = await prisma.measurement.findUnique({
    where: { shopId_customerId: { shopId: shop.id, customerId } },
  });

  return NextResponse.json({ customer, measurement: measurement ?? null });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  const { shop } = await requireShop();
  const { customerId } = await params;

  if (shop.businessType !== "tailor") {
    return NextResponse.json({ error: "এই API শুধুমাত্র দর্জি শপের জন্য।" }, { status: 403 });
  }

  const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true, shopId: true } });
  if (!customer || customer.shopId !== shop.id) {
    return NextResponse.json({ error: "কাস্টমার পাওয়া যায়নি।" }, { status: 404 });
  }

  const body = await req.json();
  const { chest, waist, hip, shoulder, sleeve, length, neck, inseam, notes } = body;

  const numField = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : undefined);

  const updated = await prisma.measurement.upsert({
    where: { shopId_customerId: { shopId: shop.id, customerId } },
    create: {
      shopId: shop.id, customerId,
      chest: numField(chest) ?? null, waist: numField(waist) ?? null, hip: numField(hip) ?? null,
      shoulder: numField(shoulder) ?? null, sleeve: numField(sleeve) ?? null, length: numField(length) ?? null,
      neck: numField(neck) ?? null, inseam: numField(inseam) ?? null,
      notes: typeof notes === "string" ? notes.trim() || null : null,
    },
    update: {
      ...(chest !== undefined ? { chest: numField(chest) ?? null } : {}),
      ...(waist !== undefined ? { waist: numField(waist) ?? null } : {}),
      ...(hip !== undefined ? { hip: numField(hip) ?? null } : {}),
      ...(shoulder !== undefined ? { shoulder: numField(shoulder) ?? null } : {}),
      ...(sleeve !== undefined ? { sleeve: numField(sleeve) ?? null } : {}),
      ...(length !== undefined ? { length: numField(length) ?? null } : {}),
      ...(neck !== undefined ? { neck: numField(neck) ?? null } : {}),
      ...(inseam !== undefined ? { inseam: numField(inseam) ?? null } : {}),
      ...(notes !== undefined ? { notes: typeof notes === "string" ? notes.trim() || null : null } : {}),
    },
  });

  return NextResponse.json(updated);
}
