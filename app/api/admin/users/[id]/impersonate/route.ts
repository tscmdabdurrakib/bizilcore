import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole, logAdminAction } from "@/lib/admin/auth";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminRole("impersonate");
  if ("error" in authResult) return authResult.error;

  const { id: targetId } = await params;

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      name: true,
      email: true,
      isAdmin: true,
      onboarded: true,
      shop: { select: { id: true } },
    },
  });

  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.isAdmin) return NextResponse.json({ error: "Cannot impersonate admin users" }, { status: 403 });

  await logAdminAction(authResult.user.id, "impersonate.start", "user", targetId, { targetName: target.name });

  return NextResponse.json({
    impersonatingUserId: target.id,
    impersonatingUserName: target.name,
    onboarded: target.onboarded,
    activeShopId: target.shop?.id ?? null,
  });
}
