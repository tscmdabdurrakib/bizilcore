import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const body = await req.json();

  const lead = await prisma.propertyLead.findFirst({ where: { id, shopId: shop.id } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.propertyLead.update({
    where: { id },
    data: {
      stage: body.stage ?? lead.stage,
      notes: body.notes !== undefined ? body.notes : lead.notes,
      followUpDate: body.followUpDate !== undefined
        ? (body.followUpDate ? new Date(body.followUpDate) : null)
        : lead.followUpDate,
      propertyId: body.propertyId !== undefined ? body.propertyId : lead.propertyId,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const lead = await prisma.propertyLead.findFirst({ where: { id, shopId: shop.id } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.propertyLead.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
