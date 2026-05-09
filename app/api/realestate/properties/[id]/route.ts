import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  const prop = await prisma.property.findFirst({
    where: { id, shopId: shop.id },
    include: {
      owner: true,
      leads: { orderBy: { createdAt: "desc" }, take: 10 },
      deals: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!prop) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(prop);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const body = await req.json();

  const prop = await prisma.property.findFirst({ where: { id, shopId: shop.id } });
  if (!prop) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.property.update({
    where: { id },
    data: {
      title: body.title ?? prop.title,
      status: body.status ?? prop.status,
      salePrice: body.salePrice !== undefined ? (body.salePrice ? Number(body.salePrice) : null) : prop.salePrice,
      rentPrice: body.rentPrice !== undefined ? (body.rentPrice ? Number(body.rentPrice) : null) : prop.rentPrice,
      negotiable: body.negotiable !== undefined ? body.negotiable : prop.negotiable,
      amenities: body.amenities ?? prop.amenities,
      description: body.description !== undefined ? body.description : prop.description,
      images: body.images ?? prop.images,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  const prop = await prisma.property.findFirst({ where: { id, shopId: shop.id } });
  if (!prop) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.property.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
