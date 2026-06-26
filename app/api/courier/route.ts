import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPathaoStatus } from "@/lib/pathao";
import { getSteadfastStatus } from "@/lib/steadfast";
import { getRedxStatus } from "@/lib/redx";
import {
  bookCourierForOrder,
  CourierBookingError,
  getUserPathaoCreds,
  getUserRedxCreds,
  getUserSteadfastCreds,
} from "@/lib/courier-booking";
import { getPhoneRisk } from "@/lib/courier-fraud";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { orderId, courierName, manualTrackId, override } = body as {
    orderId: string;
    courierName: string;
    manualTrackId?: string;
    override?: boolean;
  };

  if (!orderId || !courierName) {
    return NextResponse.json({ error: "orderId and courierName required" }, { status: 400 });
  }

  // Block booking of high-risk COD orders unless they've been confirmed or the
  // merchant explicitly overrides. Best-effort: never blocks on lookup errors.
  if (!override) {
    try {
      const ord = await prisma.order.findFirst({
        where: { id: orderId, userId: session.user.id },
        select: { confirmStatus: true, customer: { select: { phone: true, shopId: true } } },
      });
      const phone = ord?.customer?.phone;
      const shopId = ord?.customer?.shopId;
      if (ord && phone && shopId && ord.confirmStatus !== "confirmed") {
        const risk = await getPhoneRisk(shopId, phone);
        if (risk.level === "red") {
          return NextResponse.json(
            {
              error: "এই কাস্টমারের ডেলিভারি ঝুঁকি বেশি। বুকিংয়ের আগে কনফার্ম করুন।",
              needsConfirm: true,
              risk,
            },
            { status: 409 },
          );
        }
      }
    } catch {
      /* risk gate is advisory only */
    }
  }

  try {
    const result = await bookCourierForOrder(session.user.id, orderId, courierName, manualTrackId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof CourierBookingError) {
      const notFound = err.message === "Order not found";
      return NextResponse.json({ error: err.message }, { status: notFound ? 404 : 400 });
    }
    const message = err instanceof Error ? err.message : "Courier booking failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true, courierName: true, courierTrackId: true },
  });

  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (!order.courierTrackId || !order.courierName) {
    return NextResponse.json({ error: "No courier booked" }, { status: 400 });
  }

  try {
    let status: string;

    if (order.courierName === "pathao") {
      const creds = await getUserPathaoCreds(session.user.id);
      if (!creds) throw new Error("Pathao credentials not configured");
      status = await getPathaoStatus(order.courierTrackId, creds);

    } else if (order.courierName === "steadfast") {
      const creds = await getUserSteadfastCreds(session.user.id);
      if (!creds) throw new Error("Steadfast credentials not configured");
      status = await getSteadfastStatus(order.courierTrackId, creds);

    } else if (order.courierName === "redx") {
      const creds = await getUserRedxCreds(session.user.id);
      if (!creds) throw new Error("RedX credentials not configured");
      status = await getRedxStatus(order.courierTrackId, creds);

    } else {
      status = "manual_tracking";
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { courierStatus: status },
    });

    return NextResponse.json({ status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Status check failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
