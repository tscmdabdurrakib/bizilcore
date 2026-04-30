const STEADFAST_BASE = "https://portal.steadfast.com.bd/api/v1";

export interface SteadfastCreds {
  apiKey: string;
  secretKey: string;
}

export interface SteadfastInput {
  orderId: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  amountToCollect: number;
  note?: string;
}

const STATUS_MAP: Record<string, string> = {
  pending: "booked",
  in_review: "booked",
  approved: "booked",
  picked_up: "picked",
  in_transit: "transit",
  delivered: "delivered",
  partial_delivered: "delivered",
  cancelled: "returned",
  returned: "returned",
  unknown: "booked",
};

export async function bookSteadfastDelivery(
  input: SteadfastInput,
  creds: SteadfastCreds,
): Promise<string> {
  const res = await fetch(`${STEADFAST_BASE}/create_order`, {
    method: "POST",
    headers: {
      "Api-Key": creds.apiKey,
      "Secret-Key": creds.secretKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      invoice: `INV-${input.orderId.slice(-10).toUpperCase()}`,
      recipient_name: input.recipientName,
      recipient_phone: input.recipientPhone,
      recipient_address: input.recipientAddress,
      cod_amount: input.amountToCollect,
      note: input.note ?? "",
    }),
  });

  const data = await res.json();

  if (!res.ok || data.status !== 200) {
    const msg =
      data.message ??
      (data.errors ? Object.values(data.errors).flat().join(", ") : null) ??
      "Steadfast booking failed";
    throw new Error(msg as string);
  }

  const trackingCode: string =
    data.consignment?.tracking_code ??
    data.tracking_code;
  if (!trackingCode) throw new Error("Steadfast: tracking_code missing in response");
  return trackingCode;
}

export async function getSteadfastStatus(
  trackingCode: string,
  creds: SteadfastCreds,
): Promise<string> {
  const res = await fetch(
    `${STEADFAST_BASE}/status_by_trackings`,
    {
      method: "POST",
      headers: {
        "Api-Key": creds.apiKey,
        "Secret-Key": creds.secretKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tracking_codes: [trackingCode] }),
    },
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "Steadfast status check failed");

  const delivery = Array.isArray(data.delivery_status)
    ? data.delivery_status[0]
    : null;
  const rawStatus: string = delivery?.delivery_status ?? "";
  return STATUS_MAP[rawStatus] ?? "booked";
}
