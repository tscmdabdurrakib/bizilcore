import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNewsletterWelcome } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "সঠিক ইমেইল দিন" }, { status: 400 });
    }

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      if (existing.status === "active") {
        return NextResponse.json({ message: "আপনি ইতিমধ্যে subscribe করেছেন" }, { status: 200 });
      }
      await prisma.newsletterSubscriber.update({ where: { email }, data: { status: "active" } });
      return NextResponse.json({ message: "আপনাকে আবার স্বাগতম!" });
    }

    await prisma.newsletterSubscriber.create({ data: { email } });

    try {
      await sendNewsletterWelcome(email);
    } catch {
      // email sending failure shouldn't block subscription
    }

    return NextResponse.json({ message: "সফলভাবে subscribe হয়েছে!" });
  } catch {
    return NextResponse.json({ error: "কিছু একটা সমস্যা হয়েছে" }, { status: 500 });
  }
}
