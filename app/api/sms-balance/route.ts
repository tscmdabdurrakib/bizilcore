import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkSMSBalance, decryptApiKey } from "@/lib/sms";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.smsSettings.findUnique({ where: { userId: session.user.id } });
  if (!settings?.isConnected || !settings.apiKey) {
    return NextResponse.json({ balance: null });
  }

  const plainKey = decryptApiKey(settings.apiKey);
  const balance = await checkSMSBalance(plainKey);
  return NextResponse.json({ balance });
}
