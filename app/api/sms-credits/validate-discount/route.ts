import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/sms/auth";
import { calculatePurchase } from "@/lib/sms/credits";

import { parseSmsType } from "@/lib/sms/types";

export async function GET(req: NextRequest) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const code = req.nextUrl.searchParams.get("code") ?? "";
  const amount = parseFloat(req.nextUrl.searchParams.get("amount") ?? "0");
  const smsType = parseSmsType(req.nextUrl.searchParams.get("smsType"));

  if (!code.trim()) {
    return NextResponse.json({ valid: false, error: "কোড দিন" }, { status: 400 });
  }

  try {
    const calc = await calculatePurchase(amount, smsType, code);
    return NextResponse.json({
      valid: calc.discountId !== null,
      discountAmount: calc.discountAmount,
      finalAmount: calc.finalAmount,
      totalCredits: calc.totalCredits,
    });
  } catch (e) {
    return NextResponse.json(
      { valid: false, error: e instanceof Error ? e.message : "Invalid code" },
      { status: 400 }
    );
  }
}
