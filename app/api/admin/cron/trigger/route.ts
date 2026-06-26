import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole, logAdminAction } from "@/lib/admin/auth";
import { getCronSecret } from "@/lib/cron-auth";

const ALLOWED_JOBS = [
  "check-subscriptions",
  "referrer-rewards",
  "refresh-social-tokens",
  "abandoned-cart",
  "publish-posts",
  "daily-backup",
  "invoice-overdue",
  "recurring-invoices",
  "recurring-expenses",
  "po-reminders",
  "sms-drip",
];

export async function POST(req: NextRequest) {
  const authResult = await requireAdminRole("cron");
  if ("error" in authResult) return authResult.error;

  const { jobName } = await req.json();
  if (!jobName || !ALLOWED_JOBS.includes(jobName)) {
    return NextResponse.json({ error: "Invalid job name" }, { status: 400 });
  }

  const secret = getCronSecret();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const base = new URL(req.url).origin;

  const cronRes = await fetch(`${base}/api/cron/${jobName}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });

  let result: unknown;
  try {
    result = await cronRes.json();
  } catch {
    result = { error: "Invalid response" };
  }

  const log = await prisma.cronRunLog.create({
    data: {
      jobName,
      result: result as object,
      triggeredBy: authResult.user.id,
    },
  });

  await logAdminAction(authResult.user.id, "cron.run", "cron", jobName, { result, ok: cronRes.ok });

  if (!cronRes.ok) {
    return NextResponse.json({ error: "Cron job failed", result, logId: log.id }, { status: 500 });
  }

  return NextResponse.json({ success: true, result, logId: log.id, ranAt: log.ranAt });
}
