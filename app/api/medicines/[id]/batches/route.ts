import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  const med = await prisma.medicine.findUnique({ where: { id } });
  if (!med || med.shopId !== shop.id) {
    return NextResponse.json({ error: "পাওয়া যায়নি।" }, { status: 404 });
  }

  const batches = await prisma.medicineBatch.findMany({
    where: { medicineId: id },
    orderBy: { expiryDate: "asc" },
  });

  return NextResponse.json(batches);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  const med = await prisma.medicine.findUnique({ where: { id } });
  if (!med || med.shopId !== shop.id) {
    return NextResponse.json({ error: "পাওয়া যায়নি।" }, { status: 404 });
  }

  const body = await req.json();
  const { batchNumber, expiryDate, quantity, buyPrice } = body;

  if (!batchNumber || typeof batchNumber !== "string" || !batchNumber.trim()) {
    return NextResponse.json({ error: "ব্যাচ নম্বর আবশ্যক।" }, { status: 400 });
  }
  if (!expiryDate) {
    return NextResponse.json({ error: "মেয়াদ শেষের তারিখ আবশ্যক।" }, { status: 400 });
  }
  const parsedExpiry = new Date(expiryDate);
  if (isNaN(parsedExpiry.getTime())) {
    return NextResponse.json({ error: "অবৈধ তারিখ।" }, { status: 400 });
  }
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty <= 0) {
    return NextResponse.json({ error: "পরিমাণ অবশ্যই ধনাত্মক পূর্ণসংখ্যা হতে হবে।" }, { status: 400 });
  }
  if (buyPrice !== undefined && buyPrice !== null && (typeof buyPrice !== "number" || buyPrice < 0)) {
    return NextResponse.json({ error: "ক্রয় মূল্য শূন্য বা ধনাত্মক হতে হবে।" }, { status: 400 });
  }

  const batch = await prisma.medicineBatch.create({
    data: {
      medicineId: id,
      batchNumber: batchNumber.trim(),
      expiryDate: parsedExpiry,
      quantity: qty,
      buyPrice: buyPrice != null ? Number(buyPrice) : null,
    },
  });

  await prisma.medicine.update({
    where: { id },
    data: { stockQty: { increment: qty } },
  });

  return NextResponse.json(batch, { status: 201 });
}
