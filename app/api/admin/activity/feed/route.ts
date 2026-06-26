import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/admin/auth";
import { fetchRecentLogs, formatActivityLog } from "@/lib/activity/adminQueries";

export async function GET(req: NextRequest) {
  const authResult = await requireAdminRole("system");
  if ("error" in authResult) return authResult.error;

  const sinceParam = req.nextUrl.searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : undefined;

  const logs = await fetchRecentLogs(50, since && !Number.isNaN(since.getTime()) ? since : undefined);

  return NextResponse.json({
    logs: logs.map(formatActivityLog),
  });
}
