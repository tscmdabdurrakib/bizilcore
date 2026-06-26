import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getShopForOwner } from "@/lib/hr/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const advances = await prisma.staffAdvance.findMany({
    where: { shopId: shop.id },
    include: { staff: { include: { user: { select: { name: true } } } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ advances });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { staffId, amount, date, reason } = body;

  if (!staffId || !amount || !date) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  const staff = await prisma.staffMember.findFirst({
    where: { id: staffId, shopId: shop.id, isActive: true },
  });
  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  const advance = await prisma.staffAdvance.create({
    data: {
      shopId: shop.id,
      staffId,
      amount: Number(amount),
      date: new Date(date),
      reason: reason || null,
    },
    include: { staff: { include: { user: { select: { name: true } } } } },
  });

  return NextResponse.json(advance, { status: 201 });
}
