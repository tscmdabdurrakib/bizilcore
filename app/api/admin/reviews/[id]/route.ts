import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isAdmin: true } });
  return user?.isAdmin ? session.user.id : null;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (typeof body.isApproved === "boolean") data.isApproved = body.isApproved;
  if (typeof body.showOnSite === "boolean") data.showOnSite = body.showOnSite;
  // Showing on site requires approval first
  if (data.showOnSite === true) data.isApproved = true;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "কোনো পরিবর্তন নেই" }, { status: 400 });
  }

  const review = await prisma.appReview.update({
    where: { id },
    data,
  });
  return NextResponse.json(review);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  await prisma.appReview.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
