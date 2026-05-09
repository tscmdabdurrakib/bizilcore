import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const ward = searchParams.get("ward") ?? "";
  const status = searchParams.get("status") ?? "";

  const beds = await prisma.bed.findMany({
    where: {
      shopId: shop.id,
      ...(ward ? { ward } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: [{ ward: "asc" }, { number: "asc" }],
  });

  const occupied = await prisma.iPDAdmission.findMany({
    where: { shopId: shop.id, status: "admitted" },
    select: { bedNumber: true, ward: true, patient: { select: { name: true } } },
  });

  const occupiedMap: Record<string, string> = {};
  occupied.forEach((a) => { occupiedMap[`${a.ward}-${a.bedNumber}`] = a.patient.name; });

  return NextResponse.json(beds.map((b) => ({
    ...b,
    occupiedBy: occupiedMap[`${b.ward}-${b.number}`] ?? null,
  })));
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();

  const bed = await prisma.bed.create({
    data: {
      shopId: shop.id,
      number: body.number,
      ward: body.ward,
      type: body.type ?? "general",
      dailyRate: Number(body.dailyRate ?? 0),
      status: "vacant",
    },
  });

  return NextResponse.json(bed, { status: 201 });
}
