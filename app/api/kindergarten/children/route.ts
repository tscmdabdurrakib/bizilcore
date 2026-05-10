import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const section = searchParams.get("section") || "";

  const where: Record<string, unknown> = { shopId: shop.id };
  if (section) where.section = section;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { guardianName: { contains: search, mode: "insensitive" } },
      { guardianPhone: { contains: search, mode: "insensitive" } },
      { regNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  const children = await prisma.student.findMany({
    where,
    include: {
      batch: { select: { id: true, name: true } },
      attendance: {
        where: {
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        select: { status: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(children);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();

  const {
    name, nameBangla, dateOfBirth, gender, section, bloodGroup,
    foodAllergies, medicalNote,
    guardianName, guardianPhone, guardianRelation,
    pickupPerson1, pickupPhone1, pickupPerson2, pickupPhone2,
    address, batchId, monthlyFee, notes,
  } = body;

  if (!name || !guardianName || !guardianPhone) {
    return NextResponse.json({ error: "শিশুর নাম ও অভিভাবকের তথ্য আবশ্যক" }, { status: 400 });
  }

  // Auto reg number: KG-YYYY-NNN
  const count = await prisma.student.count({ where: { shopId: shop.id } });
  const year = new Date().getFullYear();
  const regNumber = `KG-${year}-${String(count + 1).padStart(3, "0")}`;

  const child = await prisma.student.create({
    data: {
      shopId: shop.id,
      regNumber,
      name,
      nameBangla: nameBangla || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: gender || null,
      section: section || null,
      bloodGroup: bloodGroup || null,
      foodAllergies: foodAllergies || null,
      medicalNote: medicalNote || null,
      guardianName,
      guardianPhone,
      guardianRelation: guardianRelation || "Guardian",
      pickupPerson1: pickupPerson1 || null,
      pickupPhone1: pickupPhone1 || null,
      pickupPerson2: pickupPerson2 || null,
      pickupPhone2: pickupPhone2 || null,
      address: address || null,
      batchId: batchId || null,
      notes: notes || null,
      status: "active",
    },
  });

  // If batchId + monthlyFee, create admission fee record
  if (batchId && monthlyFee) {
    const receiptCount = await prisma.feeRecord.count({ where: { shopId: shop.id } });
    await prisma.feeRecord.create({
      data: {
        shopId: shop.id,
        studentId: child.id,
        batchId,
        feeType: "admission",
        description: "ভর্তি ফি",
        amount: Number(monthlyFee),
        discount: 0,
        netAmount: Number(monthlyFee),
        paidAmount: 0,
        dueAmount: Number(monthlyFee),
        status: "due",
        receiptNo: `${shop.schoolReceiptPrefix ?? "REC"}-${String(receiptCount + 1).padStart(4, "0")}`,
      },
    });
  }

  return NextResponse.json(child, { status: 201 });
}
