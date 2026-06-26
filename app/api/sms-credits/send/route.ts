import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/sms/auth";
import {
  InsufficientCreditsError,
  MaskingNotApprovedError,
  sendPlatformSMS,
} from "@/lib/sms/send";
import { countSmsSegments } from "@/lib/sms/credits";
import { parseSmsType } from "@/lib/sms/types";

export async function POST(req: NextRequest) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const phone = body.phone as string;
  const message = body.message as string;
  const customerId = body.customerId as string | undefined;
  const smsType = parseSmsType(body.smsType);

  if (!phone?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "ফোন ও মেসেজ দিন" }, { status: 400 });
  }

  const segments = countSmsSegments(message);

  try {
    const result = await sendPlatformSMS(authResult.userId, phone, message, {
      customerId,
      smsType,
    });
    if (!result.success) {
      return NextResponse.json({ error: "SMS পাঠাতে ব্যর্থ হয়েছে। ক্রেডিট কাটা হয়নি।" }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      segments,
      smsType: result.smsType,
      message: `SMS পাঠানো হয়েছে! ${segments}টি ${smsType === "masking" ? "Masking" : "Non-Masking"} ক্রেডিট কাটা হয়েছে।`,
    });
  } catch (e) {
    if (e instanceof InsufficientCreditsError) {
      return NextResponse.json(
        {
          error: e.message,
          code: "NO_CREDITS",
          smsType: e.smsType,
        },
        { status: 402 }
      );
    }
    if (e instanceof MaskingNotApprovedError) {
      return NextResponse.json({ error: e.message, code: "SENDER_ID_NOT_APPROVED" }, { status: 400 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "SMS পাঠানো যায়নি" },
      { status: 400 }
    );
  }
}
