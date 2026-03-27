import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireTaskPlan } from "@/lib/taskGuard";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await requireTaskPlan(session.user.id)) return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const { id } = await params;
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const original = await prisma.task.findFirst({
    where: { id, shopId: shop.id },
    include: { subtasks: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } },
  });
  if (!original) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const duplicate = await prisma.task.create({
    data: {
      shopId: original.shopId,
      userId: session.user.id,
      title: original.title,
      description: original.description,
      status: "todo",
      priority: original.priority,
      category: original.category,
      assignedToId: original.assignedToId,
      tags: original.tags,
      attachments: original.attachments,
      dueDate: original.dueDate,
      reminderAt: original.reminderAt,
      reminderSent: false,
      recurring: original.recurring,
      recurrence: original.recurrence,
      orderId: original.orderId,
      estimatedMinutes: original.estimatedMinutes,
      actualMinutes: original.actualMinutes,
    },
  });

  if (original.subtasks.length > 0) {
    await prisma.subTask.createMany({
      data: original.subtasks.map((st, i) => ({
        taskId: duplicate.id,
        title: st.title,
        done: false,
        position: i,
      })),
    });
  }

  await prisma.taskActivityLog.create({
    data: {
      taskId: duplicate.id,
      userId: session.user.id,
      action: "টাস্ক ডুপ্লিকেট করা হয়েছে",
      detail: `মূল টাস্ক: ${original.title}`,
    },
  });

  return NextResponse.json(duplicate, { status: 201 });
}
