import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeBDPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-().]/g, "");
  if (cleaned.startsWith("+880")) return "0" + cleaned.slice(4);
  if (cleaned.startsWith("880") && cleaned.length === 13) return "0" + cleaned.slice(3);
  return cleaned;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { phone, orderId, reason } = await req.json();
  if (!phone) return NextResponse.json({ error: "ফোন নম্বর দিন" }, { status: 400 });

  const normalized = normalizeBDPhone(phone.trim());

  const report = await prisma.fakeOrderReport.create({
    data: { phone: normalized, orderId: orderId || null, shopId: shop.id, reason: reason || null },
  });

  if (orderId) {
    await prisma.order.update({
      where: { id: orderId },
      data: { fakeReported: true },
    }).catch(() => {});
  }

  return NextResponse.json(report, { status: 201 });
}
