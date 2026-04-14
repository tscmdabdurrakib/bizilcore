import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signCustomerToken, setCustomerCookie } from "@/lib/store-customer-auth";

export async function POST(req: NextRequest) {
  try {
    const { shopSlug, email, password } = await req.json();

    if (!shopSlug || !email || !password)
      return NextResponse.json({ error: "সব তথ্য দিন।" }, { status: 400 });

    const shop = await prisma.shop.findUnique({
      where: { storeSlug: shopSlug },
      select: { id: true, storeEnabled: true },
    });
    if (!shop || !shop.storeEnabled)
      return NextResponse.json({ error: "স্টোর পাওয়া যায়নি।" }, { status: 404 });

    const customer = await prisma.storeCustomer.findUnique({
      where: { shopId_email: { shopId: shop.id, email } },
    });
    if (!customer || !customer.password)
      return NextResponse.json({ error: "ইমেইল বা পাসওয়ার্ড ভুল।" }, { status: 401 });

    const valid = await bcrypt.compare(password, customer.password);
    if (!valid)
      return NextResponse.json({ error: "ইমেইল বা পাসওয়ার্ড ভুল।" }, { status: 401 });

    const token = await signCustomerToken({
      id: customer.id, shopId: shop.id,
      name: customer.name, email: customer.email, avatar: customer.avatar,
    });

    const cookie = setCustomerCookie(token);
    const res = NextResponse.json({
      ok: true, customer: { id: customer.id, name: customer.name, email: customer.email, avatar: customer.avatar },
    });
    res.cookies.set(cookie.name, cookie.value, cookie.options as Parameters<typeof res.cookies.set>[2]);
    return res;
  } catch (e) {
    console.error("signin error", e);
    return NextResponse.json({ error: "সমস্যা হয়েছে। আবার চেষ্টা করুন।" }, { status: 500 });
  }
}
