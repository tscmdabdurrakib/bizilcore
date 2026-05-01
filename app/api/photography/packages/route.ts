import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { shop } = await requireShop();
    const packages = await prisma.photoPackage.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { bookings: true } } },
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

    const pkg = await prisma.photoPackage.create({
      data: {
        shopId: shop.id,
        name: body.name,
        type: body.type,
        duration: body.duration,
        price: parseFloat(body.price),
        includes: body.includes ?? [],
        deliverables: body.deliverables ?? [],
        editingDays: parseInt(body.editingDays ?? 7),
        description: body.description ?? null,
        isActive: true,
      },
    });

    return NextResponse.json(pkg);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
  }
}
