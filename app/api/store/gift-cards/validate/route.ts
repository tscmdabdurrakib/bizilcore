import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { slug, code, orderTotal } = await req.json();
  if (!slug || !code) return NextResponse.json({ error: "slug and code required" }, { status: 400 });

  const shop = await prisma.shop.findUnique({ where: { storeSlug: slug }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  const card = await prisma.giftCard.findFirst({
    where: { shopId: shop.id, code: code.trim().toUpperCase(), isActive: true },
  });
  if (!card) return NextResponse.json({ error: "Invalid gift card" }, { status: 404 });
  if (card.expiresAt && card.expiresAt < new Date()) {
    return NextResponse.json({ error: "Gift card expired" }, { status: 400 });
  }
  if (card.balance <= 0) return NextResponse.json({ error: "Gift card has no balance" }, { status: 400 });

  const total = parseFloat(orderTotal) || 0;
  const applicable = Math.min(card.balance, total);

  return NextResponse.json({
    valid: true,
    code: card.code,
    balance: card.balance,
    applicableAmount: applicable,
  });
}
