import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const category = searchParams.get("category") ?? null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { isActive: true };
  // Only filter by category if a specific category is requested
  // When no category (i.e. "সব"/"All" tab), show ALL active tips
  if (category) {
    where.category = category;
  }

  const tips = await prisma.communityTip.findMany({
    where,
    orderBy: { helpful: "desc" },
    take: limit,
  });

  const myReactions = await prisma.tipReaction.findMany({
    where: { userId: session.user.id, tipId: { in: tips.map(t => t.id) } },
  });
  const reactionMap = Object.fromEntries(myReactions.map(r => [r.tipId, r.reaction]));

  return NextResponse.json(tips.map(t => ({ ...t, myReaction: reactionMap[t.id] ?? null })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tipId, reaction } = await req.json();
  if (!tipId || !["helpful", "not_helpful"].includes(reaction)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const existing = await prisma.tipReaction.findUnique({
    where: { tipId_userId: { tipId, userId: session.user.id } },
  });

  if (existing) {
    if (existing.reaction === reaction) {
      await prisma.tipReaction.delete({ where: { tipId_userId: { tipId, userId: session.user.id } } });
      await prisma.communityTip.update({
        where: { id: tipId },
        data: { [reaction === "helpful" ? "helpful" : "notHelpful"]: { decrement: 1 } },
      });
    } else {
      await prisma.tipReaction.update({ where: { tipId_userId: { tipId, userId: session.user.id } }, data: { reaction } });
      await prisma.communityTip.update({
        where: { id: tipId },
        data: {
          helpful: { [reaction === "helpful" ? "increment" : "decrement"]: 1 },
          notHelpful: { [reaction === "not_helpful" ? "increment" : "decrement"]: 1 },
        },
      });
    }
  } else {
    await prisma.tipReaction.create({ data: { tipId, userId: session.user.id, reaction } });
    await prisma.communityTip.update({
      where: { id: tipId },
      data: { [reaction === "helpful" ? "helpful" : "notHelpful"]: { increment: 1 } },
    });
  }

  const updated = await prisma.communityTip.findUnique({ where: { id: tipId }, select: { helpful: true, notHelpful: true } });
  return NextResponse.json(updated);
}
