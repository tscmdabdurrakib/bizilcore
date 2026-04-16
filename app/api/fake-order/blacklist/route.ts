import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeBDPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-().]/g, "");
  if (cleaned.startsWith("+880")) return "0" + cleaned.slice(4);
  if (cleaned.startsWith("880") && cleaned.length === 13) return "0" + cleaned.slice(3);
  return cleaned;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const list = await prisma.phoneBlacklist.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { phone, reason } = await req.json();
  if (!phone) return NextResponse.json({ error: "ফোন নম্বর দিন" }, { status: 400 });

  const normalized = normalizeBDPhone(phone.trim());

  const entry = await prisma.phoneBlacklist.upsert({
    where: { shopId_phone: { shopId: shop.id, phone: normalized } },
    create: { shopId: shop.id, phone: normalized, reason: reason || null, blockedBy: "manual" },
    update: { reason: reason || null },
  });
  return NextResponse.json(entry, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID দিন" }, { status: 400 });

  await prisma.phoneBlacklist.deleteMany({ where: { id, shopId: shop.id } });
  return NextResponse.json({ ok: true });
}
