import { NextRequest, NextResponse } from "next/server";
import { sendContactNotificationEmail, sendContactConfirmationEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, topic, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "নাম, ইমেইল ও মেসেজ আবশ্যক" }, { status: 400 });
    }

    sendContactNotificationEmail({ name, email, phone, topic, message }).catch((err) => {
      console.error("[Contact] Owner notification email failed:", err);
    });

    sendContactConfirmationEmail(email, name, topic).catch((err) => {
      console.error("[Contact] Sender confirmation email failed:", err);
    });

    return NextResponse.json({
      success: true,
      message: "আপনার বার্তা সফলভাবে পাঠানো হয়েছে। শীঘ্রই যোগাযোগ করা হবে।",
    });
  } catch {
    return NextResponse.json({ error: "সার্ভার সমস্যা" }, { status: 500 });
  }
}
