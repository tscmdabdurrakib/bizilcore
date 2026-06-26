import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/auth";

type RouteParams = { params: Promise<{ id: string }> };

const LOCK_TTL_MS = 5 * 60 * 1000;

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const { id: postId } = await params;
  const { action } = await req.json();

  if (action === "release") {
    await prisma.blogPostLock.deleteMany({ where: { postId, lockedById: auth.user.id } });
    return NextResponse.json({ locked: false });
  }

  const now = new Date();
  await prisma.blogPostLock.deleteMany({ where: { expiresAt: { lt: now } } });

  const existing = await prisma.blogPostLock.findUnique({
    where: { postId },
    include: { lockedBy: { select: { id: true, name: true } } },
  });

  if (existing && existing.lockedById !== auth.user.id && existing.expiresAt > now) {
    return NextResponse.json(
      { locked: true, lockedBy: existing.lockedBy, expiresAt: existing.expiresAt.toISOString() },
      { status: 423 }
    );
  }

  const expiresAt = new Date(now.getTime() + LOCK_TTL_MS);

  let lock;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      lock = await prisma.blogPostLock.upsert({
        where: { postId },
        create: {
          postId,
          lockedById: auth.user.id,
          expiresAt,
        },
        update: {
          lockedById: auth.user.id,
          expiresAt,
        },
        include: { lockedBy: { select: { id: true, name: true } } },
      });
      break;
    } catch {
      const retryCheck = await prisma.blogPostLock.findUnique({
        where: { postId },
        include: { lockedBy: { select: { id: true, name: true } } },
      });
      if (retryCheck && retryCheck.lockedById !== auth.user.id && retryCheck.expiresAt > now) {
        return NextResponse.json(
          {
            locked: true,
            lockedBy: retryCheck.lockedBy,
            expiresAt: retryCheck.expiresAt.toISOString(),
          },
          { status: 423 }
        );
      }
      if (attempt === 2) throw new Error("Failed to acquire edit lock");
    }
  }

  return NextResponse.json({ locked: true, lock });
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const { id: postId } = await params;
  const lock = await prisma.blogPostLock.findUnique({
    where: { postId },
    include: { lockedBy: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ lock });
}
