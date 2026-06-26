import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/sms/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { userId } = await params;
  const body = await req.json();
  const action = body.action as "approve" | "reject";
  const adminNote = body.adminNote as string | undefined;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const existing = await prisma.smsSenderIdRequest.findUnique({ where: { userId } });
  if (!existing) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (action === "approve") {
    const duplicate = await prisma.smsSenderIdRequest.findFirst({
      where: {
        senderId: existing.senderId,
        userId: { not: userId },
        status: "approved",
      },
    });
    if (duplicate) {
      return NextResponse.json({ error: "Sender ID already approved for another user" }, { status: 400 });
    }
  }

  const updated = await prisma.smsSenderIdRequest.update({
    where: { userId },
    data: {
      status: action === "approve" ? "approved" : "rejected",
      adminNote: adminNote ?? null,
      reviewedBy: authResult.userId,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, request: updated });
}
