import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateCode(name: string): string {
  const base = name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "BIZ";
  const suffix = Math.floor(10 + Math.random() * 90).toString();
  return base + suffix;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let referralCode = await prisma.referralCode.findUnique({ where: { userId: session.user.id } });

  if (!referralCode) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } });
    let code = generateCode(user?.name ?? "BIZ");
    let attempts = 0;
    while (attempts < 10) {
      const exists = await prisma.referralCode.findUnique({ where: { code } });
      if (!exists) break;
      code = generateCode(user?.name ?? "BIZ");
      attempts++;
    }
    referralCode = await prisma.referralCode.create({
      data: { userId: session.user.id, code },
    });
  }

  const referrals = await prisma.referral.findMany({
    where: { referrerId: session.user.id },
    include: { referred: { select: { name: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    code: referralCode.code,
    uses: referralCode.uses,
    earnings: referralCode.earnings,
    referrals: referrals.map(r => ({
      name: r.referred.name,
      joinedAt: r.referred.createdAt,
      rewardGiven: r.rewardGiven,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

  const referralCode = await prisma.referralCode.findUnique({ where: { code } });
  if (!referralCode) return NextResponse.json({ valid: false, message: "কোডটি সঠিক নয়" });
  if (referralCode.userId === session.user.id) return NextResponse.json({ valid: false, message: "নিজের কোড ব্যবহার করা যাবে না" });

  return NextResponse.json({ valid: true, message: "আপনি ১ মাস Pro free পাবেন!" });
}
