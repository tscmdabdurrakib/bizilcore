import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const shop = await requireShop();
  const batches = await prisma.batch.findMany({
    where: { shopId: shop.id },
    include: {
      teacher: { select: { id: true, jobTitle: true, user: { select: { name: true } } } },
      _count: { select: { students: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(batches);
}

export async function POST(req: NextRequest) {
  const shop = await requireShop();
  const body = await req.json();
  const batch = await prisma.batch.create({
    data: {
      shopId: shop.id,
      name: body.name,
      class: body.class ?? null,
      subject: body.subject ?? null,
      schedule: body.schedule ?? null,
      teacherId: body.teacherId ?? null,
      room: body.room ?? null,
      monthlyFee: Number(body.monthlyFee),
      admissionFee: Number(body.admissionFee ?? 0),
      maxStudents: body.maxStudents ? Number(body.maxStudents) : null,
      isActive: true,
    },
  });
  return NextResponse.json(batch, { status: 201 });
}
