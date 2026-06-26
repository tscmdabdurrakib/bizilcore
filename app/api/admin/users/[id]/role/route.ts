import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole, logAdminAction } from "@/lib/admin/auth";

const VALID_ROLES = ["super", "support", "billing", "content"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminRole("users");
  if ("error" in authResult) return authResult.error;
  if (authResult.role !== "super") {
    return NextResponse.json({ error: "Only super admins can set roles" }, { status: 403 });
  }

  const { id } = await params;
  const { adminRole } = await req.json();

  if (adminRole !== null && !VALID_ROLES.includes(adminRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      adminRole,
      isAdmin: adminRole !== null,
    },
    select: { id: true, adminRole: true, isAdmin: true },
  });

  await logAdminAction(authResult.user.id, "user.role_change", "user", id, { adminRole });

  return NextResponse.json(user);
}
