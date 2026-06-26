import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/sms/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const status = req.nextUrl.searchParams.get("status") ?? "";
  const type = req.nextUrl.searchParams.get("type") ?? "";
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = 50;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.paymentStatus = status;
  if (type) where.transactionType = type;

  const [transactions, total] = await Promise.all([
    prisma.smsCreditTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        discount: { select: { code: true } },
      },
    }),
    prisma.smsCreditTransaction.count({ where }),
  ]);

  return NextResponse.json({ transactions, total, page, pages: Math.ceil(total / limit) });
}
