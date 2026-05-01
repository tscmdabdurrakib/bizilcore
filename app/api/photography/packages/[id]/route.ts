import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { shop } = await requireShop();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.photoPackage.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const pkg = await prisma.photoPackage.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        type: body.type ?? existing.type,
        duration: body.duration ?? existing.duration,
        price: body.price !== undefined ? parseFloat(body.price) : existing.price,
        includes: body.includes ?? existing.includes,
        deliverables: body.deliverables ?? existing.deliverables,
        editingDays: body.editingDays !== undefined ? parseInt(body.editingDays) : existing.editingDays,
        description: body.description !== undefined ? body.description : existing.description,
        isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
      },
    });

    return NextResponse.json(pkg);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { shop } = await requireShop();
    const { id } = await params;

    const existing = await prisma.photoPackage.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.photoPackage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
