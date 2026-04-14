import { NextResponse } from "next/server";
import { clearCustomerCookie } from "@/lib/store-customer-auth";

export async function POST() {
  const cookie = clearCustomerCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookie.name, cookie.value, cookie.options as Parameters<typeof res.cookies.set>[2]);
  return res;
}
