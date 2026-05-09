import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const body = await req.json();

  const deal = await prisma.deal.findFirst({ where: { id, shopId: shop.id } });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Handle completion
  if (body.action === "complete") {
    const updated = await prisma.deal.update({
      where: { id },
      data: {
        status: "completed",
        completionDate: new Date(),
        documents: body.documents ?? deal.documents,
        notes: body.notes !== undefined ? body.notes : deal.notes,
      },
    });

    // Update property status
    const propStatus = deal.dealType === "rent" ? "rented" : "sold";
    await prisma.property.update({ where: { id: deal.propertyId }, data: { status: propStatus } }).catch(() => {});

    // Add commission to hisab
    if (deal.commissionAmount > 0) {
      await prisma.transaction.create({
        data: {
          shopId: shop.id,
          type: "income",
          amount: deal.commissionAmount,
          category: "commission",
          note: `Commission — Deal ${deal.dealNumber}`,
        },
      }).catch(() => {});
    }

    return NextResponse.json(updated);
  }

  const updated = await prisma.deal.update({
    where: { id },
    data: {
      status: body.status ?? deal.status,
      advanceReceived: body.advanceReceived !== undefined ? Number(body.advanceReceived) : deal.advanceReceived,
      documents: body.documents ?? deal.documents,
      notes: body.notes !== undefined ? body.notes : deal.notes,
    },
  });

  return NextResponse.json(updated);
}
