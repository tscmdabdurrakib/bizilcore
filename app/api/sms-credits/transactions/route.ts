import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/sms/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = 20;
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.smsCreditTransaction.findMany({
      where: { userId: authResult.userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { discount: { select: { code: true } } },
    }),
    prisma.smsCreditTransaction.count({ where: { userId: authResult.userId } }),
  ]);

  return NextResponse.json({ transactions, total, page, pages: Math.ceil(total / limit) });
}
