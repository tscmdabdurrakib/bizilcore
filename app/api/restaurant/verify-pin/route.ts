import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json().catch(() => ({}));
  const pin: string = body.pin ?? "";

  if (!pin) return NextResponse.json({ error: "PIN প্রয়োজন" }, { status: 400 });

  const shopRecord = await prisma.shop.findUnique({
    where: { id: shop.id },
    select: { managerPin: true },
  });

  if (!shopRecord?.managerPin) {
    return NextResponse.json({ error: "Manager PIN সেট করা নেই। আগে সেটিংস থেকে PIN সেট করুন।" }, { status: 400 });
  }

  const ok = await bcrypt.compare(pin, shopRecord.managerPin);
  if (!ok) return NextResponse.json({ error: "ভুল PIN" }, { status: 401 });

  return NextResponse.json({ ok: true });
}
