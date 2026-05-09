import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  const pet = await prisma.pet.findFirst({
    where: { id, shopId: shop.id },
    include: {
      customer: { select: { id: true, name: true, phone: true, address: true } },
      healthLogs: { orderBy: { logDate: "desc" } },
      appointments: { orderBy: { date: "desc" } },
    },
  });

  if (!pet) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(pet);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const body = await req.json();

  const pet = await prisma.pet.findFirst({ where: { id, shopId: shop.id } });
  if (!pet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.pet.update({
    where: { id },
    data: {
      name: body.name ?? pet.name,
      breed: body.breed !== undefined ? body.breed : pet.breed,
      weight: body.weight !== undefined ? (body.weight ? Number(body.weight) : null) : pet.weight,
      allergies: body.allergies !== undefined ? body.allergies : pet.allergies,
      chronicIllness: body.chronicIllness !== undefined ? body.chronicIllness : pet.chronicIllness,
      isActive: body.isActive !== undefined ? body.isActive : pet.isActive,
    },
  });

  return NextResponse.json(updated);
}
