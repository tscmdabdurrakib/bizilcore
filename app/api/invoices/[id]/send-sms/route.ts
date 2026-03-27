import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptApiKey, sendSMS } from "@/lib/sms";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, shop: { userId: session.user.id } },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      shop: { select: { name: true } },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!invoice.customer?.phone) return NextResponse.json({ error: "কাস্টমারের ফোন নম্বর নেই" }, { status: 400 });

  const smsSettings = await prisma.smsSettings.findUnique({ where: { userId: session.user.id } });
  if (!smsSettings?.isConnected || !smsSettings?.apiKey) {
    return NextResponse.json({ error: "SMS সংযুক্ত নেই। Settings এ যান।" }, { status: 400 });
  }

  const dueDateText = invoice.dueDate
    ? ` পেমেন্ট ডেডলাইন: ${new Date(invoice.dueDate).toLocaleDateString("bn-BD")}.`
    : "";

  const message = `${invoice.invoiceNumber}: ৳${invoice.total.toLocaleString("bn-BD")} পেমেন্ট বাকি আছে।${dueDateText} - ${invoice.shop.name}`;

  const apiKey = decryptApiKey(smsSettings.apiKey);
  const success = await sendSMS(apiKey, invoice.customer.phone, message);

  if (!success) {
    return NextResponse.json({ error: "SMS পাঠানো যায়নি" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
