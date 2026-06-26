import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Shop context for restaurant API routes (no redirect — safe for Route Handlers). */
export async function getRestaurantShop() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) {
    return { error: NextResponse.json({ error: "Shop not found" }, { status: 404 }) };
  }
  return { shop };
}
