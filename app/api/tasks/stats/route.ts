import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireTaskPlan } from "@/lib/taskGuard";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await requireTaskPlan(session.user.id)) return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const [overdue, dueToday, inProgress, doneToday, upcoming] = await Promise.all([
    prisma.task.count({
      where: {
        shopId: shop.id,
        status: { not: "done" },
        dueDate: { lt: todayStart },
      },
    }),
    prisma.task.count({
      where: {
        shopId: shop.id,
        status: { not: "done" },
        dueDate: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.task.count({
      where: { shopId: shop.id, status: "in_progress" },
    }),
    prisma.task.count({
      where: {
        shopId: shop.id,
        status: "done",
        completedAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.task.findMany({
      where: {
        shopId: shop.id,
        status: { not: "done" },
        dueDate: { gte: todayStart },
      },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        priority: true,
        status: true,
        dueDate: true,
        category: true,
      },
    }),
  ]);

  return NextResponse.json({ overdue, dueToday, inProgress, doneToday, upcoming });
}
