import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ECOURIER_STATUS_MAP: Record<string, string> = {
  Pending: "booked",
  Pickup: "picked",
  "In Transit": "transit",
  Delivered: "delivered",
  "Return In Transit": "returned",
  Returned: "returned",
};

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("[eCourier Webhook]", JSON.stringify(payload, null, 2));

    const trackingId = payload.tracking_id ?? payload.tracking;
    const rawStatus: string = payload.status ?? payload.current_status ?? "";

    if (trackingId) {
      const order = await prisma.order.findFirst({
        where: { courierTrackId: String(trackingId) },
      });

      if (order) {
        const mapped = ECOURIER_STATUS_MAP[rawStatus] ?? order.courierStatus;
        await prisma.order.update({
          where: { id: order.id },
          data: { courierStatus: mapped },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[eCourier Webhook Error]", err);
    return NextResponse.json({ received: true });
  }
}
