import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { shopId, sessionId, eventType, productId, metadata } = body;
  if (!shopId || !sessionId || !eventType) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const allowed = ["visit", "product_view", "add_to_cart", "checkout_start", "purchase"];
  if (!allowed.includes(eventType)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }
  await prisma.storeFunnelEvent.create({
    data: {
      shopId,
      sessionId,
      eventType,
      productId: productId || null,
      metadata: metadata ?? undefined,
    },
  });
  return NextResponse.json({ ok: true });
}
