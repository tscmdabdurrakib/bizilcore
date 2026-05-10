import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q") ?? "";

  const where: Record<string, unknown> = { shopId: shop.id };

  if (status && status !== "all") {
    where.status = status;
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { court: { contains: q, mode: "insensitive" } },
      { caseRef: { contains: q, mode: "insensitive" } },
      { caseNumber: { contains: q, mode: "insensitive" } },
      { client: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const cases = await prisma.legalCase.findMany({
    where,
    include: {
      client: { select: { id: true, name: true, phone: true } },
      _count: { select: { hearings: true, documents: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ cases });
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();

  const count = await prisma.legalCase.count({ where: { shopId: shop.id } });
  const year = new Date().getFullYear();
  const prefix = (shop as { legalCasePrefix?: string }).legalCasePrefix ?? "CASE";
  const caseNumber = `${prefix}-${year}-${String(count + 1).padStart(3, "0")}`;

  const retainerFee = parseFloat(body.retainerFee ?? "0") || 0;
  const alreadyPaid = parseFloat(body.alreadyPaid ?? "0") || 0;
  const dueFee = retainerFee - alreadyPaid;

  const legalCase = await prisma.legalCase.create({
    data: {
      shopId: shop.id,
      caseNumber,
      clientId: body.clientId,
      title: body.title,
      caseType: body.caseType,
      court: body.court,
      caseRef: body.caseRef || null,
      filingDate: body.filingDate ? new Date(body.filingDate) : null,
      opposingParty: body.opposingParty || null,
      opposingLawyer: body.opposingLawyer || null,
      assignedTo: body.assignedTo || null,
      retainerFee,
      totalFee: retainerFee,
      paidFee: alreadyPaid,
      dueFee: Math.max(0, dueFee),
      notes: body.notes || null,
      status: "active",
    },
    include: {
      client: { select: { id: true, name: true, phone: true } },
    },
  });

  if (alreadyPaid > 0) {
    await prisma.caseFeePayment.create({
      data: {
        shopId: shop.id,
        caseId: legalCase.id,
        amount: alreadyPaid,
        feeType: "retainer",
        note: "প্রাথমিক পেমেন্ট",
      },
    });
  }

  return NextResponse.json({ case: legalCase }, { status: 201 });
}
