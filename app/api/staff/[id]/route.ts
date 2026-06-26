import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { getShopForOwner } from "@/lib/hr/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const member = await prisma.staffMember.findFirst({
    where: { id, shopId: shop.id },
    include: { user: true },
  });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userUpdates: { name?: string; email?: string } = {};
  if (body.name?.trim()) userUpdates.name = body.name.trim();
  if (body.email?.trim() && !body.email.includes("@staff.bizilcore.local")) {
    userUpdates.email = body.email.trim();
  }

  if (Object.keys(userUpdates).length > 0) {
    await prisma.user.update({ where: { id: member.userId }, data: userUpdates });
  }

  let branchId: string | null | undefined = undefined;
  if (body.branchId !== undefined) {
    if (body.branchId === null || body.branchId === "") {
      branchId = null;
    } else {
      const branch = await prisma.shopBranch.findFirst({
        where: { id: body.branchId, shopId: shop.id },
      });
      if (!branch) return NextResponse.json({ error: "Invalid branch" }, { status: 400 });
      branchId = branch.id;
    }
  }

  const updated = await prisma.staffMember.update({
    where: { id },
    data: {
      role: body.role ?? member.role,
      isActive: body.isActive ?? member.isActive,
      salary: body.salary != null ? Number(body.salary) : member.salary,
      jobTitle: body.jobTitle !== undefined ? (body.jobTitle?.trim() || null) : member.jobTitle,
      phone: body.phone !== undefined ? (body.phone?.trim() || null) : member.phone,
      ...(branchId !== undefined ? { branchId } : {}),
    },
    include: {
      user: { select: { name: true, email: true } },
      branch: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  await prisma.staffMember.updateMany({
    where: { id, shopId: shop.id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}

/** Regenerate invite link for pending staff */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const member = await prisma.staffMember.findFirst({
    where: { id, shopId: shop.id, isActive: true },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (member.joinedAt) return NextResponse.json({ error: "Already joined" }, { status: 400 });

  const token = randomBytes(24).toString("hex");
  const updated = await prisma.staffMember.update({
    where: { id },
    data: { inviteToken: token },
    include: { user: { select: { name: true, email: true } } },
  });

  const inviteUrl = `${process.env.NEXTAUTH_URL ?? ""}/invite/${token}`;
  return NextResponse.json({ ...updated, inviteUrl });
}
