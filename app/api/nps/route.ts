import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SURVEY_INTERVAL_DAYS = 90;
const COOLDOWN_MS = SURVEY_INTERVAL_DAYS * 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const score = Number(body.score);
  if (!Number.isFinite(score) || score < 0 || score > 10) {
    return NextResponse.json({ error: "স্কোর ০–১০ এর মধ্যে হতে হবে" }, { status: 400 });
  }

  // Server-side cooldown enforcement (mirrors /api/nps/eligibility):
  // 90 days since last survey, or since signup if no prior survey.
  const [user, last] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { createdAt: true },
    }),
    prisma.nPSSurvey.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const since = (last?.createdAt ?? user.createdAt).getTime();
  if (Date.now() - since < COOLDOWN_MS) {
    return NextResponse.json(
      { error: "৯০ দিন পর আবার সার্ভে দিতে পারবেন" },
      { status: 429 },
    );
  }

  const survey = await prisma.nPSSurvey.create({
    data: {
      userId: session.user.id,
      score: Math.round(score),
      reason: body.reason ? String(body.reason).slice(0, 1000) : null,
    },
  });

  return NextResponse.json({ ok: true, id: survey.id }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  // Update reason for the latest NPS survey (after follow-up text)
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const reason = String(body.reason || "").slice(0, 1000);
  if (!reason) return NextResponse.json({ error: "মতামত দরকার" }, { status: 400 });

  const last = await prisma.nPSSurvey.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!last) return NextResponse.json({ error: "Survey not found" }, { status: 404 });

  await prisma.nPSSurvey.update({
    where: { id: last.id },
    data: { reason },
  });
  return NextResponse.json({ ok: true });
}
