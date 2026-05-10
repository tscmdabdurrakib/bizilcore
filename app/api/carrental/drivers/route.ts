import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";

  const where: Record<string, unknown> = { shopId: shop.id };
  if (status) where.status = status;

  const drivers = await prisma.rentalDriver.findMany({
    where,
    include: {
      vehicles: { select: { id: true, regNumber: true, brand: true, model: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(drivers);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();

  const { name, phone, licenseNo, licenseType, licenseExp, nid, address, salary, salaryType, perTripRate, photoUrl } = body;

  if (!name || !phone) {
    return NextResponse.json({ error: "নাম ও ফোন নম্বর আবশ্যক" }, { status: 400 });
  }

  const driver = await prisma.rentalDriver.create({
    data: {
      shopId: shop.id,
      name,
      phone,
      licenseNo: licenseNo || null,
      licenseType: licenseType || null,
      licenseExp: licenseExp ? new Date(licenseExp) : null,
      nid: nid || null,
      address: address || null,
      salary: salary ? Number(salary) : null,
      salaryType: salaryType || "monthly",
      perTripRate: perTripRate ? Number(perTripRate) : null,
      photoUrl: photoUrl || null,
      status: "available",
    },
  });

  return NextResponse.json(driver, { status: 201 });
}
