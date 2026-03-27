import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkSMSBalance, decryptApiKey, maskApiKey } from "@/lib/sms";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [settings, prefs] = await Promise.all([
    prisma.smsSettings.findUnique({ where: { userId: session.user.id } }),
    prisma.smsNotificationPreferences.findUnique({ where: { userId: session.user.id } }),
  ]);

  let balance: number | null | false = null;
  let maskedKey: string | null = null;

  if (settings?.isConnected && settings.apiKey) {
    const plainKey = decryptApiKey(settings.apiKey);
    maskedKey = maskApiKey(plainKey);
    balance = await checkSMSBalance(plainKey);
  }

  return NextResponse.json({
    isConnected: settings?.isConnected ?? false,
    maskedApiKey: maskedKey,
    balance,
    preferences: {
      orderConfirmed: prefs?.orderConfirmed ?? true,
      orderStatusChanged: prefs?.orderStatusChanged ?? false,
      deliveryConfirmed: prefs?.deliveryConfirmed ?? false,
      paymentReceived: prefs?.paymentReceived ?? false,
      lowStockAlert: prefs?.lowStockAlert ?? false,
    },
  });
}
