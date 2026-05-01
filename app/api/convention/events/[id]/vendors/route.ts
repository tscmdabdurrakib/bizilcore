import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const event = await prisma.hallEvent.findFirst({ where: { id, shopId: shop.id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { category, vendorName, contactPhone, quotedAmount, note } = body;

  if (!category || !vendorName) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const vendor = await prisma.eventVendor.create({
    data: {
      eventId: id,
      category,
      vendorName,
      contactPhone: contactPhone ?? null,
      quotedAmount: quotedAmount ? Number(quotedAmount) : null,
      note: note ?? null,
    },
  });

  return NextResponse.json(vendor);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { vendorId, ...data } = body;

  if (!vendorId) return NextResponse.json({ error: "Missing vendorId" }, { status: 400 });

  await prisma.eventVendor.update({
    where: { id: vendorId },
    data: {
      ...(data.status !== undefined && { status: data.status }),
      ...(data.paidAmount !== undefined && { paidAmount: Number(data.paidAmount) }),
      ...(data.note !== undefined && { note: data.note }),
    },
  });

  return NextResponse.json({ ok: true });
}
