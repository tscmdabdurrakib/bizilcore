import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveShopForApi } from "@/lib/shops/access";
import { sendSMS, decryptApiKey } from "@/lib/sms";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const campaigns = await prisma.storeCampaign.findMany({
    where: { shopId: shopCtx.activeShop.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });
  const shop = shopCtx.activeShop;

  const { name, type, subject, body, segment, sendNow } = await req.json();
  if (!name?.trim() || !type || !body?.trim()) {
    return NextResponse.json({ error: "Name, type, and body required" }, { status: 400 });
  }

  const campaign = await prisma.storeCampaign.create({
    data: {
      shopId: shop.id,
      name: name.trim(),
      type,
      subject: subject || null,
      body: body.trim(),
      segment: segment || null,
      status: sendNow ? "sending" : "draft",
    },
  });

  if (sendNow && type === "sms") {
    const customers = await prisma.customer.findMany({
      where: { shopId: shop.id, phone: { not: null } },
      select: { phone: true },
      take: 200,
    });
    const smsSettings = await prisma.smsSettings.findUnique({ where: { userId: session.user.id } });
    let sent = 0;
    if (smsSettings?.apiKey) {
      const apiKey = decryptApiKey(smsSettings.apiKey);
      for (const c of customers) {
        if (!c.phone) continue;
        try {
          await sendSMS(apiKey, c.phone, body.trim());
          sent++;
        } catch { /* skip failed */ }
      }
    }
    await prisma.storeCampaign.update({
      where: { id: campaign.id },
      data: { status: "sent", sentCount: sent, sentAt: new Date() },
    });
  }

  return NextResponse.json(campaign, { status: 201 });
}
