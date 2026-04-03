import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAccountStatusEmail } from "@/lib/mailer";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isAdmin: true } });
  return user?.isAdmin ? session.user.id : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { accountStatus, statusReason } = await req.json();

  const validStatuses = ["active", "disabled", "suspended"];
  if (!validStatuses.includes(accountStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { isAdmin: true, email: true, name: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.isAdmin) return NextResponse.json({ error: "Admin account cannot be modified" }, { status: 403 });

  const updated = await prisma.user.update({
    where: { id },
    data: {
      accountStatus,
      statusReason: accountStatus === "active" ? null : (statusReason ?? null),
      statusUpdatedAt: new Date(),
    },
  });

  // Send email notification (non-blocking)
  sendAccountStatusEmail({
    toEmail: target.email,
    userName: target.name,
    accountStatus,
    statusReason: statusReason ?? "",
  }).catch(() => {});

  return NextResponse.json({ success: true, accountStatus: updated.accountStatus });
}
