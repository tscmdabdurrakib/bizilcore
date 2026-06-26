import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Alias for /api/staff — used by jobcards and legacy callers */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const members = await prisma.staffMember.findMany({
    where: { shopId: shop.id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { invitedAt: "desc" },
  });

  return NextResponse.json(members);
}
