import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { activityInclude } from "@/lib/activity/adminQueries";

export async function GET(req: NextRequest) {
  const authResult = await requireAdminRole("system");
  if ("error" in authResult) return authResult.error;

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const logs = await prisma.userActivityLog.findMany({
    where: { userId },
    include: activityInclude,
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const header = ["created_at", "action_type", "action_label", "page_path", "shop", "duration_seconds"];
  const rows = logs.map((log) =>
    [
      log.createdAt.toISOString(),
      log.actionType,
      (log.actionLabel ?? "").replace(/"/g, '""'),
      log.pagePath ?? "",
      log.shop?.name ?? "",
      log.durationSeconds ?? "",
    ]
      .map((v) => `"${String(v)}"`)
      .join(","),
  );

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="activity-${userId}.csv"`,
    },
  });
}
