import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? "";

  const prescriptions = await prisma.prescription.findMany({
    where: {
      shopId: shop.id,
      ...(search && {
        OR: [
          { patientName: { contains: search, mode: "insensitive" } },
          { patientPhone: { contains: search, mode: "insensitive" } },
          { doctorName: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      items: {
        include: { medicine: { select: { id: true, brandName: true } } },
      },
      customer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(prescriptions);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();

  const { patientName, patientPhone, doctorName, photoUrl, note, items, customerId } = body;

  if (!patientName) {
    return NextResponse.json({ error: "রোগীর নাম আবশ্যক।" }, { status: 400 });
  }

  const itemList = Array.isArray(items) ? items as { medicineId?: string; medicineName: string; quantity: number; unitPrice: number; subtotal: number }[] : [];

  const medicineIds = [...new Set(itemList.filter(i => i.medicineId).map(i => i.medicineId as string))];
  if (medicineIds.length > 0) {
    const meds = await prisma.medicine.findMany({ where: { id: { in: medicineIds } }, select: { id: true, shopId: true } });
    if (meds.length !== medicineIds.length) {
      return NextResponse.json({ error: "এক বা একাধিক ওষুধ পাওয়া যায়নি।" }, { status: 400 });
    }
    const invalid = meds.filter(m => m.shopId !== shop.id);
    if (invalid.length > 0) {
      return NextResponse.json({ error: "অবৈধ ওষুধ আইডি — অন্য শপের ওষুধ।" }, { status: 400 });
    }
  }

  if (customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true, shopId: true } });
    if (!customer || customer.shopId !== shop.id) {
      return NextResponse.json({ error: "কাস্টমার পাওয়া যায়নি।" }, { status: 400 });
    }
  }

  const saleTotal = itemList.reduce((sum, it) => sum + Number(it.subtotal ?? 0), 0);

  const prescription = await prisma.prescription.create({
    data: {
      shopId: shop.id,
      customerId: customerId ?? null,
      patientName,
      patientPhone: patientPhone ?? null,
      doctorName: doctorName ?? null,
      photoUrl: photoUrl ?? null,
      note: note ?? null,
      saleTotal,
      items: itemList.length > 0 ? {
        create: itemList.map(it => ({
          medicineId: it.medicineId ?? null,
          medicineName: it.medicineName,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          subtotal: Number(it.subtotal),
        })),
      } : undefined,
    },
    include: {
      items: { include: { medicine: { select: { id: true, brandName: true } } } },
      customer: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(prescription, { status: 201 });
}
