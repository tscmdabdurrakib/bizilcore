import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  const cat = await prisma.menuCategory.findFirst({ where: { id, shopId: shop.id } });
  if (!cat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { name?: string; nameEn?: string; icon?: string; sortOrder?: number; isActive?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const updated = await prisma.menuCategory.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.nameEn !== undefined && { nameEn: body.nameEn }),
      ...(body.icon !== undefined && { icon: body.icon }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  const cat = await prisma.menuCategory.findFirst({ where: { id, shopId: shop.id } });
  if (!cat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const itemCount = await prisma.menuItem.count({ where: { menuCategoryId: id, shopId: shop.id } });
  if (itemCount > 0) {
    return NextResponse.json(
      { error: `এই ক্যাটাগরিতে ${itemCount}টি আইটেম আছে। মুছতে হলে আগে আইটেমগুলো সরিয়ে নিন।` },
      { status: 409 }
    );
  }

  await prisma.menuCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
