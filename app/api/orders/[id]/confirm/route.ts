import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppOrderConfirmation } from "@/lib/social/whatsapp-notify";
import { sendPlatformSMS } from "@/lib/sms/send";

/**
 * Send a COD confirmation message to the customer (WhatsApp + SMS, best-effort)
 * and mark the order as confirmed so courier booking can proceed.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true, name: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: { customer: { select: { name: true, phone: true } } },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const phone = order.customer?.phone?.trim();
  if (!phone) return NextResponse.json({ error: "কাস্টমারের ফোন নম্বর নেই" }, { status: 400 });

  let custom: string | undefined;
  try {
    const body = await req.json();
    custom = typeof body?.message === "string" ? body.message : undefined;
  } catch {
    /* no body */
  }

  const amount = Math.round(order.totalAmount);
  const message =
    custom ??
    `আসসালামু আলাইকুম! ${shop.name} থেকে আপনার অর্ডার (৳${amount}, ক্যাশ অন ডেলিভারি) নিশ্চিত করতে চাই। অর্ডারটি ঠিক থাকলে "হ্যাঁ" লিখে জানান। ধন্যবাদ।`;

  // Fire both channels best-effort.
  const wa = await sendWhatsAppOrderConfirmation({ userId: session.user.id, toPhone: phone, message }).catch(() => false);

  let sms = false;
  try {
    const result = await sendPlatformSMS(session.user.id, phone, message, {
      customerId: order.customerId ?? undefined,
    });
    sms = result.success;
  } catch {
    sms = false;
  }

  const anySent = wa || sms;

  const updated = await prisma.order.update({
    where: { id },
    data: {
      confirmStatus: anySent ? "confirmed" : "failed",
      confirmedAt: anySent ? new Date() : null,
    },
    select: { id: true, confirmStatus: true, confirmedAt: true },
  });

  return NextResponse.json({
    ...updated,
    channels: { whatsapp: wa, sms },
    sent: anySent,
  });
}
