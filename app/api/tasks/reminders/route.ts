import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireTaskPlan } from "@/lib/taskGuard";
import { sendTaskReminderEmail } from "@/lib/mailer";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await requireTaskPlan(session.user.id)) return NextResponse.json({ reminded: 0 });

  const now = new Date();

  const tasks = await prisma.task.findMany({
    where: {
      user: { id: session.user.id },
      reminderAt: { lte: now },
      reminderSent: false,
      completedAt: null,
    },
    include: {
      user: { select: { name: true, email: true } },
      assignedTo: { select: { name: true, email: true } },
    },
  });

  for (const task of tasks) {
    const recipients = new Map<string, { userId: string; email: string; name: string }>();

    if (task.user?.email) {
      recipients.set(task.userId, {
        userId: task.userId,
        email: task.user.email,
        name: task.user.name ?? "ব্যবহারকারী",
      });
    }

    if (task.assignedToId && task.assignedTo?.email && task.assignedToId !== task.userId) {
      recipients.set(task.assignedToId, {
        userId: task.assignedToId,
        email: task.assignedTo.email,
        name: task.assignedTo.name ?? "ব্যবহারকারী",
      });
    }

    for (const recipient of recipients.values()) {
      await prisma.notification.create({
        data: {
          userId: recipient.userId,
          type: "task_reminder",
          title: "টাস্ক রিমাইন্ডার",
          body: task.title,
          link: "/tasks",
        },
      });

      try {
        await sendTaskReminderEmail({
          toEmail: recipient.email,
          userName: recipient.name,
          taskTitle: task.title,
          dueDate: task.dueDate ?? undefined,
        });
      } catch (err) {
        console.error("[TaskReminder] Email error:", err);
      }
    }

    await prisma.task.update({
      where: { id: task.id },
      data: { reminderSent: true },
    });
  }

  return NextResponse.json({ reminded: tasks.length });
}

export async function GET() {
  return POST();
}
