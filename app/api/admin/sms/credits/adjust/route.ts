import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/sms/auth";
import { adjustCredits } from "@/lib/sms/credits";
import { parseSmsType } from "@/lib/sms/types";

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const userId = body.userId as string;
  const creditsAmount = parseInt(body.creditsAmount);
  const note = body.note as string;
  const smsType = parseSmsType(body.smsType);

  if (!userId || !Number.isFinite(creditsAmount) || creditsAmount === 0) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }
  if (!note?.trim()) {
    return NextResponse.json({ error: "Note required" }, { status: 400 });
  }

  try {
    await adjustCredits(userId, creditsAmount, note, authResult.userId, smsType);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Adjustment failed" },
      { status: 400 }
    );
  }
}
