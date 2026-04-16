import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { detectFakeOrder } from "@/lib/fakeOrderDetector";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { phone, customerName, customerAddress } = await req.json();
  if (!phone) return NextResponse.json({ error: "ফোন নম্বর দিন" }, { status: 400 });

  const result = await detectFakeOrder({ shopId: shop.id, phone, customerName, customerAddress });
  return NextResponse.json(result);
}
