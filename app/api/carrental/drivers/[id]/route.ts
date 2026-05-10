import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { shop } = await requireShop();
  const body = await req.json();

  const driver = await prisma.rentalDriver.findFirst({ where: { id, shopId: shop.id } });
  if (!driver) return NextResponse.json({ error: "ড্রাইভার পাওয়া যায়নি" }, { status: 404 });

  const updated = await prisma.rentalDriver.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.licenseNo !== undefined && { licenseNo: body.licenseNo || null }),
      ...(body.licenseExp !== undefined && { licenseExp: body.licenseExp ? new Date(body.licenseExp) : null }),
      ...(body.salary !== undefined && { salary: body.salary ? Number(body.salary) : null }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { shop } = await requireShop();

  const driver = await prisma.rentalDriver.findFirst({ where: { id, shopId: shop.id } });
  if (!driver) return NextResponse.json({ error: "ড্রাইভার পাওয়া যায়নি" }, { status: 404 });

  await prisma.rentalDriver.update({ where: { id }, data: { status: "terminated" } });
  return NextResponse.json({ success: true });
}
