import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
  const plan = (sub?.plan ?? "free") as string;

  if (!["pro", "business"].includes(plan)) {
    return NextResponse.json({ error: "Pro plan required", locked: true }, { status: 403 });
  }

  const affiliate = await prisma.affiliate.findUnique({
    where: { userId: session.user.id },
    include: {
      clicks: {
        orderBy: { createdAt: "desc" },
        take: 90,
      },
      payouts: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!affiliate) return NextResponse.json({ affiliate: null });

  // Build daily click analytics (last 30 days)
  const last30 = new Date();
  last30.setDate(last30.getDate() - 29);
  const dailyMap: Record<string, { clicks: number; signups: number; earnings: number }> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    dailyMap[key] = { clicks: 0, signups: 0, earnings: 0 };
  }
  for (const c of affiliate.clicks) {
    const key = c.createdAt.toISOString().slice(0, 10);
    if (dailyMap[key]) {
      dailyMap[key].clicks++;
      if (c.converted) { dailyMap[key].signups++; dailyMap[key].earnings += c.commission ?? 0; }
    }
  }
  const dailyStats = Object.entries(dailyMap).map(([date, v]) => ({ date, ...v }));

  // Commission info
  const commissionRates = { pro: 50, business: 150 };

  return NextResponse.json({
    affiliate: {
      ...affiliate,
      clicks: undefined,
      payouts: affiliate.payouts,
    },
    dailyStats,
    commissionRates,
    recentConversions: affiliate.clicks
      .filter(c => c.converted)
      .slice(0, 10)
      .map(c => ({ plan: c.plan, commission: c.commission, date: c.createdAt })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
  const plan = (sub?.plan ?? "free") as string;

  if (!["pro", "business"].includes(plan)) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const body = await req.json();

  // Request payout
  if (body.action === "requestPayout") {
    const affiliate = await prisma.affiliate.findUnique({ where: { userId: session.user.id } });
    if (!affiliate) return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    if (affiliate.status !== "approved") return NextResponse.json({ error: "Account not approved" }, { status: 400 });
    if (affiliate.pendingPayout < 500) return NextResponse.json({ error: "Minimum ৳৫০০ pending থাকতে হবে" }, { status: 400 });
    if (!affiliate.bkashNumber) return NextResponse.json({ error: "bKash নম্বর দিন" }, { status: 400 });

    const payout = await prisma.affiliatePayout.create({
      data: {
        affiliateId: affiliate.id,
        amount: affiliate.pendingPayout,
        bkashNumber: affiliate.bkashNumber!,
        status: "requested",
      },
    });

    return NextResponse.json({ payout });
  }

  // Apply as new affiliate
  const existing = await prisma.affiliate.findUnique({ where: { userId: session.user.id } });
  if (existing) return NextResponse.json({ error: "Already applied" }, { status: 409 });

  const { bkashNumber } = body;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } });
  const baseSlug = (user?.name ?? "aff").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "aff";
  let slug = baseSlug + Math.floor(100 + Math.random() * 900);
  for (let i = 0; i < 10; i++) {
    const exists = await prisma.affiliate.findUnique({ where: { slug } });
    if (!exists) break;
    slug = baseSlug + Math.floor(100 + Math.random() * 900);
  }

  const affiliate = await prisma.affiliate.create({
    data: { userId: session.user.id, slug, bkashNumber: bkashNumber || null, status: "pending" },
  });

  return NextResponse.json({ affiliate }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bkashNumber } = await req.json();
  if (!bkashNumber?.trim()) return NextResponse.json({ error: "bKash নম্বর দিন" }, { status: 400 });

  const affiliate = await prisma.affiliate.findUnique({ where: { userId: session.user.id } });
  if (!affiliate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.affiliate.update({
    where: { userId: session.user.id },
    data: { bkashNumber: bkashNumber.trim() },
  });

  return NextResponse.json(updated);
}
