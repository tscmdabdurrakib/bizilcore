import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/auth";

export async function GET(req: NextRequest) {
  const authResult = await requireAdminRole("feedback");
  if ("error" in authResult) return authResult.error;

  const status = req.nextUrl.searchParams.get("status") ?? "all";
  const where = status !== "all" ? { status } : {};

  const feedbacks = await prisma.userFeedback.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          shop: { select: { id: true, name: true } },
        },
      },
    },
  });

  const counts = await prisma.userFeedback.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  return NextResponse.json({
    items: feedbacks,
    counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])),
  });
}
