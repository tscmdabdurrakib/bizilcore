import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const members = await prisma.staffMember.findMany({
    where: { shopId: shop.id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { invitedAt: "desc" },
  });

  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { email, role } = body;

  if (!email?.trim() || !["manager", "staff"].includes(role)) {
    return NextResponse.json({ error: "Email ও role দিন" }, { status: 400 });
  }

  // Check if user already exists
  let user = await prisma.user.findUnique({ where: { email: email.trim() } });

  // Check if already a staff member of this shop
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
    // Create placeholder user for the invite
    user = await prisma.user.create({
      data: {
        name: email.split("@")[0],
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
    },
    include: { user: { select: { name: true, email: true } } },
  });

  const inviteUrl = `${process.env.NEXTAUTH_URL ?? ""}/invite/${token}`;

  return NextResponse.json({ ...member, inviteUrl }, { status: 201 });
}
