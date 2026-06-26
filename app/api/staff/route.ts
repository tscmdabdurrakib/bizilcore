import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { assertStaffLimit, getShopForOwner } from "@/lib/hr/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const members = await prisma.staffMember.findMany({
    where: { shopId: shop.id },
    include: {
      user: { select: { name: true, email: true } },
      branch: { select: { id: true, name: true } },
    },
    orderBy: { invitedAt: "desc" },
  });

  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const limitCheck = await assertStaffLimit(shop.id, session.user.id);
  if (!limitCheck.ok) return NextResponse.json({ error: limitCheck.error }, { status: 403 });

  const body = await req.json();
  const { email, role, name, phone, jobTitle, salary, quickAdd } = body;

  // Quick Add: name + phone without email invite
  if (quickAdd) {
    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "নাম ও ফোন দিন" }, { status: 400 });
    }
    const cleanPhone = phone.trim().replace(/\D/g, "");
    const placeholderEmail = `staff_${cleanPhone}@staff.bizilcore.local`;

    let user = await prisma.user.findUnique({ where: { email: placeholderEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: placeholderEmail,
          password: "",
          onboarded: false,
        },
      });
    }

    const existing = await prisma.staffMember.findFirst({
      where: { shopId: shop.id, userId: user.id, isActive: true },
    });
    if (existing) {
      return NextResponse.json({ error: "এই ফোন নম্বরে ইতিমধ্যে staff আছেন" }, { status: 400 });
    }

    const member = await prisma.staffMember.create({
      data: {
        shopId: shop.id,
        userId: user.id,
        role: role && ["manager", "staff"].includes(role) ? role : "staff",
        phone: phone.trim(),
        jobTitle: jobTitle?.trim() || null,
        salary: salary != null && salary !== "" ? Number(salary) : null,
      },
      include: { user: { select: { name: true, email: true } } },
    });

    return NextResponse.json(member, { status: 201 });
  }

  // Email invite
  if (!email?.trim() || !["manager", "staff"].includes(role)) {
    return NextResponse.json({ error: "Email ও role দিন" }, { status: 400 });
  }

  let user = await prisma.user.findUnique({ where: { email: email.trim() } });

  if (user) {
    const existing = await prisma.staffMember.findFirst({
      where: { shopId: shop.id, userId: user.id, isActive: true },
    });
    if (existing) {
      return NextResponse.json({ error: "এই user ইতিমধ্যে staff আছেন" }, { status: 400 });
    }
  }

  const token = randomBytes(24).toString("hex");

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: name?.trim() || email.split("@")[0],
        email: email.trim(),
        password: "",
        onboarded: false,
      },
    });
  }

  const member = await prisma.staffMember.create({
    data: {
      shopId: shop.id,
      userId: user.id,
      role,
      inviteToken: token,
      phone: phone?.trim() || null,
      jobTitle: jobTitle?.trim() || null,
      salary: salary != null && salary !== "" ? Number(salary) : null,
    },
    include: { user: { select: { name: true, email: true } } },
  });

  const inviteUrl = `${process.env.NEXTAUTH_URL ?? ""}/invite/${token}`;

  return NextResponse.json({ ...member, inviteUrl }, { status: 201 });
}
