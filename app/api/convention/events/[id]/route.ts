import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const event = await prisma.hallEvent.findFirst({
    where: { id, shopId: shop.id },
    include: {
      hall: true,
      package: true,
      vendors: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { paidAt: "desc" } },
    },
  });

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(event);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();

  const updateData: Record<string, unknown> = {};
  const fields = [
    "clientName", "clientPhone", "clientAddress", "eventType",
    "startTime", "endTime", "setupTime", "guestCount",
    "totalAmount", "dueAmount", "advancePaid", "status",
    "internalNotes", "checklist", "customItems",
  ];
  for (const f of fields) {
    if (body[f] !== undefined) updateData[f] = body[f];
  }
  if (body.eventDate !== undefined) updateData.eventDate = new Date(body.eventDate);

  await prisma.hallEvent.updateMany({
    where: { id, shopId: shop.id },
    data: updateData,
  });

  return NextResponse.json({ ok: true });
}
