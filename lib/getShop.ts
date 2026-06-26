import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cache } from "react";
import { resolveActiveShop } from "@/lib/shops/access";

/**
 * Request-scoped cached session lookup. React `cache()` dedupes the call
 * within a single server render, so layout + page + helpers share one `auth()`.
 */
export const getSession = cache(async () => {
  return auth();
});

/**
 * Request-scoped cached shop/user/subscription fetch. Resolves active shop
 * from session.activeShopId when set (multi-shop switching).
 */
export const getShopContext = cache(async (userId: string, activeShopId?: string | null) => {
  const [{ primaryShop, activeShop, accessibleShops }, user, subscription] = await Promise.all([
    resolveActiveShop(userId, activeShopId),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.subscription.findUnique({ where: { userId } }),
  ]);
  return { shop: activeShop, primaryShop, accessibleShops, user, subscription };
});

export async function requireShop() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const activeShopId = (session.user as { activeShopId?: string }).activeShopId ?? null;
  const { shop, primaryShop, accessibleShops, user, subscription } = await getShopContext(session.user.id, activeShopId);

  if (!shop || !user?.onboarded) redirect("/onboarding");

  return { session, shop, primaryShop, accessibleShops, user, subscription };
}
