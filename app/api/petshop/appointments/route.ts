import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const date = searchParams.get("date");

  let dateFilter = {};
  if (date) {
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    const dEnd = new Date(date); dEnd.setHours(23, 59, 59, 999);
    dateFilter = { date: { gte: d, lte: dEnd } };
  }

  const appts = await prisma.petAppointment.findMany({
    where: {
      shopId: shop.id,
      ...(status && status !== "all" ? { status } : {}),
      ...dateFilter,
    },
    include: {
      pet: { include: { customer: { select: { id: true, name: true, phone: true } } } },
    },
    orderBy: { date: "asc" },
    take: 100,
  });

  return NextResponse.json(appts);
}

export async function POST(req: Request) {
  const { shop } = await requireShop();
  const body = await req.json();

  const appt = await prisma.petAppointment.create({
    data: {
      shopId: shop.id,
      petId: body.petId,
      type: body.type ?? "checkup",
      date: new Date(body.date),
      duration: body.duration ? Number(body.duration) : 30,
      staffId: body.staffId ?? null,
      status: "scheduled",
      fee: Number(body.fee ?? 0),
      paidAmount: Number(body.paidAmount ?? 0),
      note: body.note ?? null,
    },
    include: { pet: { include: { customer: { select: { name: true, phone: true } } } } },
  });

  if (shop.petAutoSms) {
    const dt = new Date(body.date).toLocaleString("bn-BD");
    console.log(`SMS to ${appt.pet.customer.phone}: ${appt.pet.name} এর ${appt.type} appointment নিশ্চিত হয়েছে। তারিখ: ${dt} - ${shop.name}`);
  }

  return NextResponse.json(appt);
}
