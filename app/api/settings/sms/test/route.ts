import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptApiKey, sendSMS } from "@/lib/sms";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { phone } = await req.json();
  if (!phone?.trim()) return NextResponse.json({ error: "ফোন নম্বর দিন" }, { status: 400 });

  const settings = await prisma.smsSettings.findUnique({ where: { userId: session.user.id } });
  if (!settings?.isConnected || !settings.apiKey) {
    return NextResponse.json({ error: "SMS সংযুক্ত নেই। আগে API Key দিয়ে সংযুক্ত করুন।" }, { status: 400 });
  }

  const apiKey = decryptApiKey(settings.apiKey);
  const message = "BizilCore SMS সংযোগ সফল! আপনার নোটিফিকেশন সিস্টেম চালু আছে।";
  const ok = await sendSMS(apiKey, phone.trim(), message);

  if (!ok) return NextResponse.json({ error: "SMS পাঠানো যায়নি। নম্বরটি সঠিক কিনা দেখুন।" }, { status: 500 });
  return NextResponse.json({ success: true });
}
