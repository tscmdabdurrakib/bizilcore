const REDX_BASE = "https://openapi.redx.com.bd/v1.0.0.beta";

export interface RedxCreds {
  apiKey: string;
}

export interface RedxInput {
  orderId: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  amountToCollect: number;
  note?: string;
}

const STATUS_MAP: Record<string, string> = {
  "Pending": "booked",
  "Picked": "in_transit",
  "In Transit": "in_transit",
  "Delivered": "delivered",
  "Cancelled": "cancelled",
  "Hold": "in_transit",
  "Return": "cancelled",
  "Return Collected": "cancelled",
  "Partial Delivered": "delivered",
};

export async function bookRedxDelivery(
  input: RedxInput,
  creds: RedxCreds,
): Promise<string> {
  const res = await fetch(`${REDX_BASE}/parcel`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${creds.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer_name: input.recipientName,
      customer_phone: input.recipientPhone,
      delivery_area: "Dhaka",
      delivery_area_id: 1,
      customer_address: input.recipientAddress,
      merchant_invoice_id: `INV-${input.orderId.slice(-8).toUpperCase()}`,
      cash_collection_amount: input.amountToCollect,
      parcel_weight: 0.5,
      instruction: input.note ?? "",
      value: 0,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg =
      data.message ??
      (Array.isArray(data.errors) ? data.errors.join(", ") : null) ??
      "RedX booking failed";
    throw new Error(msg as string);
  }

  const trackingId = data.tracking_id ?? data.parcel?.tracking_id;
  if (!trackingId) throw new Error("RedX: tracking_id missing in response");
  return trackingId as string;
}

export async function getRedxStatus(
  trackingId: string,
  creds: RedxCreds,
): Promise<string> {
  const res = await fetch(`${REDX_BASE}/parcel/info/${encodeURIComponent(trackingId)}`, {
    headers: {
      "Authorization": `Bearer ${creds.apiKey}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message ?? "RedX status check failed");
  }

  const rawStatus = (data.parcel?.status as string) ?? (data.status as string) ?? "";
  return STATUS_MAP[rawStatus] ?? "in_transit";
}
