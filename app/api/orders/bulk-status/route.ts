import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids, status } = await req.json();
  if (!ids?.length || !status) return NextResponse.json({ error: "ids and status required" }, { status: 400 });

  const result = await prisma.order.updateMany({
    where: { id: { in: ids }, userId: session.user.id },
    data: { status },
  });

  return NextResponse.json({ updated: result.count });
}
