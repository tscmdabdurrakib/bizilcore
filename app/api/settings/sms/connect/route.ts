import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkSMSBalance, encryptApiKey } from "@/lib/sms";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { api_key } = await req.json();
  if (!api_key?.trim()) return NextResponse.json({ error: "API Key দিন" }, { status: 400 });

  const balance = await checkSMSBalance(api_key.trim());

  // false = API responded but key is invalid (wrong key)
  if (balance === false) {
    return NextResponse.json({ error: "API Key সঠিক নয়। sms.net.bd ড্যাশবোর্ড থেকে সঠিক key কপি করুন।" }, { status: 400 });
  }

  // null = network/timeout error — save key anyway, warn user
  const networkWarning = balance === null;

  const encrypted = encryptApiKey(api_key.trim());

  await prisma.smsSettings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, apiKey: encrypted, isConnected: true },
    update: { apiKey: encrypted, isConnected: true },
  });

  await prisma.smsNotificationPreferences.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });

  return NextResponse.json({
    success: true,
    balance: networkWarning ? null : balance,
    warning: networkWarning ? "SMS সংযোগ সংরক্ষিত হয়েছে, তবে ব্যালেন্স যাচাই করা সম্ভব হয়নি। পরে টেস্ট SMS পাঠিয়ে দেখুন।" : undefined,
  });
}
