const STEADFAST_BASE = "https://portal.steadfast.com.bd/public/v1";

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
  "In_Review": "booked",
  "Pending": "in_transit",
  "Delivered_Collected": "delivered",
  "Partial_Delivered_Collected": "delivered",
  "Cancelled": "cancelled",
  "Hold": "in_transit",
  "In_Transit": "in_transit",
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
      invoice: `INV-${input.orderId.slice(-8).toUpperCase()}`,
      recipient_name: input.recipientName,
      recipient_phone: input.recipientPhone,
      recipient_address: input.recipientAddress,
      cod_amount: input.amountToCollect,
      note: input.note ?? "",
      item_description: "Order from BizilCore",
    }),
  });

  const data = await res.json();

  if (!res.ok || data.status !== 200) {
    throw new Error(
      data.message ?? data.errors?.join(", ") ?? "Steadfast booking failed",
    );
  }

  const trackingCode = data.consignment?.tracking_code;
  if (!trackingCode) throw new Error("Steadfast: tracking_code missing in response");
  return trackingCode as string;
}

export async function getSteadfastStatus(
  trackingCode: string,
  creds: SteadfastCreds,
): Promise<string> {
  const res = await fetch(
    `${STEADFAST_BASE}/status_by_trackingcode/${encodeURIComponent(trackingCode)}`,
    {
      headers: {
        "Api-Key": creds.apiKey,
        "Secret-Key": creds.secretKey,
      },
    },
  );

  const data = await res.json();
  if (!res.ok || data.status !== 200) {
    throw new Error(data.message ?? "Steadfast status check failed");
  }

  const rawStatus = (data.delivery_status as string) ?? "";
  return STATUS_MAP[rawStatus] ?? "in_transit";
}
