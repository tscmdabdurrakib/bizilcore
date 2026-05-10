import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date") ?? new Date().toISOString().split("T")[0];
  const mealType = searchParams.get("mealType") ?? "breakfast";
  const section = searchParams.get("section") ?? "";

  const date = new Date(dateStr);
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayEnd = new Date(dayStart.getTime() + 86400000);

  const where: Record<string, unknown> = { shopId: shop.id, status: "active" };
  if (section) where.section = section;

  const students = await prisma.student.findMany({
    where,
    select: {
      id: true, name: true, section: true, foodAllergies: true, photoUrl: true,
      mealRecords: {
        where: { date: { gte: dayStart, lt: dayEnd }, mealType },
        select: { id: true, status: true, note: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();
  // body: { date, mealType, records: [{studentId, status, note?}] }

  const date = new Date(body.date);
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  let saved = 0;
  for (const rec of body.records) {
    await prisma.mealRecord.upsert({
      where: { studentId_date_mealType: { studentId: rec.studentId, date: dayStart, mealType: body.mealType } },
      update: { status: rec.status, note: rec.note ?? null },
      create: {
        shopId: shop.id,
        studentId: rec.studentId,
        date: dayStart,
        mealType: body.mealType,
        status: rec.status,
        note: rec.note ?? null,
      },
    });
    saved++;
  }

  return NextResponse.json({ saved });
}
