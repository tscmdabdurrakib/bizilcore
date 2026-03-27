import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

const ALLOWED_VAT_RATES = new Set([0, 0.075]);

interface SaleItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();

  const {
    patientName,
    patientPhone,
    customerId,
    items,
    rxNote,
    rxPhotoUrl,
  }: {
    patientName?: string;
    patientPhone?: string;
    customerId?: string;
    items: SaleItem[];
    rxNote?: string;
    rxPhotoUrl?: string;
  } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "কার্টে কোনো ওষুধ নেই।" }, { status: 400 });
  }

  for (const item of items) {
    if (!item.medicineId || typeof item.medicineId !== "string") {
      return NextResponse.json({ error: "অবৈধ medicineId।" }, { status: 400 });
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return NextResponse.json({ error: `পরিমাণ অবশ্যই ধনাত্মক পূর্ণসংখ্যা হতে হবে।` }, { status: 400 });
    }
    if (typeof item.unitPrice !== "number" || item.unitPrice < 0) {
      return NextResponse.json({ error: `একক মূল্য শূন্য বা ধনাত্মক হতে হবে।` }, { status: 400 });
    }
    if (!ALLOWED_VAT_RATES.has(item.vatRate)) {
      return NextResponse.json({ error: `VAT হার অবৈধ (0 বা 0.075 হওয়া উচিত)।` }, { status: 400 });
    }
  }

  const medicineIds = items.map(i => i.medicineId);

  const medicines = await prisma.medicine.findMany({
    where: { id: { in: medicineIds }, shopId: shop.id },
    include: {
      batches: {
        where: { quantity: { gt: 0 } },
        orderBy: { expiryDate: "asc" },
      },
    },
  });

  if (medicines.length !== medicineIds.length) {
    return NextResponse.json({ error: "এক বা একাধিক ওষুধ এই শপের অন্তর্গত নয়।" }, { status: 400 });
  }

  const medicineMap = new Map(medicines.map(m => [m.id, m]));

  for (const item of items) {
    const med = medicineMap.get(item.medicineId)!;
    if (med.stockQty < item.quantity) {
      return NextResponse.json({ error: `"${med.brandName}"-এর পর্যাপ্ত স্টক নেই। বর্তমান স্টক: ${med.stockQty}` }, { status: 400 });
    }
  }

  if (customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true, shopId: true } });
    if (!customer || customer.shopId !== shop.id) {
      return NextResponse.json({ error: "কাস্টমার এই শপের অন্তর্গত নয়।" }, { status: 400 });
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const med = medicineMap.get(item.medicineId)!;

      const freshBatches = await tx.medicineBatch.findMany({
        where: { medicineId: item.medicineId, quantity: { gt: 0 } },
        orderBy: { expiryDate: "asc" },
      });

      let remaining = item.quantity;
      for (const batch of freshBatches) {
        if (remaining <= 0) break;
        const deduct = Math.min(batch.quantity, remaining);
        await tx.medicineBatch.update({
          where: { id: batch.id },
          data: { quantity: { decrement: deduct } },
        });
        remaining -= deduct;
      }

      if (remaining > 0) {
        throw new Error(`"${med.brandName}"-এর পর্যাপ্ত ব্যাচ স্টক নেই।`);
      }

      await tx.medicine.update({
        where: { id: item.medicineId },
        data: { stockQty: { decrement: item.quantity } },
      });
    }

    const saleTotal = items.reduce((s, i) => {
      const base = i.quantity * i.unitPrice;
      return s + base + base * i.vatRate;
    }, 0);

    const hasRxItems = items.some(i => medicineMap.get(i.medicineId)?.requiresRx);

    let prescription = null;
    if (hasRxItems || patientName) {
      prescription = await tx.prescription.create({
        data: {
          shopId: shop.id,
          customerId: customerId ?? null,
          patientName: patientName ?? "অজ্ঞাত রোগী",
          patientPhone: patientPhone ?? null,
          photoUrl: rxPhotoUrl ?? null,
          note: rxNote ?? null,
          saleTotal,
          items: {
            create: items.map(i => ({
              medicineId: i.medicineId,
              medicineName: i.medicineName,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              subtotal: i.quantity * i.unitPrice,
            })),
          },
        },
      });
    }

    return { saleTotal, prescriptionId: prescription?.id ?? null };
  });

  return NextResponse.json({ ok: true, ...result }, { status: 201 });
}
