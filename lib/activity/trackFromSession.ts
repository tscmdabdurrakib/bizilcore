import { auth } from "@/lib/auth";
import { resolveActiveShop } from "@/lib/shops/access";
import { trackUserActivity } from "@/lib/activity/trackUserActivity";
import type { ActionType } from "@/lib/activity/types";

export async function trackFromSession(
  input: {
    actionType: ActionType | string;
    actionLabel?: string;
    pagePath?: string;
    metadata?: Record<string, unknown>;
    shopId?: string | null;
  },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return;

    let shopId = input.shopId ?? null;
    if (!shopId) {
      const activeShopId = (session.user as { activeShopId?: string }).activeShopId ?? null;
      const { activeShop } = await resolveActiveShop(session.user.id, activeShopId);
      shopId = activeShop?.id ?? null;
    }

    const realAdminId = (session.user as { realAdminId?: string }).realAdminId;
    const metadata = {
      ...(input.metadata ?? {}),
      ...(realAdminId ? { realAdminId } : {}),
    };

    await trackUserActivity({
      userId: session.user.id,
      shopId,
      actionType: input.actionType,
      actionLabel: input.actionLabel,
      pagePath: input.pagePath,
      metadata,
    });
  } catch {
    // silent
  }
}

export async function trackForUser(
  userId: string,
  shopId: string | null | undefined,
  input: {
    actionType: ActionType | string;
    actionLabel?: string;
    metadata?: Record<string, unknown>;
  },
) {
  await trackUserActivity({
    userId,
    shopId: shopId ?? null,
    actionType: input.actionType,
    actionLabel: input.actionLabel,
    metadata: input.metadata,
  });
}
