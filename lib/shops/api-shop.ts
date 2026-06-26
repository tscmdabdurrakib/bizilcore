import { NextResponse } from "next/server";
import { getActiveShopForApi } from "@/lib/shops/access";

/** Active shop for API routes (respects multi-shop session switch). */
export async function getApiShop() {
  const ctx = await getActiveShopForApi();
  if ("error" in ctx) {
    const status = ctx.error === "Unauthorized" ? 401 : 404;
    return { error: NextResponse.json({ error: ctx.error }, { status }) };
  }
  return ctx;
}

/** Transaction/list scoping: legacy rows may have null shopId on primary shop. */
export function shopRecordFilter(primaryShopId: string, activeShopId: string) {
  if (primaryShopId === activeShopId) {
    return { OR: [{ shopId: activeShopId }, { shopId: null }] };
  }
  return { shopId: activeShopId };
}
