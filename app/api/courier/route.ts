import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bookPathaoDelivery, getPathaoStatus, PathaoCreds } from "@/lib/pathao";
import { bookEcourierDelivery, getEcourierStatus } from "@/lib/ecourier";
import { bookSteadfastDelivery, getSteadfastStatus, SteadfastCreds } from "@/lib/steadfast";
import { bookRedxDelivery, getRedxStatus, RedxCreds } from "@/lib/redx";

const MANUAL_COURIERS = ["sundarban", "paperfly", "carrybee", "delivery_tiger", "karatoa", "janani", "sheba", "sa_paribahan", "other"];

async function getUserPathaoCreds(userId: string): Promise<PathaoCreds | null> {
  const settings = await prisma.pathaoSettings.findUnique({ where: { userId } });
  if (!settings?.isConnected || !settings.clientId || !settings.clientSecret || !settings.username || !settings.password || !settings.storeId) {
    return null;
  }
  return {
    clientId: settings.clientId,
    clientSecret: settings.clientSecret,
    username: settings.username,
    password: settings.password,
    storeId: parseInt(settings.storeId, 10),
    sandboxMode: settings.sandboxMode,
  };
}

async function getUserSteadfastCreds(userId: string): Promise<SteadfastCreds | null> {
  const settings = await prisma.steadfastSettings.findUnique({ where: { userId } });
  if (!settings?.isConnected || !settings.apiKey || !settings.secretKey) return null;
  return { apiKey: settings.apiKey, secretKey: settings.secretKey };
}

async function getUserRedxCreds(userId: string): Promise<RedxCreds | null> {
  const settings = await prisma.redxSettings.findUnique({ where: { userId } });
  if (!settings?.isConnected || !settings.apiKey) return null;
  return { apiKey: settings.apiKey };
}

async function getUserEcourierCreds(userId: string): Promise<{ hasApi: boolean; creds?: import("@/lib/ecourier").EcourierCreds } | null> {
  const settings = await prisma.ecourierSettings.findUnique({ where: { userId } });
  if (!settings?.isConnected) return null;
  if (!settings.hasApi) return { hasApi: false };
  if (!settings.apiKey || !settings.apiSecret || !settings.ecUserId) return { hasApi: false };
  return {
    hasApi: true,
    creds: {
      apiKey: settings.apiKey,
      apiSecret: settings.apiSecret,
      ecUserId: settings.ecUserId,
      pickupAddress: settings.pickupAddress ?? undefined,
    },
  };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { orderId, courierName, manualTrackId } = body as {
    orderId: string;
    courierName: string;
    manualTrackId?: string;
  };

  if (!orderId || !courierName) {
    return NextResponse.json({ error: "orderId and courierName required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true, items: true },
  });

  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.courierTrackId) {
    return NextResponse.json({ error: "Courier already booked" }, { status: 400 });
  }

  const input = {
    orderId,
    recipientName: order.customer?.name ?? "Customer",
    recipientPhone: order.customer?.phone ?? "",
    recipientAddress: order.customer?.address ?? "Dhaka",
    amountToCollect: order.dueAmount > 0 ? order.dueAmount : order.totalAmount,
    itemCount: order.items.reduce((s, it) => s + it.quantity, 0),
    note: order.note ?? undefined,
  };

  try {
    let trackingId: string;
    let isManual = false;

    if (courierName === "pathao") {
      const creds = await getUserPathaoCreds(session.user.id);
      if (!creds) {
        return NextResponse.json({ error: "Pathao সংযোগ করা নেই। Settings → কুরিয়ার থেকে API credentials সেট করুন।" }, { status: 400 });
      }
      trackingId = await bookPathaoDelivery(input, creds);

    } else if (courierName === "ecourier") {
      const ecCreds = await getUserEcourierCreds(session.user.id);
      if (!ecCreds) {
        return NextResponse.json({ error: "eCourier সংযোগ করা নেই। Settings → কুরিয়ার থেকে সেটআপ করুন।" }, { status: 400 });
      }
      if (!ecCreds.hasApi) {
        if (!manualTrackId?.trim()) {
          return NextResponse.json({ error: "eCourier Tracking ID দিন (ID tracking mode)" }, { status: 400 });
        }
        trackingId = manualTrackId.trim();
        isManual = true;
      } else {
        trackingId = await bookEcourierDelivery(input, ecCreds.creds);
      }

    } else if (courierName === "steadfast") {
      const creds = await getUserSteadfastCreds(session.user.id);
      if (!creds) {
        return NextResponse.json({ error: "Steadfast সংযোগ করা নেই। Settings → কুরিয়ার থেকে API Key সেট করুন।" }, { status: 400 });
      }
      trackingId = await bookSteadfastDelivery(input, creds);

    } else if (courierName === "redx") {
      const creds = await getUserRedxCreds(session.user.id);
      if (!creds) {
        return NextResponse.json({ error: "RedX সংযোগ করা নেই। Settings → কুরিয়ার থেকে API Key সেট করুন।" }, { status: 400 });
      }
      trackingId = await bookRedxDelivery(input, creds);

    } else if (MANUAL_COURIERS.includes(courierName)) {
      if (!manualTrackId?.trim()) {
        return NextResponse.json({ error: "Tracking ID দিন" }, { status: 400 });
      }
      trackingId = manualTrackId.trim();
      isManual = true;

    } else {
      return NextResponse.json({ error: "Unknown courier" }, { status: 400 });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        courierName,
        courierTrackId: trackingId,
        courierStatus: isManual ? "manual" : "booked",
        courierBookedAt: new Date(),
        codStatus: "with_courier",
        status: "shipped",
      },
    });

    return NextResponse.json({ trackingId, status: isManual ? "manual" : "booked", courierName });
  } catch (err: unknown) {
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

    } else if (order.courierName === "ecourier") {
      const ecCreds = await getUserEcourierCreds(session.user.id);
      if (ecCreds?.hasApi && ecCreds.creds) {
        status = await getEcourierStatus(order.courierTrackId, ecCreds.creds);
      } else {
        status = "manual_tracking";
      }

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
