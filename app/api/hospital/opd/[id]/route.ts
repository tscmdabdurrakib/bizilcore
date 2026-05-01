import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await requireShop();
  const { id } = await params;

  const visit = await prisma.oPDVisit.findFirst({
    where: { id, shopId: shop.id },
    include: {
      patient: true,
      doctor: true,
      tests: true,
    },
  });

  if (!visit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(visit);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shop = await requireShop();
  const { id } = await params;
  const body = await req.json();

  const visit = await prisma.oPDVisit.updateMany({
    where: { id, shopId: shop.id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.diagnosis !== undefined && { diagnosis: body.diagnosis }),
      ...(body.prescription !== undefined && { prescription: body.prescription }),
      ...(body.advice !== undefined && { advice: body.advice }),
      ...(body.nextVisitDate !== undefined && { nextVisitDate: body.nextVisitDate ? new Date(body.nextVisitDate) : null }),
      ...(body.paidAmount !== undefined && { paidAmount: Number(body.paidAmount), dueAmount: (body.visitFee ?? 0) - Number(body.paidAmount) }),
      ...(body.vitalSigns !== undefined && { vitalSigns: body.vitalSigns }),
    },
  });

  if (body.tests && Array.isArray(body.tests) && body.tests.length > 0) {
    await prisma.oPDTestRequest.createMany({
      data: body.tests.map((t: { testName: string; note?: string }) => ({
        shopId: shop.id,
        visitId: id,
        testName: t.testName,
        note: t.note ?? null,
      })),
    });
  }

  return NextResponse.json({ updated: visit.count });
}
