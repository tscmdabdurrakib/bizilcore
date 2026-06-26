import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole, logAdminAction } from "@/lib/admin/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminRole("shops");
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const body = await req.json();
  const { shopStatus, statusReason } = body as { shopStatus: string; statusReason?: string };

  if (!["active", "suspended", "trial"].includes(shopStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const shop = await prisma.shop.update({
    where: { id },
    data: {
      shopStatus,
      statusReason: statusReason ?? null,
      suspendedAt: shopStatus === "suspended" ? new Date() : null,
      suspendedBy: shopStatus === "suspended" ? authResult.user.id : null,
    },
  });

  await logAdminAction(authResult.user.id, "shop.status_change", "shop", id, { shopStatus, statusReason });

  return NextResponse.json(shop);
}
