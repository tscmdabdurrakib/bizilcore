import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signCustomerToken, setCustomerCookie } from "@/lib/store-customer-auth";

export async function POST(req: NextRequest) {
  try {
    const { shopSlug, name, email, password } = await req.json();

    if (!shopSlug || !name || !email || !password)
      return NextResponse.json({ error: "সব তথ্য দিন।" }, { status: 400 });

    if (password.length < 6)
      return NextResponse.json({ error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" }, { status: 400 });

    const shop = await prisma.shop.findUnique({
      where: { storeSlug: shopSlug },
      select: { id: true, storeEnabled: true },
    });
    if (!shop || !shop.storeEnabled)
      return NextResponse.json({ error: "স্টোর পাওয়া যায়নি।" }, { status: 404 });

    const existing = await prisma.storeCustomer.findUnique({
      where: { shopId_email: { shopId: shop.id, email } },
    });
    if (existing)
      return NextResponse.json({ error: "এই ইমেইলে আগেই অ্যাকাউন্ট আছে।" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 10);
    const customer = await prisma.storeCustomer.create({
      data: { shopId: shop.id, name, email, password: hashed, emailVerified: true },
    });

    const token = await signCustomerToken({
      id: customer.id,
      shopId: shop.id,
      name: customer.name,
      email: customer.email,
      avatar: customer.avatar,
    });

    const { name: cname, value, options } = setCustomerCookie(token);
    const res = NextResponse.json({
      ok: true,
      customer: { id: customer.id, name: customer.name, email: customer.email, avatar: null },
    });
    res.cookies.set(cname, value, options as Parameters<typeof res.cookies.set>[2]);
    return res;
  } catch (e) {
    console.error("signup error", e);
    return NextResponse.json({ error: "সমস্যা হয়েছে। আবার চেষ্টা করুন।" }, { status: 500 });
  }
}
