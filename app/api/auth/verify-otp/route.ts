import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) return NextResponse.json({ error: "তথ্য অসম্পূর্ণ" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "অ্যাকাউন্ট পাওয়া যায়নি" }, { status: 404 });

    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: "ইতিমধ্যে verified" });
    }

    if (!user.verifyToken || user.verifyToken !== otp.trim()) {
      return NextResponse.json({ error: "কোডটি সঠিক নয়" }, { status: 400 });
    }

    if (user.verifyTokenExpiry && user.verifyTokenExpiry < new Date()) {
      return NextResponse.json({ error: "কোডটির মেয়াদ শেষ হয়ে গেছে। নতুন কোড নিন।" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verifyToken: null, verifyTokenExpiry: null },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[verify-otp]", err);
    return NextResponse.json({ error: "কিছু একটা সমস্যা হয়েছে" }, { status: 500 });
  }
}
