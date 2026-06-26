import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const form = await req.formData();
  const tranId = String(form.get("tran_id") || "");
  const status = String(form.get("status") || "");
  const valId = String(form.get("val_id") || "");
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") || "";

  if (tranId && (status === "VALID" || status === "success")) {
    await prisma.storeOrder.updateMany({
      where: { orderNumber: tranId },
      data: { paymentStatus: "paid", transactionId: valId || tranId, status: "confirmed" },
    });
  }

  const redirect = slug
    ? `/store/${slug}/order-success?order=${encodeURIComponent(tranId)}`
    : `/payment/success`;
  return NextResponse.redirect(new URL(redirect, req.url));
}

export async function GET(req: Request) {
  return POST(req);
}
