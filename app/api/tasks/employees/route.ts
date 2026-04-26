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

  const staffMembers = await prisma.staffMember.findMany({
    where: { shopId: shop.id, isActive: true },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { invitedAt: "asc" },
  });

  const now = new Date();

  const result = await Promise.all(
    staffMembers.map(async (member) => {
      const [total, done, inProgress, review, overdue, dueSoon] = await Promise.all([
        prisma.task.count({ where: { shopId: shop.id, assignedToId: member.userId } }),
        prisma.task.count({ where: { shopId: shop.id, assignedToId: member.userId, status: "done" } }),
        prisma.task.count({ where: { shopId: shop.id, assignedToId: member.userId, status: "in_progress" } }),
        prisma.task.count({ where: { shopId: shop.id, assignedToId: member.userId, status: "review" } }),
        prisma.task.count({
          where: {
            shopId: shop.id,
            assignedToId: member.userId,
            status: { not: "done" },
            dueDate: { lt: now },
          },
        }),
        prisma.task.count({
          where: {
            shopId: shop.id,
            assignedToId: member.userId,
            status: { not: "done" },
            dueDate: { gte: now, lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) },
          },
        }),
      ]);

      const recentTasks = await prisma.task.findMany({
        where: { shopId: shop.id, assignedToId: member.userId, status: { not: "done" } },
        select: { id: true, title: true, status: true, priority: true, dueDate: true },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 3,
      });

      return {
        id: member.id,
        userId: member.userId,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        jobTitle: member.jobTitle,
        stats: {
          total,
          done,
          inProgress,
          review,
          todo: total - done - inProgress - review,
          overdue,
          dueSoon,
          pending: total - done,
        },
        completion: total > 0 ? Math.round((done / total) * 100) : 0,
        recentTasks,
      };
    })
  );

  return NextResponse.json(result);
}
