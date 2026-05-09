import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const activeOnly = searchParams.get("active") !== "false";

  const doctors = await prisma.doctor.findMany({
    where: {
      shopId: shop.id,
      ...(activeOnly ? { isActive: true } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { specialization: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const todayCounts = await prisma.oPDVisit.groupBy({
    by: ["doctorId"],
    where: { shopId: shop.id, visitDate: { gte: today, lt: tomorrow } },
    _count: true,
  });
  const countMap: Record<string, number> = {};
  todayCounts.forEach((c) => { countMap[c.doctorId] = c._count; });

  return NextResponse.json(doctors.map((d) => ({ ...d, todayCount: countMap[d.id] ?? 0 })));
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();

  const doctor = await prisma.doctor.create({
    data: {
      shopId: shop.id,
      name: body.name,
      title: body.title ?? "Dr.",
      specialization: body.specialization,
      qualification: body.qualification ?? null,
      bmdc: body.bmdc ?? null,
      phone: body.phone ?? null,
      visitFee: Number(body.visitFee),
      followUpFee: body.followUpFee ? Number(body.followUpFee) : null,
      chamberDays: body.chamberDays ?? null,
      chamberStartTime: body.chamberStartTime ?? null,
      chamberEndTime: body.chamberEndTime ?? null,
      maxPatients: body.maxPatients ? Number(body.maxPatients) : 30,
      isActive: true,
    },
  });

  return NextResponse.json(doctor, { status: 201 });
}
