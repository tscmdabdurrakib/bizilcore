import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const shop = await requireShop();
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId") ?? "";
  const dateStr = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  if (!batchId) return NextResponse.json({ error: "batchId required" }, { status: 400 });

  const date = new Date(dateStr);
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayEnd = new Date(dayStart.getTime() + 86400000);

  const students = await prisma.student.findMany({
    where: { shopId: shop.id, batchId, status: "active" },
    orderBy: { name: "asc" },
  });

  const existing = await prisma.attendanceRecord.findMany({
    where: { shopId: shop.id, batchId, date: { gte: dayStart, lt: dayEnd } },
  });

  const attendanceMap = Object.fromEntries(existing.map((a) => [a.studentId, a.status]));
  return NextResponse.json({ students, attendanceMap, date: dateStr });
}

export async function POST(req: NextRequest) {
  const shop = await requireShop();
  const body = await req.json();
  // body: { batchId, date, records: [{studentId, status}] }
  const date = new Date(body.date);
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  let saved = 0;
  for (const rec of body.records) {
    await prisma.attendanceRecord.upsert({
      where: { studentId_batchId_date: { studentId: rec.studentId, batchId: body.batchId, date: dayStart } },
      update: { status: rec.status },
      create: {
        shopId: shop.id,
        studentId: rec.studentId,
        batchId: body.batchId,
        date: dayStart,
        status: rec.status,
      },
    });
    saved++;
  }
  return NextResponse.json({ saved });
}
