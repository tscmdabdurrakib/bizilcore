import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptToken, sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, shop: { userId: session.user.id } },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      items: true,
      shop: { select: { name: true, phone: true } },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!invoice.customer?.phone) return NextResponse.json({ error: "কাস্টমারের ফোন নম্বর নেই" }, { status: 400 });

  const wa = await prisma.whatsAppSettings.findUnique({ where: { userId: session.user.id } });
  if (!wa?.isConnected || !wa.apiToken || !wa.phoneNumberId) {
    return NextResponse.json({ error: "WhatsApp সংযুক্ত নেই। Settings এ যান।" }, { status: 400 });
  }

  const itemsText = invoice.items
    .map((item) => `• ${item.description} × ${item.quantity} = ৳${item.subtotal.toLocaleString("bn-BD")}`)
    .join("\n");

  const dueDateText = invoice.dueDate
    ? `\n🗓️ পেমেন্ট ডেডলাইন: ${new Date(invoice.dueDate).toLocaleDateString("bn-BD")}`
    : "";

  const discountText = invoice.discount > 0 ? `\nছাড়: - ৳${invoice.discount.toLocaleString("bn-BD")}` : "";

  const message = `🧾 ইনভয়েস: ${invoice.invoiceNumber}
📅 তারিখ: ${new Date(invoice.createdAt).toLocaleDateString("bn-BD")}

আইটেম সমূহ:
${itemsText}
━━━━━━━━━━━━━━━
সাবটোটাল: ৳${invoice.subtotal.toLocaleString("bn-BD")}${discountText}
💰 মোট দেনা: ৳${invoice.total.toLocaleString("bn-BD")}${dueDateText}

ধন্যবাদ! — ${invoice.shop.name}`;

  const token = decryptToken(wa.apiToken);
  const result = await sendWhatsAppMessage(token, wa.phoneNumberId, invoice.customer.phone, message);

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "মেসেজ পাঠানো যায়নি" }, { status: 400 });
  }

  await prisma.messageLog.create({
    data: {
      userId: session.user.id,
      customerId: invoice.customer.id,
      toPhone: invoice.customer.phone,
      message,
      status: "sent",
    },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
