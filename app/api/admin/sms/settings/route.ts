import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/sms/auth";
import {
  getGlobalSmsSettings,
  updateGlobalSmsSettings,
  type UpdateGlobalSmsSettingsInput,
} from "@/lib/sms/credits";

export async function GET() {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const settings = await getGlobalSmsSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const body = (await req.json()) as UpdateGlobalSmsSettingsInput;

  try {
    const settings = await updateGlobalSmsSettings(body);
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Settings update failed" },
      { status: 400 }
    );
  }
}
