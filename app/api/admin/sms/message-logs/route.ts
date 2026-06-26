import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/auth";

export async function GET(req: NextRequest) {
  const authResult = await requireAdminRole("sms");
  if ("error" in authResult) return authResult.error;

  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? 1));
  const userId = req.nextUrl.searchParams.get("userId") ?? "";
  const limit = 30;
  const skip = (page - 1) * limit;

  const where = userId ? { userId } : {};

  const [logs, total] = await Promise.all([
    prisma.messageLog.findMany({
      where,
      orderBy: { sentAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.messageLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) });
}
