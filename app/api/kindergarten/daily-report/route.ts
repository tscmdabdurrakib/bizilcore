import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const date = new Date(dateStr);
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayEnd = new Date(dayStart.getTime() + 86400000);

  // Get all active children
  const students = await prisma.student.findMany({
    where: { shopId: shop.id, status: "active" },
    select: { id: true, name: true, section: true, photoUrl: true },
    orderBy: { name: "asc" },
  });

  // Get today's attendance
  const attendance = await prisma.attendanceRecord.findMany({
    where: { shopId: shop.id, date: { gte: dayStart, lt: dayEnd } },
    select: { studentId: true, status: true },
  });
  const presentIds = new Set(attendance.filter(a => a.status === "present").map(a => a.studentId));

  // Get existing reports for today
  const reports = await prisma.dailyReport.findMany({
    where: { shopId: shop.id, reportDate: { gte: dayStart, lt: dayEnd } },
  });
  const reportMap = Object.fromEntries(reports.map(r => [r.studentId, r]));

  const result = students
    .filter(s => presentIds.has(s.id) || attendance.length === 0)
    .map(s => ({
      ...s,
      isPresent: presentIds.has(s.id),
      report: reportMap[s.id] ?? null,
    }));

  return NextResponse.json({ students: result, date: dateStr, totalPresent: presentIds.size });
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();
  // body: { date, reports: [{studentId, mood, activities, ate, napped, napDuration, teacherNote}] }

  const date = new Date(body.date);
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  let saved = 0;
  for (const rep of body.reports) {
    await prisma.dailyReport.upsert({
      where: { studentId_reportDate: { studentId: rep.studentId, reportDate: dayStart } },
      update: {
        mood: rep.mood ?? null,
        activities: rep.activities ?? [],
        ate: rep.ate ?? null,
        napped: rep.napped ?? false,
        napDuration: rep.napDuration ?? null,
        teacherNote: rep.teacherNote ?? null,
      },
      create: {
        shopId: shop.id,
        studentId: rep.studentId,
        reportDate: dayStart,
        mood: rep.mood ?? null,
        activities: rep.activities ?? [],
        ate: rep.ate ?? null,
        napped: rep.napped ?? false,
        napDuration: rep.napDuration ?? null,
        teacherNote: rep.teacherNote ?? null,
        sentToParent: false,
      },
    });
    saved++;
  }

  // If bulk send requested, mark all as sent
  if (body.markSent) {
    await prisma.dailyReport.updateMany({
      where: { shopId: shop.id, reportDate: dayStart },
      data: { sentToParent: true, sentAt: new Date() },
    });
  }

  return NextResponse.json({ saved });
}
