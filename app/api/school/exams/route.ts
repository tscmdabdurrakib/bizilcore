import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

function calcGrade(pct: number): string {
  if (pct >= 80) return "A+";
  if (pct >= 70) return "A";
  if (pct >= 60) return "A-";
  if (pct >= 50) return "B";
  if (pct >= 40) return "C";
  if (pct >= 33) return "D";
  return "F";
}

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId") ?? "";
  const examName = searchParams.get("examName") ?? "";

  const results = await prisma.examResult.findMany({
    where: {
      shopId: shop.id,
      ...(batchId ? { batchId } : {}),
      ...(examName ? { examName: { contains: examName, mode: "insensitive" } } : {}),
    },
    include: { student: { select: { id: true, name: true, regNumber: true } } },
    orderBy: [{ examDate: "desc" }, { obtainedMark: "desc" }],
  });

  // Group by examName + subject
  const grouped: Record<string, typeof results> = {};
  for (const r of results) {
    const key = `${r.examName}|||${r.subject}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  }

  return NextResponse.json({ results, grouped });
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();
  // body: { examName, subject, examDate, totalMark, batchId, results: [{studentId, obtainedMark, position, remarks}] }

  const created: unknown[] = [];
  for (const entry of body.results) {
    const pct = Math.round((Number(entry.obtainedMark) / Number(body.totalMark)) * 100);
    const grade = calcGrade(pct);
    const result = await prisma.examResult.create({
      data: {
        shopId: shop.id,
        studentId: entry.studentId,
        batchId: body.batchId ?? null,
        examName: body.examName,
        subject: body.subject,
        totalMark: Number(body.totalMark),
        obtainedMark: Number(entry.obtainedMark),
        percentage: pct,
        grade,
        position: entry.position ? Number(entry.position) : null,
        examDate: new Date(body.examDate),
        remarks: entry.remarks ?? null,
      },
    });
    created.push(result);
  }
  return NextResponse.json({ created: created.length }, { status: 201 });
}
