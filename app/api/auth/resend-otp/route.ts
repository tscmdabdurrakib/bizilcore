import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOTPVerificationEmail } from "@/lib/mailer";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "ইমেইল দিন" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "অ্যাকাউন্ট পাওয়া যায়নি" }, { status: 404 });

    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: "ইতিমধ্যে verified" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { verifyToken: otp, verifyTokenExpiry: otpExpiry },
    });

    await sendOTPVerificationEmail(user.email, user.name, otp);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[resend-otp]", err);
    return NextResponse.json({ error: "কিছু একটা সমস্যা হয়েছে" }, { status: 500 });
  }
}
