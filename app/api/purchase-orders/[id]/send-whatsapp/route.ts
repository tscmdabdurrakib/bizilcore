import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptToken, sendWhatsAppMessage } from "@/lib/whatsapp";
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

  const wa = await prisma.whatsAppSettings.findUnique({ where: { userId: session.user.id } });
  if (!wa?.isConnected || !wa.apiToken || !wa.phoneNumberId) {
    return NextResponse.json({ error: "WhatsApp সংযুক্ত নেই। Settings এ যান।" }, { status: 400 });
  }

  const message = buildPOMessage(po);
  const token = decryptToken(wa.apiToken);
  const result = await sendWhatsAppMessage(token, wa.phoneNumberId, po.supplier.phone, message);

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "মেসেজ পাঠানো যায়নি" }, { status: 400 });
  }

  if (po.status === "draft") {
    await prisma.purchaseOrder.update({
      where: { id },
      data: { status: "sent", sentAt: new Date() },
    });
  }

  await prisma.messageLog.create({
    data: {
      userId: session.user.id,
      toPhone: po.supplier.phone,
      message,
      status: "sent",
    },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
