import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const body = await req.json();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, codRemitted: true },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const codRemitted = typeof body.codRemitted === "boolean" ? body.codRemitted : !order.codRemitted;
  let codRemittedAt: Date | null = null;
  if (codRemitted) {
    if (body.codRemittedAt) {
      const parsed = new Date(body.codRemittedAt);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Invalid codRemittedAt date" }, { status: 400 });
      }
      codRemittedAt = parsed;
    } else {
      codRemittedAt = new Date();
    }
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { codRemitted, codRemittedAt },
    select: { id: true, codRemitted: true, codRemittedAt: true },
  });

  return NextResponse.json(updated);
}
