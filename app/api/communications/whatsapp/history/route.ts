import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;

  const [logs, total] = await Promise.all([
    prisma.messageLog.findMany({
      where: { userId: session.user.id },
      orderBy: { sentAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { customer: { select: { name: true } } },
    }),
    prisma.messageLog.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
}
