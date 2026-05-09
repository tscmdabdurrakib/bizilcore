import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const petId = searchParams.get("petId");

  const logs = await prisma.petHealthLog.findMany({
    where: { shopId: shop.id, ...(petId ? { petId } : {}) },
    orderBy: { logDate: "desc" },
    include: { pet: { select: { name: true, type: true } } },
    take: 100,
  });

  return NextResponse.json(logs);
}

export async function POST(req: Request) {
  const { shop } = await requireShop();
  const body = await req.json();

  const log = await prisma.petHealthLog.create({
    data: {
      shopId: shop.id,
      petId: body.petId,
      logType: body.logType ?? "checkup",
      description: body.description,
      medicineName: body.medicineName ?? null,
      dosage: body.dosage ?? null,
      vetName: body.vetName ?? null,
      cost: Number(body.cost ?? 0),
      nextDueDate: body.nextDueDate ? new Date(body.nextDueDate) : null,
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json(log);
}
