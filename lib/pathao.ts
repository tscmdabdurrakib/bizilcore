const PRODUCTION_URL = "https://hermes.pathao.com";
const SANDBOX_URL    = "https://hermes-sandbox.pathao.com";

export interface PathaoCreds {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  storeId: number;
  sandboxMode?: boolean;
}

function baseUrl(creds: PathaoCreds) {
  return creds.sandboxMode ? SANDBOX_URL : PRODUCTION_URL;
}

const tokenCacheMap = new Map<string, { token: string; expiresAt: number }>();

async function getToken(creds: PathaoCreds): Promise<string> {
  const cacheKey = `${creds.clientId}:${creds.sandboxMode ? "sandbox" : "prod"}`;
  const cached = tokenCacheMap.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) return cached.token;

  const url = `${baseUrl(creds)}/aladdin/api/v1/issue-token`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      username: creds.username,
      password: creds.password,
      grant_type: "password",
    }),
  });

  const data = await res.json();
  if (!data.access_token) {
    console.error("[Pathao] Token error:", JSON.stringify(data));
    throw new Error(
      data.message
        ? `Pathao auth failed: ${data.message}`
        : `Pathao auth failed: ${JSON.stringify(data)}`
    );
  }
  tokenCacheMap.set(cacheKey, {
    token: data.access_token,
    expiresAt: Date.now() + ((data.expires_in ?? 3600) - 60) * 1000,
  });
  return data.access_token;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("880") && digits.length === 13) return "0" + digits.slice(3);
  if (digits.startsWith("88") && digits.length === 12) return "0" + digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) return digits;
  if (digits.length === 10) return "0" + digits;
  return digits;
}

export interface CourierInput {
  orderId: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  amountToCollect: number;
  itemCount?: number;
  note?: string;
}

export async function bookPathaoDelivery(input: CourierInput, creds: PathaoCreds): Promise<string> {
  const token = await getToken(creds);
  const phone = normalizePhone(input.recipientPhone);

  const payload = {
    store_id: creds.storeId,
    merchant_order_id: input.orderId.slice(-20),
    recipient_name: input.recipientName || "Customer",
    recipient_phone: phone,
    recipient_address: input.recipientAddress || "Dhaka",
    recipient_city: 1,
    recipient_zone: 1,
    delivery_type: 48,
    item_type: 2,
    special_instruction: input.note ?? "",
    item_quantity: input.itemCount ?? 1,
    item_weight: 0.5,
    amount_to_collect: input.amountToCollect,
    item_description: `Order #${input.orderId.slice(-6).toUpperCase()}`,
  };

  const res = await fetch(`${baseUrl(creds)}/aladdin/api/v1/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!data.consignment_id) {
    console.error("[Pathao] Booking error:", JSON.stringify(data));
    const msg = data.message ?? (data.errors ? JSON.stringify(data.errors) : JSON.stringify(data));
    throw new Error(`Pathao booking failed: ${msg}`);
  }
  return String(data.consignment_id);
}

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

export async function getPathaoStatus(trackingId: string, creds: PathaoCreds): Promise<string> {
  const token = await getToken(creds);
  const res = await fetch(`${baseUrl(creds)}/aladdin/api/v1/orders/${trackingId}/info`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("[Pathao] Status error:", JSON.stringify(data));
  }
  const raw: string = data.order_status ?? "";
  return PATHAO_STATUS_MAP[raw] ?? "booked";
}
