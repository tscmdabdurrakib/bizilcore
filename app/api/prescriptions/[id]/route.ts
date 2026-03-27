import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  const prescription = await prisma.prescription.findUnique({
    where: { id },
    include: {
      items: { include: { medicine: { select: { id: true, brandName: true } } } },
    },
  });

  if (!prescription || prescription.shopId !== shop.id) {
    return NextResponse.json({ error: "পাওয়া যায়নি।" }, { status: 404 });
  }

  return NextResponse.json(prescription);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  const prescription = await prisma.prescription.findUnique({ where: { id } });
  if (!prescription || prescription.shopId !== shop.id) {
    return NextResponse.json({ error: "পাওয়া যায়নি।" }, { status: 404 });
  }

  const body = await req.json();
  const { patientName, patientPhone, doctorName, photoUrl, note } = body;

  const updated = await prisma.prescription.update({
    where: { id },
    data: {
      ...(patientName !== undefined && { patientName }),
      ...(patientPhone !== undefined && { patientPhone }),
      ...(doctorName !== undefined && { doctorName }),
      ...(photoUrl !== undefined && { photoUrl }),
      ...(note !== undefined && { note }),
    },
    include: {
      items: { include: { medicine: { select: { id: true, brandName: true } } } },
    },
  });

  return NextResponse.json(updated);
}
