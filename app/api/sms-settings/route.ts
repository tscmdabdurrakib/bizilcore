import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/sms/auth";
import { getSmsAutoSettings, updateSmsAutoSettings } from "@/lib/sms/settings";

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const settings = await getSmsAutoSettings(authResult.userId);
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const settings = await updateSmsAutoSettings(authResult.userId, body);
  return NextResponse.json(settings);
}
