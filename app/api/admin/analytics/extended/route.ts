import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/auth";
import { SETUP_TASKS } from "@/lib/setupTasks";

export async function GET() {
  const authResult = await requireAdminRole("analytics");
  if ("error" in authResult) return authResult.error;

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    businessTypes,
    pricingConfigs,
    activeSubscriptions,
    usersWithProgress,
    smsRevenue,
    subRevenue,
    mrrTrendRaw,
  ] = await Promise.all([
    prisma.shop.groupBy({
      by: ["businessType"],
      _count: { id: true },
    }),
    prisma.pricingConfig.findMany({ select: { planKey: true, monthlyPrice: true } }),
    prisma.subscription.findMany({
      where: { plan: { in: ["pro", "business"] }, status: "active" },
      select: { plan: true },
    }),
    prisma.user.findMany({
      where: { isAdmin: false },
      select: { setupProgress: true, onboarded: true },
      take: 5000,
    }),
    prisma.smsCreditTransaction.aggregate({
      where: { transactionType: "purchase", paymentStatus: "completed" },
      _sum: { amountBdt: true },
    }),
    prisma.payment.aggregate({
      where: { status: { in: ["completed", "approved"] } },
      _sum: { amount: true },
    }),
    prisma.$queryRaw<{ period: Date; count: bigint; total: number }[]>`
      SELECT date_trunc('month', "createdAt") AS period, COUNT(*)::bigint AS count, COALESCE(SUM(amount), 0)::float AS total
      FROM "Payment"
      WHERE "createdAt" >= ${sixMonthsAgo}
        AND status IN ('completed', 'approved')
      GROUP BY period ORDER BY period ASC
    `,
  ]);

  const priceMap = Object.fromEntries(pricingConfigs.map((p) => [p.planKey, p.monthlyPrice]));
  const fallback = { pro: 199, business: 699 };

  let mrr = 0;
  for (const sub of activeSubscriptions) {
    mrr += priceMap[sub.plan] ?? fallback[sub.plan as keyof typeof fallback] ?? 0;
  }

  const funnel: Record<string, number> = {};
  for (const task of SETUP_TASKS) {
    funnel[task.key] = 0;
  }
  let onboardedCount = 0;
  for (const u of usersWithProgress) {
    if (u.onboarded) onboardedCount++;
    const progress = (u.setupProgress && typeof u.setupProgress === "object"
      ? u.setupProgress
      : {}) as Record<string, boolean>;
    for (const task of SETUP_TASKS) {
      if (progress[task.key]) funnel[task.key]++;
    }
  }

  const businessTypeAdoption = businessTypes
    .map((b) => ({
      type: b.businessType ?? "unknown",
      count: b._count.id,
    }))
    .sort((a, b) => b.count - a.count);

  const mrrTrend = mrrTrendRaw.map((r) => ({
    month: r.period.toISOString().slice(0, 7),
    revenue: Number(r.total),
    payments: Number(r.count),
  }));

  return NextResponse.json({
    mrr,
    activePaidUsers: activeSubscriptions.length,
    businessTypeAdoption,
    onboardingFunnel: {
      totalUsers: usersWithProgress.length,
      onboarded: onboardedCount,
      steps: SETUP_TASKS.map((t) => ({
        key: t.key,
        label: t.label,
        completed: funnel[t.key] ?? 0,
      })),
    },
    revenueSplit: {
      subscription: subRevenue._sum.amount ?? 0,
      sms: smsRevenue._sum.amountBdt ?? 0,
    },
    mrrTrend,
  });
}
