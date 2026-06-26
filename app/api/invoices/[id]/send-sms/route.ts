import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPublicInvoiceUrl } from "@/lib/invoices/utils";
import { sendPlatformSMS, InsufficientCreditsError } from "@/lib/sms/send";

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

  const dueDateText = invoice.dueDate
    ? ` পেমেন্ট ডেডলাইন: ${new Date(invoice.dueDate).toLocaleDateString("bn-BD")}.`
    : "";

  const publicUrl = getPublicInvoiceUrl(invoice.token);
  const message = `${invoice.invoiceNumber}: ৳${invoice.total.toLocaleString("bn-BD")} পেমেন্ট বাকি।${dueDateText} লিংক: ${publicUrl} - ${invoice.shop.name}`;

  try {
    const result = await sendPlatformSMS(
      session.user.id,
      invoice.customer.phone,
      message,
      { customerId: invoice.customer.id }
    );

    if (!result.success) {
      return NextResponse.json({ error: "SMS পাঠানো যায়নি" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof InsufficientCreditsError) {
      return NextResponse.json({ error: "ক্রেডিট শেষ! SMS পাঠানো যাচ্ছে না।", code: "NO_CREDITS" }, { status: 402 });
    }
    return NextResponse.json({ error: "SMS পাঠানো যায়নি" }, { status: 400 });
  }
}
