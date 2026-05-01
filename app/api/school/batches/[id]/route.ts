import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await requireShop();
  const { id } = await params;
  const batch = await prisma.batch.findFirst({
    where: { id, shopId: shop.id },
    include: {
      teacher: { select: { id: true, jobTitle: true, user: { select: { name: true } } } },
      students: {
        where: { status: "active" },
        select: { id: true, name: true, regNumber: true, guardianPhone: true, status: true },
      },
      _count: { select: { students: true } },
    },
  });
  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(batch);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await requireShop();
  const { id } = await params;
  const body = await req.json();
  await prisma.batch.updateMany({
    where: { id, shopId: shop.id },
    data: {
      name: body.name,
      class: body.class ?? null,
      subject: body.subject ?? null,
      schedule: body.schedule ?? null,
      teacherId: body.teacherId ?? null,
      room: body.room ?? null,
      monthlyFee: body.monthlyFee !== undefined ? Number(body.monthlyFee) : undefined,
      admissionFee: body.admissionFee !== undefined ? Number(body.admissionFee) : undefined,
      maxStudents: body.maxStudents ? Number(body.maxStudents) : null,
      isActive: body.isActive ?? undefined,
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await requireShop();
  const { id } = await params;
  await prisma.batch.deleteMany({ where: { id, shopId: shop.id } });
  return NextResponse.json({ ok: true });
}
