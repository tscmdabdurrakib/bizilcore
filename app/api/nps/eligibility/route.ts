import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SURVEY_INTERVAL_DAYS = 90;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ eligible: false, reason: "unauthenticated" });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ eligible: false, reason: "no_user" });

  const last = await prisma.nPSSurvey.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const since = (last?.createdAt ?? user.createdAt).getTime();
  const days = Math.floor((Date.now() - since) / (1000 * 60 * 60 * 24));
  if (days < SURVEY_INTERVAL_DAYS) {
    return NextResponse.json({ eligible: false, reason: "too_recent", days });
  }

  return NextResponse.json({ eligible: true });
}
