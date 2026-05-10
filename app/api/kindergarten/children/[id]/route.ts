import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { shop } = await requireShop();

  const child = await prisma.student.findFirst({
    where: { id, shopId: shop.id },
    include: {
      batch: true,
      fees: { orderBy: { createdAt: "desc" } },
      attendance: { orderBy: { date: "desc" }, take: 60 },
      mealRecords: { orderBy: { date: "desc" }, take: 30 },
      dailyReports: { orderBy: { reportDate: "desc" }, take: 30 },
    },
  });

  if (!child) return NextResponse.json({ error: "শিশু পাওয়া যায়নি" }, { status: 404 });
  return NextResponse.json(child);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { shop } = await requireShop();
  const body = await req.json();

  const child = await prisma.student.findFirst({ where: { id, shopId: shop.id } });
  if (!child) return NextResponse.json({ error: "শিশু পাওয়া যায়নি" }, { status: 404 });

  const updated = await prisma.student.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.section !== undefined && { section: body.section }),
      ...(body.foodAllergies !== undefined && { foodAllergies: body.foodAllergies || null }),
      ...(body.medicalNote !== undefined && { medicalNote: body.medicalNote || null }),
      ...(body.pickupPerson1 !== undefined && { pickupPerson1: body.pickupPerson1 || null }),
      ...(body.pickupPhone1 !== undefined && { pickupPhone1: body.pickupPhone1 || null }),
      ...(body.pickupPerson2 !== undefined && { pickupPerson2: body.pickupPerson2 || null }),
      ...(body.pickupPhone2 !== undefined && { pickupPhone2: body.pickupPhone2 || null }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.batchId !== undefined && { batchId: body.batchId || null }),
      ...(body.notes !== undefined && { notes: body.notes || null }),
      ...(body.guardianName !== undefined && { guardianName: body.guardianName }),
      ...(body.guardianPhone !== undefined && { guardianPhone: body.guardianPhone }),
    },
  });

  return NextResponse.json(updated);
}
