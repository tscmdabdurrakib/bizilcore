import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveActiveShop } from "@/lib/shops/access";
import { getClientIp, parseUserAgent } from "@/lib/activity/requestMeta";
import { trackUserActivity } from "@/lib/activity/trackUserActivity";
import { createUserSession } from "@/lib/activity/sessions";
import type { ActionType } from "@/lib/activity/types";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: true });
    }

    const body = await req.json();
    const ua = req.headers.get("user-agent") || "";
    const { browser, deviceType } = parseUserAgent(ua);
    const ip = getClientIp(req.headers);

    const activeShopId = (session.user as { activeShopId?: string }).activeShopId ?? null;
    const { activeShop } = await resolveActiveShop(session.user.id, activeShopId);
    const shopId = activeShop?.id ?? null;

    const realAdminId = (session.user as { realAdminId?: string }).realAdminId;
    const metadata = {
      ...(typeof body.metadata === "object" && body.metadata ? body.metadata : {}),
      ...(realAdminId ? { realAdminId } : {}),
    };

    const actionType = (body.action_type as string) || "page_view";

    if (actionType === "login") {
      await createUserSession({
        userId: session.user.id,
        shopId,
        deviceType,
        browser,
        ipAddress: ip,
      });
    }

    await trackUserActivity({
      userId: session.user.id,
      shopId,
      actionType: actionType as ActionType,
      actionLabel: body.action_label ?? null,
      pagePath: body.page_path ?? null,
      metadata,
      durationSeconds: body.duration_seconds ?? null,
      ipAddress: ip,
      userAgent: ua,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
