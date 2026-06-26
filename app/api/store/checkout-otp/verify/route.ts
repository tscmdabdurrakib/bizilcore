import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyGuestCheckoutOtp } from "@/lib/store/guest-otp";

export async function POST(req: Request) {
  const { slug, phone, otp } = await req.json();
  if (!slug || !phone || !otp) {
    return NextResponse.json({ error: "slug, phone, and otp required" }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({
    where: { storeSlug: slug },
    select: { id: true, storeEnabled: true },
  });
  if (!shop || !shop.storeEnabled) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  try {
    const result = await verifyGuestCheckoutOtp(shop.id, phone, otp);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
