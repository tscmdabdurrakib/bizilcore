import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = { shopId: shop.id };
    if (projectId && projectId !== "all") where.projectId = projectId;
    if (from || to) {
      where.logDate = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const [logs, projects, summary] = await Promise.all([
      prisma.timeLog.findMany({
        where,
        orderBy: { logDate: "desc" },
        include: { project: { select: { id: true, projectNumber: true, title: true } } },
      }),
      prisma.freelanceProject.findMany({
        where: { shopId: shop.id, status: { notIn: ["completed", "cancelled"] } },
        select: { id: true, projectNumber: true, title: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.timeLog.groupBy({
        by: ["projectId"],
        where: { shopId: shop.id },
        _sum: { hours: true },
      }),
    ]);

    return NextResponse.json({ logs, projects, summary });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const body = await req.json();

    const log = await prisma.timeLog.create({
      data: {
        shopId: shop.id,
        projectId: body.projectId,
        task: body.task,
        hours: body.hours,
        hourlyRate: body.hourlyRate || null,
        billable: body.billable !== false,
        logDate: body.logDate ? new Date(body.logDate) : new Date(),
        note: body.note || null,
      },
      include: { project: { select: { id: true, projectNumber: true, title: true } } },
    });

    return NextResponse.json(log);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
