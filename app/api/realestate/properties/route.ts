import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const listingType = searchParams.get("listingType");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const props = await prisma.property.findMany({
    where: {
      shopId: shop.id,
      ...(type && type !== "all" ? { type } : {}),
      ...(listingType && listingType !== "all" ? { listingType } : {}),
      ...(status && status !== "all" ? { status } : {}),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
          { propertyCode: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    include: {
      owner: { select: { id: true, name: true, phone: true } },
      _count: { select: { leads: true, deals: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(props);
}

export async function POST(req: Request) {
  const { shop } = await requireShop();
  const body = await req.json();

  const prefix = shop.propPrefix ?? "PROP";
  const yr = new Date().getFullYear();
  const count = await prisma.property.count({ where: { shopId: shop.id } });
  const propertyCode = `${prefix}-${yr}-${String(count + 1).padStart(3, "0")}`;

  // Handle new owner creation
  let ownerId = body.ownerId ?? null;
  if (!ownerId && body.ownerName && body.ownerPhone) {
    const newOwner = await prisma.propertyOwner.create({
      data: {
        shopId: shop.id,
        name: body.ownerName,
        phone: body.ownerPhone,
        nid: body.ownerNid ?? null,
        address: body.ownerAddress ?? null,
        bankInfo: body.ownerBankInfo ?? null,
      },
    });
    ownerId = newOwner.id;
  }

  const prop = await prisma.property.create({
    data: {
      shopId: shop.id,
      propertyCode,
      title: body.title,
      type: body.type ?? "flat",
      listingType: body.listingType ?? "sale",
      area: Number(body.area ?? 0),
      areaUnit: body.areaUnit ?? "sqft",
      floor: body.floor ? Number(body.floor) : null,
      totalFloors: body.totalFloors ? Number(body.totalFloors) : null,
      bedrooms: body.bedrooms ? Number(body.bedrooms) : null,
      bathrooms: body.bathrooms ? Number(body.bathrooms) : null,
      location: body.location,
      address: body.address ?? null,
      salePrice: body.salePrice ? Number(body.salePrice) : null,
      rentPrice: body.rentPrice ? Number(body.rentPrice) : null,
      negotiable: body.negotiable !== false,
      ownerId,
      amenities: body.amenities ?? [],
      facing: body.facing ?? null,
      readyToMove: body.readyToMove !== false,
      handoverDate: body.handoverDate ? new Date(body.handoverDate) : null,
      images: body.images ?? [],
      description: body.description ?? null,
      status: "available",
    },
    include: { owner: true },
  });

  return NextResponse.json(prop);
}
