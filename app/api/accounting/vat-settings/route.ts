import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccountingShop } from "@/lib/accounting/auth";

export async function GET() {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop } = ctx;

  const s = await prisma.shop.findUnique({
    where: { id: shop.id },
    select: { vatEnabled: true, vatRate: true, vatBin: true, vatMethod: true },
  });

  return NextResponse.json({
    vatEnabled: s?.vatEnabled ?? false,
    vatRate: s?.vatRate ?? 15,
    vatBin: s?.vatBin ?? null,
    vatMethod: s?.vatMethod ?? "inclusive",
  });
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop } = ctx;
  const body = await req.json();

  const updated = await prisma.shop.update({
    where: { id: shop.id },
    data: {
      ...(body.vatEnabled !== undefined ? { vatEnabled: !!body.vatEnabled } : {}),
      ...(body.vatRate !== undefined ? { vatRate: parseFloat(body.vatRate) || 15 } : {}),
      ...(body.vatBin !== undefined ? { vatBin: body.vatBin || null } : {}),
      ...(body.vatMethod !== undefined ? { vatMethod: body.vatMethod } : {}),
    },
    select: { vatEnabled: true, vatRate: true, vatBin: true, vatMethod: true },
  });

  return NextResponse.json(updated);
}
