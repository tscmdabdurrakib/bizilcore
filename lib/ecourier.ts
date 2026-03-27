const BASE_URL = "https://ecourier.com.bd/api";

export interface EcourierCreds {
  apiKey: string;
  apiSecret: string;
  ecUserId: string;
  pickupAddress?: string;
}

function authHeaders(creds: EcourierCreds) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "API-KEY": creds.apiKey,
    "API-SECRET": creds.apiSecret,
    "USER-ID": creds.ecUserId,
  };
}

export interface CourierInput {
  orderId: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  amountToCollect: number;
  itemCount?: number;
  weight?: number;
  note?: string;
}

export async function bookEcourierDelivery(input: CourierInput, creds?: EcourierCreds): Promise<string> {
  const resolvedCreds = creds ?? {
    apiKey: process.env.ECOURIER_API_KEY ?? "",
    apiSecret: process.env.ECOURIER_API_SECRET ?? "",
    ecUserId: process.env.ECOURIER_USER_ID ?? "",
    pickupAddress: process.env.ECOURIER_PICKUP_ADDRESS ?? "Dhaka",
  };

  if (!resolvedCreds.apiKey || !resolvedCreds.apiSecret || !resolvedCreds.ecUserId) {
    throw new Error("eCourier credentials not configured.");
  }

  const res = await fetch(`${BASE_URL}/booking-with-invoice`, {
    method: "POST",
    headers: authHeaders(resolvedCreds),
    body: JSON.stringify({
      invoice: input.orderId.slice(-12),
      product_title: `Order #${input.orderId.slice(-6).toUpperCase()}`,
      product_description: input.note ?? "",
      product_quantity: input.itemCount ?? 1,
      product_total_weight: input.weight ?? 0.5,
      charges: input.amountToCollect,
      payment_method: "COD",
      EC_pickup_address: resolvedCreds.pickupAddress ?? "Dhaka",
      EC_pickup_city: "Dhaka",
      EC_pickup_area: "Uttara",
      recipient_name: input.recipientName,
      recipient_mobile: input.recipientPhone,
      recipient_address: input.recipientAddress,
      recipient_city: "Dhaka",
      recipient_area: "Mirpur",
      delivery_type: "Home",
    }),
  });
  const data = await res.json();
  if (!data.tracking || data.status !== "success") {
    throw new Error(`eCourier booking failed: ${JSON.stringify(data)}`);
  }
  return String(data.tracking);
}

const ECOURIER_STATUS_MAP: Record<string, string> = {
  Pending: "booked",
  Pickup: "picked",
  "In Transit": "transit",
  Delivered: "delivered",
  "Return In Transit": "returned",
  Returned: "returned",
};

export async function getEcourierStatus(trackingId: string, creds?: EcourierCreds): Promise<string> {
  const resolvedCreds = creds ?? {
    apiKey: process.env.ECOURIER_API_KEY ?? "",
    apiSecret: process.env.ECOURIER_API_SECRET ?? "",
    ecUserId: process.env.ECOURIER_USER_ID ?? "",
  };

  if (!resolvedCreds.apiKey) throw new Error("eCourier credentials not configured.");
  const res = await fetch(
    `${BASE_URL}/track?tracking_id=${encodeURIComponent(trackingId)}`,
    { headers: authHeaders(resolvedCreds) }
  );
  const data = await res.json();
  const raw: string = data.current_status ?? "";
  return ECOURIER_STATUS_MAP[raw] ?? "booked";
}
