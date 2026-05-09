import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const batchId = searchParams.get("batchId") ?? "";
  const status = searchParams.get("status") ?? "";

  const fees = await prisma.feeRecord.findMany({
    where: {
      shopId: shop.id,
      month,
      ...(batchId ? { batchId } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      student: { select: { id: true, name: true, regNumber: true } },
      batch: { select: { id: true, name: true } },
    },
    orderBy: [{ status: "asc" }, { student: { name: "asc" } }],
  });

  const summary = await prisma.feeRecord.groupBy({
    by: ["status"],
    where: { shopId: shop.id, month },
    _count: { status: true },
    _sum: { netAmount: true, paidAmount: true, dueAmount: true },
  });

  return NextResponse.json({ fees, summary });
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();

  // bulk create monthly fees for all active students in a batch (or all batches)
  if (body.action === "bulk_monthly") {
    const month: string = body.month;
    const whereClause = body.batchId ? { shopId: shop.id, batchId: body.batchId, status: "active" } : { shopId: shop.id, status: "active" };
    const students = await prisma.student.findMany({
      where: whereClause,
      include: { batch: true },
    });

    const prefix = shop.schoolReceiptPrefix ?? "REC";
    let created = 0;
    for (const student of students) {
      if (!student.batchId || !student.batch) continue;
      const existing = await prisma.feeRecord.findFirst({ where: { shopId: shop.id, studentId: student.id, month, feeType: "monthly" } });
      if (existing) continue;
      const net = student.batch.monthlyFee;
      const recCount = await prisma.feeRecord.count({ where: { shopId: shop.id } });
      await prisma.feeRecord.create({
        data: {
          shopId: shop.id,
          studentId: student.id,
          batchId: student.batchId,
          feeType: "monthly",
          month,
          description: `মাসিক ফি - ${month}`,
          amount: net,
          discount: 0,
          netAmount: net,
          paidAmount: 0,
          dueAmount: net,
          status: "due",
          receiptNo: `${prefix}-${String(recCount + 1).padStart(4, "0")}`,
        },
      });
      created++;
    }
    return NextResponse.json({ created });
  }

  // Single fee record creation
  const net = Number(body.amount) - Number(body.discount ?? 0);
  const recCount = await prisma.feeRecord.count({ where: { shopId: shop.id } });
  const prefix = shop.schoolReceiptPrefix ?? "REC";
  const fee = await prisma.feeRecord.create({
    data: {
      shopId: shop.id,
      studentId: body.studentId,
      batchId: body.batchId ?? null,
      feeType: body.feeType ?? "monthly",
      month: body.month ?? null,
      description: body.description ?? null,
      amount: Number(body.amount),
      discount: Number(body.discount ?? 0),
      netAmount: net,
      paidAmount: 0,
      dueAmount: net,
      status: "due",
      receiptNo: `${prefix}-${String(recCount + 1).padStart(4, "0")}`,
    },
  });
  return NextResponse.json(fee, { status: 201 });
}
