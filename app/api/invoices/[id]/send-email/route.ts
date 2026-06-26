import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { getPublicInvoiceUrl } from "@/lib/invoices/utils";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const invoice = await prisma.invoice.findFirst({
    where: { id, shop: { userId: session.user.id } },
    include: {
      customer: true,
      shop: { select: { name: true, email: true } },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const toEmail = body.email as string | undefined;
  if (!toEmail) {
    return NextResponse.json({ error: "গ্রাহকের ইমেইল দিন" }, { status: 400 });
  }

  const publicUrl = getPublicInvoiceUrl(invoice.token);
  const dueText = invoice.dueDate
    ? `<p>পেমেন্ট ডেডলাইন: ${new Date(invoice.dueDate).toLocaleDateString("bn-BD")}</p>`
    : "";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#0F6E56">ইনভয়েস ${invoice.invoiceNumber}</h2>
      <p>প্রিয় ${invoice.customer?.name ?? "গ্রাহক"},</p>
      <p>${invoice.shop.name} থেকে আপনার ইনভয়েস:</p>
      <p style="font-size:24px;font-weight:bold;color:#0F6E56">৳${invoice.total.toLocaleString("bn-BD")}</p>
      ${dueText}
      <p><a href="${publicUrl}" style="display:inline-block;padding:12px 24px;background:#0F6E56;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">ইনভয়েস দেখুন</a></p>
      <p style="color:#666;font-size:12px">অথবা লিংক: ${publicUrl}</p>
    </div>
  `;

  try {
    await sendEmail("subscription", {
      to: toEmail,
      subject: `ইনভয়েস ${invoice.invoiceNumber} — ${invoice.shop.name}`,
      html,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "ইমেইল পাঠানো যায়নি" },
      { status: 400 }
    );
  }
}
