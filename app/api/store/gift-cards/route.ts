import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveShopForApi } from "@/lib/shops/access";

function generateCode() {
  return `GC-${Math.random().toString(36).slice(2, 8).toUpperCase()}${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const cards = await prisma.giftCard.findMany({
    where: { shopId: shopCtx.activeShop.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(cards);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const { balance, purchaserEmail, recipientEmail, expiresAt } = await req.json();
  const amount = parseFloat(balance);
  if (isNaN(amount) || amount <= 0) return NextResponse.json({ error: "Invalid balance" }, { status: 400 });

  const card = await prisma.giftCard.create({
    data: {
      shopId: shopCtx.activeShop.id,
      code: generateCode(),
      initialBalance: amount,
      balance: amount,
      purchaserEmail: purchaserEmail || null,
      recipientEmail: recipientEmail || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  return NextResponse.json(card, { status: 201 });
}
