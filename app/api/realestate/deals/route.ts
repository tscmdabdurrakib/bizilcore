import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const deals = await prisma.deal.findMany({
    where: {
      shopId: shop.id,
      ...(status && status !== "all" ? { status } : {}),
    },
    include: {
      property: { select: { id: true, propertyCode: true, title: true, type: true, location: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(deals);
}

export async function POST(req: Request) {
  const { shop } = await requireShop();
  const body = await req.json();

  const prefix = shop.dealPrefix ?? "DEAL";
  const yr = new Date().getFullYear();
  const count = await prisma.deal.count({ where: { shopId: shop.id } });
  const dealNumber = `${prefix}-${yr}-${String(count + 1).padStart(3, "0")}`;

  const agreedAmount = Number(body.agreedAmount ?? 0);
  const commissionRate = Number(body.commissionRate ?? shop.defaultSaleCommission ?? 2);
  const commissionAmount = (agreedAmount * commissionRate) / 100;

  const deal = await prisma.deal.create({
    data: {
      shopId: shop.id,
      dealNumber,
      propertyId: body.propertyId,
      clientName: body.clientName,
      clientPhone: body.clientPhone,
      dealType: body.dealType ?? "sale",
      agreedAmount,
      commissionRate,
      commissionAmount,
      advanceReceived: Number(body.advanceReceived ?? 0),
      status: "in_progress",
      documents: body.documents ?? [],
      notes: body.notes ?? null,
    },
    include: { property: { select: { id: true, propertyCode: true, title: true, location: true } } },
  });

  // Mark property as under_negotiation
  await prisma.property.update({
    where: { id: body.propertyId },
    data: { status: "under_negotiation" },
  }).catch(() => {});

  return NextResponse.json(deal);
}
