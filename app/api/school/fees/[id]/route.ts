import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.feeRecord.findFirst({ where: { id, shopId: shop.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const paid = Math.min(Number(body.paidAmount), existing.netAmount);
  const due = Math.max(0, existing.netAmount - paid);
  const status = due === 0 ? "paid" : paid > 0 ? "partial" : "due";

  const updated = await prisma.feeRecord.update({
    where: { id },
    data: {
      paidAmount: paid,
      dueAmount: due,
      status,
      paidDate: paid > 0 ? new Date() : null,
      method: body.method ?? null,
      note: body.note ?? null,
    },
  });
  return NextResponse.json(updated);
}
