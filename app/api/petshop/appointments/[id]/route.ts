import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const body = await req.json();

  const appt = await prisma.petAppointment.findFirst({ where: { id, shopId: shop.id } });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.petAppointment.update({
    where: { id },
    data: {
      status: body.status ?? appt.status,
      paidAmount: body.paidAmount !== undefined ? Number(body.paidAmount) : appt.paidAmount,
      note: body.note !== undefined ? body.note : appt.note,
    },
  });

  return NextResponse.json(updated);
}
