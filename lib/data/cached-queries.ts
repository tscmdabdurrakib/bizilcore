import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ALL_ROWS_CAP } from "@/lib/api-limits";
import { getGlobalSmsSettings, getSmsCreditBalance } from "@/lib/sms/credits";

export async function getCachedProductsPage1(shopId: string, limit = 50) {
  return unstable_cache(
    async () =>
      prisma.product.findMany({
        where: { shopId },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ["products", shopId, "page1", String(limit)],
    { revalidate: 60, tags: [`products-${shopId}`] },
  )();
}

export async function getCachedCategories(shopId: string) {
  return unstable_cache(
    async () => {
      const count = await prisma.category.count({ where: { shopId } });
      if (count === 0) {
        await prisma.category.create({
          data: { shopId, name: "অন্যান্য", isDefault: true, position: 0 },
        });
      }
      return prisma.category.findMany({
        where: { shopId },
        orderBy: [{ position: "asc" }, { createdAt: "desc" }],
        include: { _count: { select: { products: true } } },
      });
    },
    ["categories", shopId],
    { revalidate: 300, tags: [`categories-${shopId}`] },
  )();
}

export async function getCachedCustomersPage1(shopId: string, limit = 30) {
  return unstable_cache(
    async () => {
      const where = { shopId };
      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          include: { _count: { select: { orders: true } } },
          orderBy: { createdAt: "desc" },
          take: limit,
        }),
        prisma.customer.count({ where }),
      ]);
      return { customers, total, page: 1, limit, pages: Math.ceil(total / limit) };
    },
    ["customers", shopId, "page1", String(limit)],
    { revalidate: 120, tags: [`customers-${shopId}`] },
  )();
}

export async function getCachedSmsBalance(userId: string) {
  return unstable_cache(
    async () => {
      const [balance, global, senderRequest] = await Promise.all([
        getSmsCreditBalance(userId),
        getGlobalSmsSettings(),
        prisma.smsSenderIdRequest.findUnique({ where: { userId } }),
      ]);
      return {
        balance: balance.balance,
        maskingBalance: balance.maskingBalance,
        nonMaskingBalance: balance.nonMaskingBalance,
        totalPurchased: balance.totalPurchased,
        totalUsed: balance.totalUsed,
        isLow: balance.isLow,
        isLowMasking: balance.isLowMasking,
        isLowNonMasking: balance.isLowNonMasking,
        lowCreditThreshold: balance.lowCreditThreshold,
        pricePerSms: global.pricePerSmsNonMasking ?? global.pricePerSms,
        pricePerSmsMasking: global.pricePerSmsMasking ?? global.pricePerSms,
        pricePerSmsNonMasking: global.pricePerSmsNonMasking ?? global.pricePerSms,
        minPurchaseAmount: global.minPurchaseAmount,
        isSmsServiceActive: global.isSmsServiceActive,
        maskingEnabled: global.maskingEnabled,
        nonMaskingEnabled: global.nonMaskingEnabled,
        senderIdStatus: senderRequest?.status ?? null,
        senderId: senderRequest?.senderId ?? null,
      };
    },
    ["sms-credits", userId],
    { revalidate: 30, tags: [`sms-credits-${userId}`] },
  )();
}

export async function getCachedFbConnect(shopId: string) {
  return unstable_cache(
    async () => {
      const [pages, commentOrdersCount, messagesCount, repliedMessagesCount] = await Promise.all([
        prisma.facebookPage.findMany({
          where: { shopId },
          orderBy: { connectedAt: "desc" },
        }),
        prisma.suggestedOrder.count({ where: { shopId } }),
        prisma.messengerConversation.count({ where: { shopId } }),
        prisma.messengerConversation.count({ where: { shopId, repliedAt: { not: null } } }),
      ]);
      const totalFollowers = pages.reduce((sum, p) => sum + (p.followers ?? 0), 0);
      return {
        pages,
        stats: {
          totalPages: pages.length,
          activePages: pages.filter((p) => p.isActive).length,
          totalFollowers,
          commentOrders: commentOrdersCount,
          messages: messagesCount,
          repliedMessages: repliedMessagesCount,
        },
      };
    },
    ["fb-pages", shopId],
    { revalidate: 300, tags: [`fb-pages-${shopId}`] },
  )();
}

/** Uncached product fetch for search, pagination, all, variants. */
export async function fetchProductsUncached(
  shopId: string,
  opts: {
    page?: number;
    limit?: number;
    search?: string;
    all?: boolean;
    withVariants?: boolean;
  },
) {
  const page = opts.page ?? 1;
  const limit = Math.min(opts.limit ?? 50, 50);
  const search = opts.search ?? "";
  const whereClause = {
    shopId,
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
  };

  if (opts.all || opts.withVariants) {
    return prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: ALL_ROWS_CAP,
      include: opts.withVariants ? { variants: { orderBy: { createdAt: "asc" } } } : undefined,
    });
  }

  return prisma.product.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });
}
