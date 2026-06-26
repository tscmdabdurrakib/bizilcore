import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptApiKey, sendSMS } from "@/lib/sms";
import { buildPOMessage } from "@/lib/purchase-orders/utils";
import { getShopForUser } from "@/lib/purchase-orders/server";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForUser(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;

  const po = await prisma.purchaseOrder.findFirst({
    where: { id, shopId: shop.id },
    include: {
      supplier: true,
      items: true,
      shop: { select: { name: true } },
    },
  });

  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!po.supplier?.phone) {
    return NextResponse.json({ error: "সরবরাহকারীর ফোন নম্বর নেই" }, { status: 400 });
  }

  const smsSettings = await prisma.smsSettings.findUnique({ where: { userId: session.user.id } });
  if (!smsSettings?.isConnected || !smsSettings?.apiKey) {
    return NextResponse.json({ error: "SMS সংযুক্ত নেই। Settings এ যান।" }, { status: 400 });
  }

  const fullMessage = buildPOMessage(po);
  const shortMessage = `${po.poNumber}: ৳${po.total.toLocaleString("bn-BD")} ক্রয় অর্ডার। ${po.shop.name}`;

  const apiKey = decryptApiKey(smsSettings.apiKey);
  const result = await sendSMS(apiKey, po.supplier.phone, shortMessage);

  if (!result.success) {
    return NextResponse.json({ error: "SMS পাঠানো যায়নি" }, { status: 400 });
  }

  if (po.status === "draft") {
    await prisma.purchaseOrder.update({
      where: { id },
      data: { status: "sent", sentAt: new Date() },
    });
  }

  return NextResponse.json({ success: true, message: fullMessage });
}
