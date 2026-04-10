import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId } = await req.json();
  if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });

  const existing = await prisma.communityLike.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
  });

  let liked: boolean;
  if (existing) {
    await prisma.communityLike.delete({ where: { id: existing.id } });
    liked = false;
  } else {
    await prisma.communityLike.create({ data: { postId, userId: session.user.id } });
    liked = true;
  }

  const count = await prisma.communityLike.count({ where: { postId } });
  return NextResponse.json({ liked, count });
}
