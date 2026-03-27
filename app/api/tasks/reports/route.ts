import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireTaskPlan } from "@/lib/taskGuard";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await requireTaskPlan(session.user.id)) return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const daysParam = parseInt(searchParams.get("days") ?? "30");
  const days = [7, 30, 90].includes(daysParam) ? daysParam : 30;
  const now = new Date();
  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - days);
  rangeStart.setHours(0, 0, 0, 0);

  const allTasks = await prisma.task.findMany({
    where: { shopId: shop.id },
    select: {
      id: true,
      title: true,
      status: true,
      category: true,
      priority: true,
      dueDate: true,
      completedAt: true,
      createdAt: true,
      userId: true,
      assignedToId: true,
      user: { select: { name: true } },
      assignedTo: { select: { name: true } },
    },
  });

  const inRange = allTasks.filter(t => new Date(t.createdAt) >= rangeStart);

  const total = inRange.length;
  const done = inRange.filter(t => t.status === "done").length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  const overdue = inRange.filter(t => t.status !== "done" && t.dueDate && new Date(t.dueDate) < now).length;
  const overdueRate = total > 0 ? Math.round((overdue / total) * 100) : 0;

  const completedWithDates = inRange.filter(t => t.status === "done" && t.completedAt);
  const avgDaysToComplete = completedWithDates.length > 0
    ? Math.round(
        completedWithDates.reduce((sum, t) => {
          const diff = new Date(t.completedAt!).getTime() - new Date(t.createdAt).getTime();
          return sum + diff / (1000 * 60 * 60 * 24);
        }, 0) / completedWithDates.length
      )
    : 0;

  const weeklyCompletion: { week: string; count: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const effectiveFrom = weekStart < rangeStart ? rangeStart : weekStart;

    const count = allTasks.filter(
      t => t.status === "done" && t.completedAt &&
           new Date(t.completedAt) >= effectiveFrom &&
           new Date(t.completedAt) < weekEnd
    ).length;

    const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
    weeklyCompletion.push({ week: label, count });
  }

  const categoryMap: Record<string, string> = {
    order: "অর্ডার",
    delivery: "ডেলিভারি",
    supplier: "সাপ্লায়ার",
    accounts: "একাউন্টস",
    general: "সাধারণ",
  };
  const categoryCounts: Record<string, number> = {};
  for (const t of inRange) {
    categoryCounts[t.category] = (categoryCounts[t.category] ?? 0) + 1;
  }
  const categoryDistribution = Object.entries(categoryCounts).map(([key, count]) => ({
    name: categoryMap[key] ?? key,
    value: count,
  }));

  const memberMap: Record<string, { name: string; open: number; completed: number; overdue: number }> = {};
  for (const t of inRange) {
    const memberId = t.assignedToId ?? t.userId;
    const memberName = t.assignedTo?.name ?? t.user?.name ?? "অজানা";
    if (!memberMap[memberId]) {
      memberMap[memberId] = { name: memberName, open: 0, completed: 0, overdue: 0 };
    }
    if (t.status === "done") {
      memberMap[memberId].completed++;
    } else {
      memberMap[memberId].open++;
      if (t.dueDate && new Date(t.dueDate) < now) {
        memberMap[memberId].overdue++;
      }
    }
  }
  const memberStats = Object.values(memberMap).sort((a, b) => b.open + b.completed - (a.open + a.completed));

  const oldestStuck = allTasks
    .filter(t => t.status !== "done")
    .sort((a, b) => {
      const aOverdue = !!(a.dueDate && new Date(a.dueDate) < now);
      const bOverdue = !!(b.dueDate && new Date(b.dueDate) < now);
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    })
    .slice(0, 10)
    .map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      category: t.category,
      priority: t.priority,
      dueDate: t.dueDate,
      createdAt: t.createdAt,
      assignedTo: t.assignedTo?.name ?? t.user?.name ?? null,
      isOverdue: !!(t.dueDate && new Date(t.dueDate) < now),
      ageInDays: Math.floor((now.getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
    }));

  return NextResponse.json({
    kpi: { total, done, completionRate, avgDaysToComplete, overdue, overdueRate },
    weeklyCompletion,
    categoryDistribution,
    memberStats,
    oldestStuck,
  });
}
