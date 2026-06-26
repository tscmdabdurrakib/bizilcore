import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/auth";

function npsCategory(score: number) {
  if (score >= 9) return "promoter";
  if (score >= 7) return "passive";
  return "detractor";
}

export async function GET() {
  const authResult = await requireAdminRole("nps");
  if ("error" in authResult) return authResult.error;

  const surveys = await prisma.nPSSurvey.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          shop: { select: { name: true, businessType: true } },
        },
      },
    },
  });

  const promoters = surveys.filter((s) => s.score >= 9).length;
  const passives = surveys.filter((s) => s.score >= 7 && s.score <= 8).length;
  const detractors = surveys.filter((s) => s.score <= 6).length;
  const total = surveys.length;
  const npsScore = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recent = surveys.filter((s) => s.createdAt >= thirtyDaysAgo);
  const recentPromoters = recent.filter((s) => s.score >= 9).length;
  const recentDetractors = recent.filter((s) => s.score <= 6).length;
  const recentNps = recent.length > 0
    ? Math.round(((recentPromoters - recentDetractors) / recent.length) * 100)
    : 0;

  const trendMap = new Map<string, { total: number; sum: number }>();
  for (const s of surveys) {
    const key = s.createdAt.toISOString().slice(0, 7);
    const entry = trendMap.get(key) ?? { total: 0, sum: 0 };
    entry.total += 1;
    entry.sum += s.score;
    trendMap.set(key, entry);
  }
  const trend = [...trendMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { total: count, sum }]) => ({
      month,
      avgScore: Math.round((sum / count) * 10) / 10,
      count,
    }));

  const lowScores = surveys
    .filter((s) => s.score <= 6)
    .slice(0, 20)
    .map((s) => ({
      id: s.id,
      score: s.score,
      reason: s.reason,
      createdAt: s.createdAt,
      user: s.user,
    }));

  return NextResponse.json({
    npsScore,
    recentNps,
    total,
    breakdown: { promoters, passives, detractors },
    trend,
    lowScores,
    recentSurveys: surveys.slice(0, 50).map((s) => ({
      ...s,
      category: npsCategory(s.score),
    })),
  });
}
