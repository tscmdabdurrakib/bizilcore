import { prisma } from "@/lib/prisma";
import { incrementFeatureUsage } from "@/lib/activity/incrementFeatureUsage";
import { bumpSessionStats } from "@/lib/activity/sessions";
import { FEATURE_ACTIONS, type TrackUserActivityInput } from "@/lib/activity/types";
import { broadcastActivity } from "@/lib/activity/broadcast";

export async function trackUserActivity(input: TrackUserActivityInput): Promise<void> {
  try {
    const log = await prisma.userActivityLog.create({
      data: {
        userId: input.userId,
        shopId: input.shopId ?? null,
        actionType: input.actionType,
        actionLabel: input.actionLabel ?? null,
        pagePath: input.pagePath ?? null,
        metadata: (input.metadata ?? {}) as object,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        durationSeconds: input.durationSeconds ?? null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        shop: { select: { id: true, name: true } },
      },
    });

    if (input.shopId && FEATURE_ACTIONS.includes(input.actionType as (typeof FEATURE_ACTIONS)[number])) {
      await incrementFeatureUsage(input.shopId, input.actionType);
    }

    if (input.actionType === "page_view") {
      await bumpSessionStats(input.userId, "page_view");
    } else if (
      input.actionType !== "page_leave" &&
      input.actionType !== "login" &&
      input.actionType !== "logout"
    ) {
      await bumpSessionStats(input.userId, "action");
    }

    broadcastActivity({
      type: "ACTIVITY",
      log: {
        id: log.id,
        userId: log.userId,
        shopId: log.shopId,
        actionType: log.actionType,
        actionLabel: log.actionLabel,
        pagePath: log.pagePath,
        metadata: log.metadata,
        durationSeconds: log.durationSeconds,
        createdAt: log.createdAt.toISOString(),
        user: log.user,
        shop: log.shop,
      },
    });
  } catch {
    // Silent fail — never interrupt user flow
  }
}
