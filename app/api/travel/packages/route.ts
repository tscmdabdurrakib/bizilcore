import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { shop } = await requireShop();
    const packages = await prisma.tourPackage.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(packages);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const body = await req.json();
    const pkg = await prisma.tourPackage.create({
      data: {
        shopId: shop.id,
        name: body.name,
        destination: body.destination,
        type: body.type,
        duration: body.duration,
        inclusions: body.inclusions ?? [],
        exclusions: body.exclusions ?? [],
        adultPrice: parseFloat(body.adultPrice),
        childPrice: body.childPrice ? parseFloat(body.childPrice) : null,
        infantPrice: body.infantPrice ? parseFloat(body.infantPrice) : null,
        maxPersons: body.maxPersons ? parseInt(body.maxPersons) : null,
        description: body.description ?? null,
        itinerary: body.itinerary ?? null,
        imageUrl: body.imageUrl ?? null,
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json(pkg);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const body = await req.json();
    const { id, ...data } = body;
    const pkg = await prisma.tourPackage.update({
      where: { id, shopId: shop.id },
      data: {
        name: data.name,
        destination: data.destination,
        type: data.type,
        duration: data.duration,
        inclusions: data.inclusions ?? [],
        exclusions: data.exclusions ?? [],
        adultPrice: parseFloat(data.adultPrice),
        childPrice: data.childPrice ? parseFloat(data.childPrice) : null,
        infantPrice: data.infantPrice ? parseFloat(data.infantPrice) : null,
        maxPersons: data.maxPersons ? parseInt(data.maxPersons) : null,
        description: data.description ?? null,
        itinerary: data.itinerary ?? null,
        imageUrl: data.imageUrl ?? null,
        isActive: data.isActive ?? true,
      },
    });
    return NextResponse.json(pkg);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "No id" }, { status: 400 });
    await prisma.tourPackage.update({
      where: { id, shopId: shop.id },
      data: { isActive: false },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
