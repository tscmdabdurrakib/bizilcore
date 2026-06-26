import { NextResponse } from "next/server";

export function shopApiError(error: unknown, context?: string): NextResponse {
  console.error(context ?? "Shop API error:", error);
  return NextResponse.json(
    { error: "সার্ভার ত্রুটি। আবার চেষ্টা করুন।" },
    { status: 500 },
  );
}
