import { prisma } from "@/lib/prisma";

export async function createAutoTask({
  shopId,
  userId,
  title,
  category,
  priority,
  dueDaysFromNow = 0,
  orderId,
}: {
  shopId: string;
  userId: string;
  title: string;
  category: "order" | "delivery" | "supplier" | "accounts" | "general";
  priority: "low" | "medium" | "high" | "urgent";
  dueDaysFromNow?: number;
  orderId?: string;
}) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub || (sub.plan !== "pro" && sub.plan !== "business")) return;

  const dueDate = new Date();
  dueDate.setHours(23, 59, 59, 999);
  dueDate.setDate(dueDate.getDate() + dueDaysFromNow);

  await prisma.task.create({
    data: {
      shopId,
      userId,
      title,
      category,
      priority,
      status: "todo",
      dueDate,
      orderId: orderId ?? null,
    },
  });
}
