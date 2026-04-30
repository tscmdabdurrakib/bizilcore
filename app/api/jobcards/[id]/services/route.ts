import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();
  const { serviceName, laborCost, mechanicId } = body;

  if (!serviceName || laborCost === undefined) {
    return NextResponse.json({ error: "সার্ভিসের তথ্য অসম্পূর্ণ" }, { status: 400 });
  }

  const jobCard = await prisma.jobCard.findFirst({ where: { id, shopId: shop.id } });
  if (!jobCard) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const service = await prisma.jobCardService.create({
    data: {
      jobCardId: id,
      serviceName,
      laborCost: Number(laborCost),
      mechanicId: mechanicId || null,
    },
  });

  const allServices = await prisma.jobCardService.findMany({ where: { jobCardId: id } });
  const laborCharge = allServices.reduce((sum, s) => sum + s.laborCost, 0);
  const newTotal = laborCharge + jobCard.partsTotal;
  const newDue = Math.max(0, newTotal - jobCard.advancePaid);
  await prisma.jobCard.update({ where: { id }, data: { laborCharge, totalAmount: newTotal, dueAmount: newDue } });

  return NextResponse.json(service, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId");
  if (!serviceId) return NextResponse.json({ error: "serviceId required" }, { status: 400 });

  const jobCard = await prisma.jobCard.findFirst({ where: { id, shopId: shop.id } });
  if (!jobCard) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.jobCardService.deleteMany({ where: { id: serviceId, jobCardId: id } });

  const allServices = await prisma.jobCardService.findMany({ where: { jobCardId: id } });
  const laborCharge = allServices.reduce((sum, s) => sum + s.laborCost, 0);
  const newTotal = laborCharge + jobCard.partsTotal;
  const newDue = Math.max(0, newTotal - jobCard.advancePaid);
  await prisma.jobCard.update({ where: { id }, data: { laborCharge, totalAmount: newTotal, dueAmount: newDue } });

  return NextResponse.json({ success: true });
}
