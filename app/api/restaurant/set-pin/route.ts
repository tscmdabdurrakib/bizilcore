import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json().catch(() => ({}));
  const pin: string = body.pin ?? "";

  if (!pin || pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
    return NextResponse.json({ error: "PIN অবশ্যই ৪-৬ সংখ্যার হতে হবে" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(pin, 10);
  await prisma.shop.update({ where: { id: shop.id }, data: { managerPin: hashed } });

  return NextResponse.json({ ok: true });
}
