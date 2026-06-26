import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole, logAdminAction } from "@/lib/admin/auth";

export async function GET(req: NextRequest) {
  const authResult = await requireAdminRole("referrals");
  if ("error" in authResult) return authResult.error;

  const filter = req.nextUrl.searchParams.get("filter") ?? "all";

  const referrals = await prisma.referral.findMany({
    where: filter === "pending" ? { rewardGiven: false } : filter === "rewarded" ? { rewardGiven: true } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      referrer: { select: { id: true, name: true, email: true, subscription: { select: { plan: true } } } },
      referred: { select: { id: true, name: true, email: true, createdAt: true } },
    },
  });

  const leaderboard = await prisma.referralCode.findMany({
    orderBy: { uses: "desc" },
    take: 20,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  const [totalReferrals, pendingRewards, rewardedCount, totalCodes] = await Promise.all([
    prisma.referral.count(),
    prisma.referral.count({ where: { rewardGiven: false } }),
    prisma.referral.count({ where: { rewardGiven: true } }),
    prisma.referralCode.count(),
  ]);

  return NextResponse.json({
    referrals,
    leaderboard,
    stats: { totalReferrals, pendingRewards, rewardedCount, totalCodes },
  });
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireAdminRole("referrals");
  if ("error" in authResult) return authResult.error;

  const { referralId, rewardGiven } = await req.json();
  if (!referralId) return NextResponse.json({ error: "referralId required" }, { status: 400 });

  const updated = await prisma.referral.update({
    where: { id: referralId },
    data: { rewardGiven: !!rewardGiven },
  });

  await logAdminAction(authResult.user.id, "referral.reward_update", "referral", referralId, { rewardGiven });

  return NextResponse.json(updated);
}
