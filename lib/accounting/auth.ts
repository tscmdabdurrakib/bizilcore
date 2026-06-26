import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveActiveShop } from "@/lib/shops/access";
import { NextResponse } from "next/server";

export async function requireAccountingShop() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const activeShopId = (session.user as { activeShopId?: string }).activeShopId ?? null;
  const { activeShop } = await resolveActiveShop(session.user.id, activeShopId);
  if (!activeShop) {
    return { error: NextResponse.json({ error: "Shop not found" }, { status: 404 }) };
  }

  return { session, shop: activeShop };
}
