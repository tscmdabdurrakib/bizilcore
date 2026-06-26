import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/auth";

export async function GET(req: NextRequest) {
  const authResult = await requireAdminRole("system");
  if ("error" in authResult) return authResult.error;

  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? 1));
  const limit = 30;
  const skip = (page - 1) * limit;

  try {
    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.adminAuditLog.count(),
    ]);
    return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ logs: [], total: 0, page: 1, pages: 0 });
  }
}
