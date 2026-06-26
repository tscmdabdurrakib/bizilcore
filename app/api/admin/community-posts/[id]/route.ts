import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole, logAdminAction } from "@/lib/admin/auth";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminRole("community");
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const post = await prisma.communityPost.findUnique({ where: { id }, select: { userId: true } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.communityPost.delete({ where: { id } });
  await logAdminAction(authResult.user.id, "community.delete_post", "communityPost", id, { userId: post.userId });

  return NextResponse.json({ success: true });
}
