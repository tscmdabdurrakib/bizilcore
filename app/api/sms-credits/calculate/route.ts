import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/sms/auth";
import { calculatePurchase } from "@/lib/sms/credits";
import { parseSmsType } from "@/lib/sms/types";

export async function POST(req: NextRequest) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const amountBdt = parseFloat(body.amountBdt);
  const discountCode = body.discountCode as string | undefined;
  const smsType = parseSmsType(body.smsType);

  if (!Number.isFinite(amountBdt) || amountBdt <= 0) {
    return NextResponse.json({ error: "সঠিক পরিমাণ দিন" }, { status: 400 });
  }

  try {
    const calc = await calculatePurchase(amountBdt, smsType, discountCode);
    return NextResponse.json(calc);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Calculation failed";
    const status = msg.includes("restart") ? 503 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
