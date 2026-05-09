import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const search = searchParams.get("search");

  const pets = await prisma.pet.findMany({
    where: {
      shopId: shop.id,
      ...(type && type !== "all" ? { type } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { customer: { phone: { contains: search } } },
          { customer: { name: { contains: search, mode: "insensitive" } } },
        ],
      } : {}),
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      _count: { select: { appointments: true, healthLogs: true } },
      healthLogs: {
        where: { nextDueDate: { not: null } },
        orderBy: { nextDueDate: "asc" },
        take: 1,
        select: { nextDueDate: true, logType: true },
      },
      appointments: {
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true, type: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(pets);
}

export async function POST(req: Request) {
  const { shop } = await requireShop();
  const body = await req.json();

  // Create or find customer
  let customerId = body.customerId;
  if (!customerId && body.ownerName && body.ownerPhone) {
    let customer = await prisma.customer.findFirst({ where: { shopId: shop.id, phone: body.ownerPhone } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { shopId: shop.id, name: body.ownerName, phone: body.ownerPhone },
      });
    }
    customerId = customer.id;
  }

  const pet = await prisma.pet.create({
    data: {
      shopId: shop.id,
      customerId,
      name: body.name,
      type: body.type ?? "dog",
      breed: body.breed ?? null,
      gender: body.gender ?? null,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      weight: body.weight ? Number(body.weight) : null,
      color: body.color ?? null,
      photoUrl: body.photoUrl ?? null,
      microchipId: body.microchipId ?? null,
      allergies: body.allergies ?? null,
      chronicIllness: body.chronicIllness ?? null,
    },
    include: { customer: { select: { id: true, name: true, phone: true } } },
  });

  if (shop.petAutoSms) {
    const phone = body.ownerPhone ?? (await prisma.customer.findUnique({ where: { id: customerId } }))?.phone;
    console.log(`SMS to ${phone}: ${pet.name} (${pet.type}) রেজিস্ট্রেশন সম্পন্ন হয়েছে। - ${shop.name}`);
  }

  return NextResponse.json(pet);
}
