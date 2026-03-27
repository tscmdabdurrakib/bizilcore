import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";
import { sendSMS, decryptApiKey } from "@/lib/sms";

const VALID_STATUSES = ["received", "cutting", "stitching", "finishing", "ready", "delivered"];

const NEXT_STATUS: Record<string, string | null> = {
  received:  "cutting",
  cutting:   "stitching",
  stitching: "finishing",
  finishing: "ready",
  ready:     "delivered",
  delivered: null,
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  if (shop.businessType !== "tailor") {
    return NextResponse.json({ error: "এই API শুধুমাত্র দর্জি শপের জন্য।" }, { status: 403 });
  }

  const order = await prisma.tailorOrder.findUnique({
    where: { id },
    include: { customer: { select: { id: true, name: true, phone: true } } },
  });

  if (!order || order.shopId !== shop.id) {
    return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি।" }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop, session } = await requireShop();
  const { id } = await params;

  if (shop.businessType !== "tailor") {
    return NextResponse.json({ error: "এই API শুধুমাত্র দর্জি শপের জন্য।" }, { status: 403 });
  }

  const order = await prisma.tailorOrder.findUnique({ where: { id } });
  if (!order || order.shopId !== shop.id) {
    return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি।" }, { status: 404 });
  }

  const body = await req.json();
  const { advanceNext, status, notes, dueAmount, deliveryDate } = body;

  let newStatus = status;

  if (advanceNext) {
    const next = NEXT_STATUS[order.status];
    if (!next) {
      return NextResponse.json({ error: "এই অর্ডার ইতিমধ্যে শেষ ধাপে আছে।" }, { status: 400 });
    }
    newStatus = next;
  }

  if (newStatus !== undefined) {
    if (!VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json({ error: "অবৈধ স্ট্যাটাস।" }, { status: 400 });
    }
    const currentIdx = VALID_STATUSES.indexOf(order.status);
    const newIdx = VALID_STATUSES.indexOf(newStatus);
    if (newIdx !== currentIdx + 1 && newIdx !== currentIdx) {
      return NextResponse.json(
        { error: `'${order.status}' থেকে '${newStatus}' তে সরাসরি যাওয়া সম্ভব নয়।` },
        { status: 400 }
      );
    }
  }

  let newDue = order.dueAmount;
  if (typeof dueAmount === "number" && Number.isFinite(dueAmount) && dueAmount >= 0) {
    newDue = dueAmount;
  }

  const updated = await prisma.tailorOrder.update({
    where: { id },
    data: {
      ...(newStatus !== undefined ? { status: newStatus } : {}),
      ...(notes !== undefined ? { notes: typeof notes === "string" ? notes.trim() || null : null } : {}),
      ...(typeof dueAmount === "number" && Number.isFinite(dueAmount) && dueAmount >= 0 ? { dueAmount: newDue } : {}),
      ...(deliveryDate !== undefined ? { deliveryDate: deliveryDate ? new Date(deliveryDate) : null } : {}),
    },
    include: { customer: { select: { id: true, name: true, phone: true } } },
  });

  if (newStatus === "ready" && order.status !== "ready" && !order.smsSent) {
    const phone = order.customerPhone ?? updated.customer?.phone;
    if (phone) {
      try {
        const smsSettings = await prisma.smsSettings.findUnique({ where: { userId: session.user.id } });
        if (smsSettings?.isConnected && smsSettings?.apiKey) {
          const apiKey = decryptApiKey(smsSettings.apiKey);
          const msg = `আপনার ${order.description} তৈরি হয়ে গেছে। যেকোনো দিন নিয়ে যেতে পারেন। - ${shop.name}`;
          sendSMS(apiKey, phone, msg).catch(() => {});
          await prisma.tailorOrder.update({ where: { id }, data: { smsSent: true } });
        }
      } catch { }
    }
  }

  return NextResponse.json(updated);
}
