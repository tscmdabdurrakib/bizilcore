import { NextResponse } from "next/server";
import { requireSession } from "@/lib/sms/auth";
import { getCachedSmsBalance } from "@/lib/data/cached-queries";

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  try {
    const data = await getCachedSmsBalance(authResult.userId);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to load balance",
        balance: 0,
        maskingBalance: 0,
        nonMaskingBalance: 0,
        pricePerSms: 0.3,
        pricePerSmsMasking: 0.35,
        pricePerSmsNonMasking: 0.3,
        minPurchaseAmount: 10,
        isSmsServiceActive: true,
        maskingEnabled: false,
        nonMaskingEnabled: true,
      },
      { status: 503 },
    );
  }
}
