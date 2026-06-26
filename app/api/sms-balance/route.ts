import { NextResponse } from "next/server";
import { requireSession } from "@/lib/sms/auth";
import { getSmsCreditBalance } from "@/lib/sms/credits";

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const balance = await getSmsCreditBalance(authResult.userId);
  return NextResponse.json({ balance: balance.balance, isLow: balance.isLow });
}
