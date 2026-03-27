import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const member = await prisma.staffMember.findUnique({
    where: { inviteToken: token },
    include: {
      shop: { select: { name: true, category: true } },
      user: { select: { name: true, email: true, password: true } },
    },
  });

  if (!member || !member.isActive) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
  }

  if (member.joinedAt) {
    return NextResponse.json({ error: "Invite already accepted" }, { status: 400 });
  }

  return NextResponse.json({
    shopName: member.shop.name,
    shopCategory: member.shop.category,
    role: member.role,
    email: member.user.email,
    hasPassword: !!member.user.password,
    token,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json();

  const member = await prisma.staffMember.findUnique({
    where: { inviteToken: token },
    include: { user: true },
  });

  if (!member || !member.isActive || member.joinedAt) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (body.name) updates.name = body.name;
  if (body.password) updates.password = await bcrypt.hash(body.password, 10);
  if (!member.user.onboarded) updates.onboarded = true;

  if (Object.keys(updates).length > 0) {
    await prisma.user.update({ where: { id: member.userId }, data: updates });
  }

  await prisma.staffMember.update({
    where: { id: member.id },
    data: { joinedAt: new Date() },
  });

  return NextResponse.json({ success: true, email: member.user.email });
}
