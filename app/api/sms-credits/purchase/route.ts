import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/sms/auth";
import { initiatePurchase } from "@/lib/sms/credits";
import { parseSmsType } from "@/lib/sms/types";

export async function POST(req: NextRequest) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const amountBdt = parseFloat(body.amountBdt);
  const paymentMethod = body.method ?? body.paymentMethod;
  const transactionId = body.transactionId ?? body.paymentReference;
  const senderPhone = body.senderPhone;
  const discountCode = body.discountCode;
  const smsType = parseSmsType(body.smsType);

  if (!Number.isFinite(amountBdt) || amountBdt <= 0) {
    return NextResponse.json({ error: "সঠিক পরিমাণ দিন" }, { status: 400 });
  }
  if (!paymentMethod) {
    return NextResponse.json({ error: "পেমেন্ট পদ্ধতি নির্বাচন করুন" }, { status: 400 });
  }

  try {
    const result = await initiatePurchase(authResult.userId, {
      amountBdt,
      smsType,
      discountCode,
      paymentMethod,
      paymentReference: transactionId,
      senderPhone,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Purchase failed" },
      { status: 400 }
    );
  }
}
