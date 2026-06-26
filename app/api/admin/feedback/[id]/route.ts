import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole, logAdminAction } from "@/lib/admin/auth";

const VALID = ["new", "seen", "resolved"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminRole("feedback");
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const { status } = await req.json();

  if (!VALID.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.userFeedback.update({
    where: { id },
    data: { status },
  });

  await logAdminAction(authResult.user.id, "feedback.status", "feedback", id, { status });

  return NextResponse.json(updated);
}
