import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/auth";

type RouteParams = { params: Promise<{ id: string }> };

/** Presence polling placeholder — returns admins who recently locked/viewed */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRole("blog");
  if ("error" in auth) return auth.error;

  const { id: postId } = await params;

  const lock = await prisma.blogPostLock.findUnique({
    where: { postId },
    include: { lockedBy: { select: { id: true, name: true } } },
  });

  const viewers = lock && lock.expiresAt > new Date()
    ? [{ id: lock.lockedBy.id, name: lock.lockedBy.name, role: "editing" as const }]
    : [{ id: auth.user.id, name: auth.user.name ?? "Admin", role: "viewing" as const }];

  return NextResponse.json({ viewers, currentUserId: auth.user.id });
}
