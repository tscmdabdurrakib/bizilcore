import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PATHAO_STATUS_MAP: Record<string, string> = {
  Pending: "booked",
  "On process": "booked",
  "Thana Received": "picked",
  Sorting: "transit",
  "Delivery Man Assigned": "transit",
  Transit: "transit",
  Delivered: "delivered",
  Return: "returned",
  "Return Assigned to Merchant": "returned",
};

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("[Pathao Webhook]", JSON.stringify(payload, null, 2));

    const consignmentId = payload.consignment_id ?? payload.order_id;
    const rawStatus: string = payload.order_status ?? "";

    if (consignmentId) {
      const order = await prisma.order.findFirst({
        where: { courierTrackId: String(consignmentId) },
      });

      if (order) {
        const mapped = PATHAO_STATUS_MAP[rawStatus] ?? order.courierStatus;
        await prisma.order.update({
          where: { id: order.id },
          data: { courierStatus: mapped },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Pathao Webhook Error]", err);
    return NextResponse.json({ received: true });
  }
}
