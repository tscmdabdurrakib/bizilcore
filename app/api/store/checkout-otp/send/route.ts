import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendGuestCheckoutOtp } from "@/lib/store/guest-otp";

export async function POST(req: Request) {
  const { slug, phone } = await req.json();
  if (!slug || !phone) {
    return NextResponse.json({ error: "slug and phone required" }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({
    where: { storeSlug: slug },
    select: { id: true, storeEnabled: true, storeCheckoutOtpEnabled: true, userId: true },
  });
  if (!shop || !shop.storeEnabled) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }
  if (!shop.storeCheckoutOtpEnabled) {
    return NextResponse.json({ error: "Guest OTP disabled" }, { status: 400 });
  }

  try {
    const result = await sendGuestCheckoutOtp(shop.id, phone, shop.userId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
