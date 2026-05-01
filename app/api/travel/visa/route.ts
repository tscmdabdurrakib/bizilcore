import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

async function generateVisaNumber(shopId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.visaRequest.count({
    where: { shopId, visaNumber: { startsWith: `VISA-${year}-` } },
  });
  return `VISA-${year}-${String(count + 1).padStart(3, "0")}`;
}

export async function GET(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { shopId: shop.id };
    if (status && status !== "all") where.status = status;

    const visas = await prisma.visaRequest.findMany({
      where,
      orderBy: { applicationDate: "desc" },
    });
    return NextResponse.json(visas);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const body = await req.json();
    const visaNumber = await generateVisaNumber(shop.id);

    const visa = await prisma.visaRequest.create({
      data: {
        shopId: shop.id,
        visaNumber,
        bookingId: body.bookingId ?? null,
        customerId: body.customerId ?? null,
        applicantName: body.applicantName,
        applicantPhone: body.applicantPhone,
        passportNumber: body.passportNumber,
        passportExpiry: new Date(body.passportExpiry),
        country: body.country,
        visaType: body.visaType,
        serviceCharge: parseFloat(body.serviceCharge),
        paidAmount: parseFloat(body.paidAmount ?? 0),
        documents: body.documents ?? [],
        notes: body.notes ?? null,
        status: "collecting_docs",
      },
    });
    return NextResponse.json(visa);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const body = await req.json();
    const { id, ...data } = body;

    const updateData: Record<string, unknown> = {};
    if (data.status) updateData.status = data.status;
    if (data.documents) updateData.documents = data.documents;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.paidAmount !== undefined) updateData.paidAmount = parseFloat(data.paidAmount);
    if (data.submittedDate) updateData.submittedDate = new Date(data.submittedDate);
    if (data.expectedDate) updateData.expectedDate = new Date(data.expectedDate);
    if (data.approvedDate) updateData.approvedDate = new Date(data.approvedDate);
    if (data.rejectedDate) updateData.rejectedDate = new Date(data.rejectedDate);

    const visa = await prisma.visaRequest.update({
      where: { id, shopId: shop.id },
      data: updateData,
    });
    return NextResponse.json(visa);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
