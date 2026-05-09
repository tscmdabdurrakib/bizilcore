import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const batchId = searchParams.get("batchId") ?? "";
  const status = searchParams.get("status") ?? "";

  const students = await prisma.student.findMany({
    where: {
      shopId: shop.id,
      ...(status ? { status } : {}),
      ...(batchId ? { batchId } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { nameBangla: { contains: search, mode: "insensitive" } },
          { regNumber: { contains: search, mode: "insensitive" } },
          { guardianPhone: { contains: search } },
          { phone: { contains: search } },
        ],
      } : {}),
    },
    include: {
      batch: { select: { id: true, name: true, monthlyFee: true } },
      fees: {
        where: { month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}` },
        select: { status: true, dueAmount: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();

  // Auto-generate reg number
  const count = await prisma.student.count({ where: { shopId: shop.id } });
  const prefix = shop.schoolRegPrefix ?? "STU";
  const year = new Date().getFullYear();
  const regNumber = `${prefix}-${year}-${String(count + 1).padStart(3, "0")}`;

  const student = await prisma.student.create({
    data: {
      shopId: shop.id,
      regNumber,
      name: body.name,
      nameBangla: body.nameBangla ?? null,
      phone: body.phone ?? null,
      guardianName: body.guardianName,
      guardianPhone: body.guardianPhone,
      guardianRelation: body.guardianRelation ?? null,
      address: body.address ?? null,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      gender: body.gender ?? null,
      bloodGroup: body.bloodGroup ?? null,
      previousSchool: body.previousSchool ?? null,
      admissionDate: body.admissionDate ? new Date(body.admissionDate) : new Date(),
      status: "active",
      batchId: body.batchId ?? null,
      notes: body.notes ?? null,
    },
  });

  // Optionally create admission fee record
  if (body.admissionFee && Number(body.admissionFee) > 0) {
    const net = Number(body.admissionFee);
    await prisma.feeRecord.create({
      data: {
        shopId: shop.id,
        studentId: student.id,
        batchId: body.batchId ?? null,
        feeType: "admission",
        description: "ভর্তি ফি",
        amount: net,
        discount: 0,
        netAmount: net,
        paidAmount: body.admissionPaid ? net : 0,
        dueAmount: body.admissionPaid ? 0 : net,
        status: body.admissionPaid ? "paid" : "due",
        paidDate: body.admissionPaid ? new Date() : null,
        method: body.admissionPaid ? (body.admissionMethod ?? "cash") : null,
      },
    });
  }

  return NextResponse.json(student, { status: 201 });
}
