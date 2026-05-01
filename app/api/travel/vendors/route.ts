import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { shop } = await requireShop();
    const vendors = await prisma.travelVendor.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(vendors);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const body = await req.json();
    const vendor = await prisma.travelVendor.create({
      data: {
        shopId: shop.id,
        name: body.name,
        type: body.type,
        contact: body.contact ?? null,
        accountInfo: body.accountInfo ?? null,
        dueToVendor: parseFloat(body.dueToVendor ?? 0),
        notes: body.notes ?? null,
      },
    });
    return NextResponse.json(vendor);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const body = await req.json();
    const { id, ...data } = body;
    const vendor = await prisma.travelVendor.update({
      where: { id, shopId: shop.id },
      data: {
        name: data.name,
        type: data.type,
        contact: data.contact ?? null,
        accountInfo: data.accountInfo ?? null,
        dueToVendor: parseFloat(data.dueToVendor ?? 0),
        notes: data.notes ?? null,
      },
    });
    return NextResponse.json(vendor);
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
    await prisma.travelVendor.delete({ where: { id, shopId: shop.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
