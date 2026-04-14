import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [customers, thisMonthCount] = await Promise.all([
    prisma.storeCustomer.findMany({
      where: { shopId: shop.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        avatar: true,
        emailVerified: true,
        googleId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    }),
    prisma.storeCustomer.count({
      where: { shopId: shop.id, createdAt: { gte: startOfMonth } },
    }),
  ]);

  return NextResponse.json({ customers, thisMonthCount });
}
