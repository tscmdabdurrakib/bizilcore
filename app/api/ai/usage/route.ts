import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAIUsageStats } from "@/lib/ai-limiter";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await prisma.subscription.findUnique({ where: { userId: session.user.id }, select: { plan: true, status: true } });
  const plan = (sub?.status === "active" && sub.plan) ? sub.plan : "free";
  const stats = await getAIUsageStats(session.user.id, plan);

  return NextResponse.json({ ...stats, plan });
}
