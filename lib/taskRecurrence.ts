import { prisma } from "@/lib/prisma";
import { TaskPriority, TaskCategory, RecurrenceType } from "@prisma/client";

export function getNextDueDate(current: Date, recurrence: string): Date {
  const next = new Date(current);
  if (recurrence === "daily") next.setDate(next.getDate() + 1);
  else if (recurrence === "weekly") next.setDate(next.getDate() + 7);
  else if (recurrence === "monthly") next.setMonth(next.getMonth() + 1);
  return next;
}

interface RecurringTask {
  id: string;
  shopId: string;
  userId: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  category: TaskCategory;
  assignedToId: string | null;
  tags: string[];
  attachments: string[];
  dueDate: Date | null;
  recurring: boolean;
  recurrence: RecurrenceType;
  orderId: string | null;
  estimatedMinutes: number | null;
  status: string;
  subtasks: { title: string; position: number }[];
}

export async function maybeCreateRecurringClone(
  task: RecurringTask,
  newStatus: string,
  previousStatus: string,
  actorUserId: string
): Promise<void> {
  if (
    newStatus !== "done" ||
    previousStatus === "done" ||
    !task.recurring ||
    task.recurrence === "none"
  ) {
    return;
  }

  const newDueDate = task.dueDate
    ? getNextDueDate(new Date(task.dueDate), task.recurrence)
    : getNextDueDate(new Date(), task.recurrence);

  const newTask = await prisma.task.create({
    data: {
      shopId: task.shopId,
      userId: task.userId,
      title: task.title,
      description: task.description,
      status: "todo",
      priority: task.priority,
      category: task.category,
      assignedToId: task.assignedToId,
      tags: task.tags,
      attachments: [],
      dueDate: newDueDate,
      reminderAt: null,
      reminderSent: false,
      recurring: true,
      recurrence: task.recurrence,
      orderId: task.orderId,
      estimatedMinutes: task.estimatedMinutes,
    },
  });

  if (task.subtasks.length > 0) {
    await prisma.subTask.createMany({
      data: task.subtasks.map((st, i) => ({
        taskId: newTask.id,
        title: st.title,
        done: false,
        position: i,
      })),
    });
  }

  await prisma.taskActivityLog.create({
    data: {
      taskId: newTask.id,
      userId: actorUserId,
      action: "পুনরাবৃত্তি থেকে তৈরি",
      detail: `মূল টাস্ক: ${task.title}`,
    },
  });
}
