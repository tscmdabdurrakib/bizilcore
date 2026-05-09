import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const search = searchParams.get("search");

  const leads = await prisma.propertyLead.findMany({
    where: {
      shopId: shop.id,
      ...(stage && stage !== "all" ? { stage } : {}),
      ...(search ? {
        OR: [
          { clientName: { contains: search, mode: "insensitive" } },
          { clientPhone: { contains: search } },
        ],
      } : {}),
    },
    include: {
      property: { select: { id: true, propertyCode: true, title: true, type: true, location: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(leads);
}

export async function POST(req: Request) {
  const { shop } = await requireShop();
  const body = await req.json();

  const lead = await prisma.propertyLead.create({
    data: {
      shopId: shop.id,
      propertyId: body.propertyId ?? null,
      clientName: body.clientName,
      clientPhone: body.clientPhone,
      requirement: body.requirement ?? null,
      budget: body.budget ? Number(body.budget) : null,
      preferredArea: body.preferredArea ?? null,
      leadSource: body.leadSource ?? "phone",
      stage: "new",
      interestedIn: body.interestedIn ?? null,
      followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
      notes: body.notes ?? null,
    },
    include: { property: { select: { id: true, propertyCode: true, title: true } } },
  });

  return NextResponse.json(lead);
}
