import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const transfers = await prisma.stockMovement.findMany({
    where: {
      userId: session.user.id,
      type: "branch_transfer",
    },
    include: {
      product: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ transfers });
}
