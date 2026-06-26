import { prisma } from "@/lib/prisma";

export async function autoMarkOverdueInvoices(shopId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.invoice.updateMany({
    where: {
      shopId,
      status: "sent",
      dueDate: { lt: today },
    },
    data: { status: "overdue" },
  });
}

export async function ensureInvoiceTokens(shopId: string) {
  const missing = await prisma.invoice.findMany({
    where: { shopId, token: null },
    select: { id: true },
  });
  if (missing.length === 0) return;
  await Promise.all(
    missing.map((inv) =>
      prisma.invoice.update({
        where: { id: inv.id },
        data: { token: crypto.randomUUID() },
      })
    )
  );
}

export async function getShopForUser(userId: string) {
  return prisma.shop.findUnique({ where: { userId } });
}
