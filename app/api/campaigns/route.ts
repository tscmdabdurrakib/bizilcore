import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage, formatPhone, decryptToken } from "@/lib/whatsapp";
import { sendSMS, decryptApiKey } from "@/lib/sms";
import { computeSegmentRecipients, type SegmentKey } from "@/lib/segments";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const pageRaw = parseInt(searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.campaignLog.findMany({
      where: { shopId: shop.id },
      orderBy: { sentAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.campaignLog.count({ where: { shopId: shop.id } }),
  ]);

  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) });
}

const VALID_SEGMENTS: SegmentKey[] = ["vip", "new", "active", "at_risk", "dormant"];
const VALID_CHANNELS = ["whatsapp", "sms"] as const;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { segment, channel, message } = body as {
    segment: string;
    channel: string;
    message: string;
  };

  if (!segment || !VALID_SEGMENTS.includes(segment as SegmentKey)) {
    return NextResponse.json({ error: "Invalid segment" }, { status: 400 });
  }
  if (!channel || !VALID_CHANNELS.includes(channel as "whatsapp" | "sms")) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const allRecipients = await computeSegmentRecipients(shop.id, segment as SegmentKey);
  const recipients = allRecipients.filter(c => c.phone?.trim());

  let sentCount = 0;
  let channelError: string | null = null;

  if (channel === "whatsapp") {
    const waSettings = await prisma.whatsAppSettings.findUnique({
      where: { userId: session.user.id },
    });

    if (waSettings?.isConnected && waSettings.apiToken && waSettings.phoneNumberId) {
      const token = decryptToken(waSettings.apiToken);

      for (const c of recipients) {
        if (!c.phone) continue;
        try {
          const result = await sendWhatsAppMessage(token, waSettings.phoneNumberId, c.phone, message);
          if (result.success) sentCount++;
          await prisma.messageLog.create({
            data: {
              userId: session.user.id,
              customerId: c.id,
              toPhone: formatPhone(c.phone),
              message,
              status: result.success ? "sent" : "failed",
              errorMessage: result.error ?? null,
            },
          });
        } catch {
          await prisma.messageLog.create({
            data: {
              userId: session.user.id,
              customerId: c.id,
              toPhone: formatPhone(c.phone),
              message,
              status: "failed",
              errorMessage: "Send error",
            },
          });
        }
      }
    } else {
      channelError = "WhatsApp সংযুক্ত নেই — বার্তা পাঠানো হয়নি";
    }
  } else if (channel === "sms") {
    const smsSettings = await prisma.smsSettings.findUnique({
      where: { userId: session.user.id },
    });

    if (smsSettings?.isConnected && smsSettings.apiKey) {
      const apiKey = decryptApiKey(smsSettings.apiKey);

      for (const c of recipients) {
        if (!c.phone) continue;
        const phone = c.phone.replace(/[^0-9]/g, "");
        if (!phone) continue;
        try {
          const success = await sendSMS(apiKey, phone, message);
          if (success) sentCount++;
          await prisma.messageLog.create({
            data: {
              userId: session.user.id,
              customerId: c.id,
              toPhone: phone,
              message,
              status: success ? "sent" : "failed",
              errorMessage: success ? null : "SMS send failed",
            },
          });
        } catch {
          await prisma.messageLog.create({
            data: {
              userId: session.user.id,
              customerId: c.id,
              toPhone: phone,
              message,
              status: "failed",
              errorMessage: "Send error",
            },
          });
        }
      }
    } else {
      channelError = "SMS সংযুক্ত নেই — বার্তা পাঠানো হয়নি";
    }
  }

  const log = await prisma.campaignLog.create({
    data: {
      shopId: shop.id,
      userId: session.user.id,
      segment,
      channel,
      message,
      recipientCount: sentCount,
    },
  });

  if (channelError) {
    return NextResponse.json(
      { error: channelError, log, sentCount: 0, totalRecipients: recipients.length },
      { status: 422 }
    );
  }

  return NextResponse.json({
    log,
    sentCount,
    totalRecipients: recipients.length,
  });
}
