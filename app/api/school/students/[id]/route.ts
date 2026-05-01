import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await requireShop();
  const { id } = await params;

  const student = await prisma.student.findFirst({
    where: { id, shopId: shop.id },
    include: {
      batch: true,
      fees: { orderBy: { createdAt: "desc" } },
      attendance: { orderBy: { date: "desc" }, take: 60 },
      examResults: { orderBy: { examDate: "desc" } },
    },
  });

  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(student);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await requireShop();
  const { id } = await params;
  const body = await req.json();

  const student = await prisma.student.updateMany({
    where: { id, shopId: shop.id },
    data: {
      name: body.name,
      nameBangla: body.nameBangla ?? null,
      phone: body.phone ?? null,
      guardianName: body.guardianName,
      guardianPhone: body.guardianPhone,
      guardianRelation: body.guardianRelation ?? null,
      address: body.address ?? null,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      gender: body.gender ?? null,
      bloodGroup: body.bloodGroup ?? null,
      previousSchool: body.previousSchool ?? null,
      batchId: body.batchId ?? null,
      status: body.status ?? undefined,
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json({ updated: student.count });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await requireShop();
  const { id } = await params;
  await prisma.student.deleteMany({ where: { id, shopId: shop.id } });
  return NextResponse.json({ ok: true });
}
