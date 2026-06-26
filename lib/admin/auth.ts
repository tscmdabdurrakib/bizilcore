import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

export type AdminRole = "super" | "support" | "billing" | "content";

const ROLE_PERMISSIONS: Record<string, AdminRole[]> = {
  users: ["super", "support"],
  shops: ["super", "support"],
  impersonate: ["super", "support"],
  payments: ["super", "billing"],
  pricing: ["super", "billing"],
  promo: ["super", "billing"],
  affiliates: ["super", "billing"],
  sms: ["super", "billing"],
  newsletter: ["super", "content"],
  tips: ["super", "content"],
  reviews: ["super", "content"],
  feedback: ["super", "support"],
  nps: ["super", "support"],
  community: ["super", "content"],
  blog: ["super", "content"],
  fraud: ["super", "support"],
  referrals: ["super", "billing"],
  system: ["super"],
  analytics: ["super", "support", "billing"],
  cron: ["super"],
};

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, adminRole: true, id: true, name: true },
  });

  if (!user?.isAdmin) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };

  const role: AdminRole = (user.adminRole as AdminRole) ?? "super";
  return { session, user, role };
}

export function hasPermission(role: AdminRole, permission: keyof typeof ROLE_PERMISSIONS): boolean {
  return ROLE_PERMISSIONS[permission]?.includes(role) ?? false;
}

export async function requireAdminRole(permission: keyof typeof ROLE_PERMISSIONS) {
  const result = await requireAdmin();
  if ("error" in result) return result;
  if (!hasPermission(result.role, permission)) {
    return { error: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }) };
  }
  return result;
}

export async function logAdminAction(
  adminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await prisma.adminAuditLog.create({
      data: { adminId, action, targetType, targetId, metadata: metadata as Prisma.InputJsonValue | undefined },
    });
  } catch {
    // non-blocking
  }
}
