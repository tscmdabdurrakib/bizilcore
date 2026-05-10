import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { shop } = await requireShop();
  const { id } = await params;

  const legalCase = await prisma.legalCase.findFirst({
    where: { id, shopId: shop.id },
    include: {
      client: { select: { id: true, name: true, phone: true, address: true } },
      hearings: {
        orderBy: { hearingDate: "desc" },
      },
      documents: {
        orderBy: { addedAt: "desc" },
      },
      payments: {
        orderBy: { paidAt: "desc" },
      },
    },
  });

  if (!legalCase) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ case: legalCase });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { shop } = await requireShop();
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.legalCase.findFirst({
    where: { id, shopId: shop.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.action === "add_hearing") {
    const hearing = await prisma.caseHearing.create({
      data: {
        shopId: shop.id,
        caseId: id,
        hearingDate: new Date(body.hearingDate),
        court: body.court || existing.court,
        judgeRef: body.judgeRef || null,
        purpose: body.purpose || null,
        outcome: body.outcome || null,
        attended: body.attended ?? false,
        nextDate: body.nextDate ? new Date(body.nextDate) : null,
        appearanceFee: parseFloat(body.appearanceFee ?? "0") || 0,
        note: body.note || null,
      },
    });

    if (body.nextDate) {
      await prisma.legalCase.update({
        where: { id },
        data: { nextHearing: new Date(body.nextDate) },
      });
    }

    return NextResponse.json({ hearing });
  }

  if (body.action === "mark_attended") {
    const hearing = await prisma.caseHearing.update({
      where: { id: body.hearingId },
      data: { attended: true },
    });
    return NextResponse.json({ hearing });
  }

  if (body.action === "add_document") {
    const doc = await prisma.caseDocument.create({
      data: {
        shopId: shop.id,
        caseId: id,
        docName: body.docName,
        docType: body.docType,
        fileUrl: body.fileUrl || null,
        submittedAt: body.submittedAt ? new Date(body.submittedAt) : null,
        note: body.note || null,
      },
    });
    return NextResponse.json({ document: doc });
  }

  if (body.action === "add_payment") {
    const amount = parseFloat(body.amount) || 0;

    const payment = await prisma.caseFeePayment.create({
      data: {
        shopId: shop.id,
        caseId: id,
        amount,
        feeType: body.feeType ?? "other",
        method: body.method || null,
        note: body.note || null,
      },
    });

    const newPaid = existing.paidFee + amount;
    const newDue = Math.max(0, existing.totalFee - newPaid);

    await prisma.legalCase.update({
      where: { id },
      data: { paidFee: newPaid, dueFee: newDue },
    });

    return NextResponse.json({ payment });
  }

  const updateData: Record<string, unknown> = {};
  const allowed = [
    "title", "caseType", "court", "caseRef", "filingDate", "opposingParty",
    "opposingLawyer", "assignedTo", "status", "verdict", "verdictDate",
    "notes", "nextHearing",
  ];

  for (const key of allowed) {
    if (key in body) {
      if (["filingDate", "verdictDate", "nextHearing"].includes(key)) {
        updateData[key] = body[key] ? new Date(body[key]) : null;
      } else {
        updateData[key] = body[key] || null;
      }
    }
  }

  const updated = await prisma.legalCase.update({
    where: { id },
    data: updateData,
    include: {
      client: { select: { id: true, name: true, phone: true } },
    },
  });

  return NextResponse.json({ case: updated });
}
