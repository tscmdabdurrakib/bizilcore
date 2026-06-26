import { NextResponse } from "next/server";
import { getPaymentNumbers, isZiniPayEnabled } from "@/lib/zinipay";

export async function GET() {
  const numbers = getPaymentNumbers();
  return NextResponse.json({
    autoVerifyEnabled: isZiniPayEnabled(),
    numbers: {
      bkash: numbers.bkash || null,
      nagad: numbers.nagad || null,
      rocket: numbers.rocket || null,
    },
  });
}
