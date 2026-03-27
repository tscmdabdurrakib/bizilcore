const BKASH_BASE_URL = process.env.BKASH_BASE_URL ?? "https://tokenized.sandbox.bka.sh/v1.2.0-beta";
const APP_KEY = process.env.BKASH_APP_KEY ?? "";
const APP_SECRET = process.env.BKASH_APP_SECRET ?? "";
const USERNAME = process.env.BKASH_USERNAME ?? "";
const PASSWORD = process.env.BKASH_PASSWORD ?? "";

let bkashToken: string | null = null;
let tokenExpiry = 0;

async function getBkashToken(): Promise<string> {
  if (bkashToken && Date.now() < tokenExpiry) return bkashToken;

  const res = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/token/grant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      username: USERNAME,
      password: PASSWORD,
    },
    body: JSON.stringify({ app_key: APP_KEY, app_secret: APP_SECRET }),
  });

  if (!res.ok) throw new Error("bKash token grant failed");

  const data = await res.json();
  bkashToken = data.id_token;
  tokenExpiry = Date.now() + (data.expires_in ?? 3600) * 1000 - 60000;
  return bkashToken!;
}

export async function createBkashPayment(amount: number, merchantInvoiceNumber: string, callbackURL: string) {
  const token = await getBkashToken();
  const res = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: token,
      "x-app-key": APP_KEY,
    },
    body: JSON.stringify({
      mode: "0011",
      payerReference: merchantInvoiceNumber,
      callbackURL,
      amount: amount.toFixed(2),
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber,
    }),
  });

  if (!res.ok) throw new Error("bKash create payment failed");
  const data = await res.json();
  if (data.statusCode !== "0000") throw new Error(data.statusMessage ?? "bKash error");
  return { paymentID: data.paymentID, bkashURL: data.bkashURL };
}

export async function executeBkashPayment(paymentID: string) {
  const token = await getBkashToken();
  const res = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: token,
      "x-app-key": APP_KEY,
    },
    body: JSON.stringify({ paymentID }),
  });

  if (!res.ok) throw new Error("bKash execute payment failed");
  const data = await res.json();
  return data;
}
