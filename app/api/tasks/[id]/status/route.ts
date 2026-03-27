import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireTaskPlan } from "@/lib/taskGuard";
import { maybeCreateRecurringClone } from "@/lib/taskRecurrence";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await requireTaskPlan(session.user.id)) return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const { id } = await params;
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const task = await prisma.task.findFirst({
    where: { id, shopId: shop.id },
    include: { subtasks: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } },
  });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const { status } = await req.json();
  if (!status) return NextResponse.json({ error: "Status required" }, { status: 400 });

  const updated = await prisma.task.update({
    where: { id },
    data: {
      status,
      ...(status === "done" && task.status !== "done" ? { completedAt: new Date() } : {}),
      ...(status !== "done" && task.status === "done" ? { completedAt: null } : {}),
    },
  });

  await prisma.taskActivityLog.create({
    data: {
      taskId: id,
      userId: session.user.id,
      action: "স্ট্যাটাস পরিবর্তন",
      detail: `${task.status} → ${status}`,
    },
  });

  await maybeCreateRecurringClone(
    { ...task, subtasks: task.subtasks.map(s => ({ title: s.title, position: s.position })) },
    status,
    task.status,
    session.user.id
  );

  return NextResponse.json(updated);
}
