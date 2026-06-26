/**
 * Reusable courier booking core — shared by the manual /api/courier route and
 * store-order auto-booking on confirm. Keeps booking logic in one place.
 */
import { prisma } from "@/lib/prisma";
import { bookPathaoDelivery, PathaoCreds } from "@/lib/pathao";
import { bookSteadfastDelivery, SteadfastCreds } from "@/lib/steadfast";
import { bookRedxDelivery, RedxCreds } from "@/lib/redx";

export const MANUAL_COURIERS = ["paperfly", "delivery_tiger", "other"];

export async function getUserPathaoCreds(userId: string): Promise<PathaoCreds | null> {
  const s = await prisma.pathaoSettings.findUnique({ where: { userId } });
  if (!s?.isConnected || !s.clientId || !s.clientSecret || !s.username || !s.password || !s.storeId) {
    return null;
  }
  return {
    clientId: s.clientId,
    clientSecret: s.clientSecret,
    username: s.username,
    password: s.password,
    storeId: parseInt(s.storeId, 10),
    sandboxMode: s.sandboxMode,
    defaultCityId: s.defaultCityId ?? 1,
    defaultZoneId: s.defaultZoneId ?? 1,
  };
}

export async function getUserRedxCreds(userId: string): Promise<RedxCreds | null> {
  const s = await prisma.redxSettings.findUnique({ where: { userId } });
  if (!s?.isConnected || !s.apiKey) return null;
  return { apiKey: s.apiKey };
}

export async function getUserSteadfastCreds(userId: string): Promise<SteadfastCreds | null> {
  const s = await prisma.steadfastSettings.findUnique({ where: { userId } });
  if (!s?.isConnected || !s.apiKey || !s.secretKey) return null;
  return { apiKey: s.apiKey, secretKey: s.secretKey };
}

export interface CourierBookingResult {
  trackingId: string;
  status: "booked" | "manual";
  courierName: string;
}

export class CourierBookingError extends Error {}

/**
 * Books (or records a manual tracking for) a courier delivery for an Order
 * owned by `userId`. Throws CourierBookingError with a user-facing message on
 * configuration/validation problems.
 */
export interface RecipientOverride {
  name?: string;
  phone?: string;
  address?: string;
}

export async function bookCourierForOrder(
  userId: string,
  orderId: string,
  courierName: string,
  manualTrackId?: string,
  recipient?: RecipientOverride,
): Promise<CourierBookingResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true, items: true },
  });
  if (!order || order.userId !== userId) {
    throw new CourierBookingError("Order not found");
  }
  if (order.courierTrackId) {
    throw new CourierBookingError("Courier already booked");
  }

  const input = {
    orderId,
    recipientName: recipient?.name ?? order.customer?.name ?? "Customer",
    recipientPhone: recipient?.phone ?? order.customer?.phone ?? "",
    recipientAddress: recipient?.address ?? order.customer?.address ?? "Dhaka",
    amountToCollect: order.dueAmount > 0 ? order.dueAmount : order.totalAmount,
    itemCount: order.items.reduce((s, it) => s + it.quantity, 0),
    note: order.note ?? undefined,
  };

  let trackingId: string;
  let isManual = false;

  if (courierName === "pathao") {
    const creds = await getUserPathaoCreds(userId);
    if (!creds) throw new CourierBookingError("Pathao সংযোগ করা নেই। Settings → কুরিয়ার থেকে API credentials সেট করুন।");
    trackingId = await bookPathaoDelivery(input, creds);
  } else if (courierName === "steadfast") {
    const creds = await getUserSteadfastCreds(userId);
    if (!creds) throw new CourierBookingError("Steadfast সংযোগ করা নেই। Settings → কুরিয়ার থেকে API credentials সেট করুন।");
    trackingId = await bookSteadfastDelivery(input, creds);
  } else if (courierName === "redx") {
    const creds = await getUserRedxCreds(userId);
    if (!creds) throw new CourierBookingError("RedX সংযোগ করা নেই। Settings → কুরিয়ার থেকে API Key সেট করুন।");
    trackingId = await bookRedxDelivery(input, creds);
  } else if (MANUAL_COURIERS.includes(courierName)) {
    if (!manualTrackId?.trim()) throw new CourierBookingError("Tracking ID দিন");
    trackingId = manualTrackId.trim();
    isManual = true;
  } else {
    throw new CourierBookingError("Unknown courier");
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

  return { trackingId, status: isManual ? "manual" : "booked", courierName };
}
