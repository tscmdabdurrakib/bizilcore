import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  const owners = await prisma.propertyOwner.findMany({
    where: {
      shopId: shop.id,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ],
      } : {}),
    },
    include: {
      _count: { select: { properties: true } },
      properties: { select: { id: true, propertyCode: true, title: true, status: true }, take: 5 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(owners);
}

export async function POST(req: Request) {
  const { shop } = await requireShop();
  const body = await req.json();

  const owner = await prisma.propertyOwner.create({
    data: {
      shopId: shop.id,
      name: body.name,
      phone: body.phone,
      nid: body.nid ?? null,
      address: body.address ?? null,
      bankInfo: body.bankInfo ?? null,
      note: body.note ?? null,
    },
  });

  return NextResponse.json(owner);
}
