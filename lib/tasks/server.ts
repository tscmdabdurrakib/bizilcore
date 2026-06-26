import { prisma } from "@/lib/prisma";
import { getApiShop } from "@/lib/shops/api-shop";

export async function requireTaskShop() {
  const ctx = await getApiShop();
  if ("error" in ctx) return { error: ctx.error };
  return { shop: ctx.activeShop, session: ctx.session };
}

export async function findTaskForShop(taskId: string, shopId: string) {
  return prisma.task.findFirst({ where: { id: taskId, shopId } });
}

export async function requireTaskContext(taskId: string) {
  const ctx = await requireTaskShop();
  if ("error" in ctx) return ctx;
  const task = await findTaskForShop(taskId, ctx.shop.id);
  if (!task) return { error: "not_found" as const };
  return { shop: ctx.shop, session: ctx.session, task };
}
