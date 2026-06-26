import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/sms/auth";
import { getAdminOverview } from "@/lib/sms/credits";
import { checkSMSBalance } from "@/lib/sms";

export async function GET() {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const overview = await getAdminOverview();
  const platformKey = process.env.SMS_PLATFORM_API_KEY ?? "";
  let platformBalance: number | null | false = null;
  if (platformKey) {
    platformBalance = await checkSMSBalance(platformKey);
  }

  return NextResponse.json({ ...overview, platformBalance });
}
