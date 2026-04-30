import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();
  const { amount } = body;

  if (!amount || Number(amount) <= 0) {
    return NextResponse.json({ error: "বৈধ পরিমাণ আবশ্যক" }, { status: 400 });
  }

  const jobCard = await prisma.jobCard.findFirst({ where: { id, shopId: shop.id } });
  if (!jobCard) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const paid = Number(amount);
  const newAdvance = jobCard.advancePaid + paid;
  const newDue = Math.max(0, jobCard.totalAmount - newAdvance);

  const updated = await prisma.jobCard.update({
    where: { id },
    data: { advancePaid: newAdvance, dueAmount: newDue },
    include: {
      vehicle: { include: { customer: true } },
      parts: true,
      services: true,
    },
  });

  return NextResponse.json(updated);
}
