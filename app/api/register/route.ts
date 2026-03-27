import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendOTPVerificationEmail } from "@/lib/mailer";

const AFFILIATE_COMMISSION: Record<string, number> = { pro: 50, business: 150 };

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, shopName, referralCode, affiliateSlug } = body;

    if (!name || !email || !password || !shopName) {
      return NextResponse.json({ error: "সব তথ্য পূরণ করুন" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "এই ইমেইল দিয়ে আগেই একটি অ্যাকাউন্ট আছে" }, { status: 409 });
    }

    // --- Referral code lookup (gives 1 month Pro free) ---
    let referrerId: string | null = null;
    let referralCodeRecord: { id: string; userId: string } | null = null;

    if (referralCode) {
      referralCodeRecord = await prisma.referralCode.findUnique({ where: { code: referralCode.toUpperCase() } });
      if (referralCodeRecord) {
        referrerId = referralCodeRecord.userId;
      }
    }

    // --- Affiliate lookup (tracks conversion; commission on plan upgrade) ---
    let affiliateRecord: { id: string } | null = null;
    if (affiliateSlug) {
      affiliateRecord = await prisma.affiliate.findUnique({
        where: { slug: affiliateSlug },
        select: { id: true },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const proExpiry = referrerId ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;
    // If referred via referral code they get Pro; determine commission for affiliate
    const newPlan = proExpiry ? "pro" : "free";
    const affiliateCommission = affiliateRecord ? (AFFILIATE_COMMISSION[newPlan] ?? 0) : 0;

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          verifyToken: otp,
          verifyTokenExpiry: otpExpiry,
          shop: { create: { name: shopName } },
        },
      });

      if (proExpiry) {
        await tx.subscription.create({
          data: { userId: newUser.id, plan: "pro", status: "active", endDate: proExpiry },
        });
      }

      if (referrerId && referralCodeRecord) {
        await tx.referral.create({
          data: { referrerId, referredId: newUser.id, reward: "1_month_pro" },
        });
        await tx.referralCode.update({
          where: { id: referralCodeRecord.id },
          data: { uses: { increment: 1 } },
        });
      }

      // --- Track affiliate conversion ---
      if (affiliateRecord) {
        // Find the most recent unresolved click for this affiliate and mark it converted
        const latestClick = await tx.affiliateClick.findFirst({
          where: { affiliateId: affiliateRecord.id, converted: false, userId: null },
          orderBy: { createdAt: "desc" },
        });

        if (latestClick) {
          await tx.affiliateClick.update({
            where: { id: latestClick.id },
            data: {
              converted: true,
              userId: newUser.id,
              plan: newPlan,
              commission: affiliateCommission,
            },
          });
        } else {
          // No prior click (direct signup with slug typed manually), still record conversion
          await tx.affiliateClick.create({
            data: {
              affiliateId: affiliateRecord.id,
              userId: newUser.id,
              converted: true,
              plan: newPlan,
              commission: affiliateCommission,
            },
          });
        }

        // Update affiliate aggregate stats
        await tx.affiliate.update({
          where: { id: affiliateRecord.id },
          data: {
            totalSignups: { increment: 1 },
            totalEarnings: { increment: affiliateCommission },
            pendingPayout: { increment: affiliateCommission },
          },
        });
      }

      return newUser;
    });

    sendOTPVerificationEmail(user.email, user.name, otp).catch((err) => {
      console.error("[Register] OTP email failed:", err);
    });

    return NextResponse.json({ message: "অ্যাকাউন্ট তৈরি হয়েছে", userId: user.id }, { status: 201 });
  } catch (err) {
    console.error("[Register] Error:", err);
    return NextResponse.json({ error: "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।" }, { status: 500 });
  }
}
