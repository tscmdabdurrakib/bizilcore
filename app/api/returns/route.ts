import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "30");
  const search = searchParams.get("search") ?? "";

  const returns = await prisma.orderReturn.findMany({
    where: {
      userId: session.user.id,
      ...(search ? {
        OR: [
          { order: { customer: { name: { contains: search, mode: "insensitive" } } } },
          { reason: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    include: {
      order: {
        select: {
          id: true,
          totalAmount: true,
          customer: { select: { id: true, name: true, phone: true } },
        },
      },
      items: {
        include: { product: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  const total = await prisma.orderReturn.count({ where: { userId: session.user.id } });

  return NextResponse.json({ returns, total, page, pages: Math.ceil(total / limit) });
}
