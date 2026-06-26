const ZINIPAY_BASE_URL = "https://api.zinipay.com/v1/trx";

export interface ZiniPayVerifyData {
  id: number;
  trxID: string;
  smsRef?: string;
  amount: number;
  sender: string;
  status: string;
  provider: string;
  timestamp: string;
}

export interface ZiniPayConfirmData {
  id: number;
  provider: string;
  message: string;
  transactionId: string;
  senderNumber: string;
  amount: number;
  timestamp: string;
  status: boolean;
}

export interface ZiniPayResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

export class ZiniPayError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
    public readonly userMessage?: string,
  ) {
    super(message);
    this.name = "ZiniPayError";
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  INSUFFICIENT_CREDITS: "ZiniPay verification credits শেষ। Admin-কে জানান।",
  CREDITS_EXPIRED: "ZiniPay credits মেয়াদ শেষ। Admin-কে জানান।",
  FEATURE_DISABLED: "ZiniPay verification API enable করা নেই।",
};

function mapErrorMessage(statusCode: number, message: string, code?: string): string {
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  if (statusCode === 400 && message.includes("amount")) {
    return "Transaction amount মিলছে না। সঠিক পরিমাণ পাঠিয়েছেন কিনা দেখুন।";
  }
  if (statusCode === 400 && message.includes("already used")) {
    return "এই Transaction ID আগেই ব্যবহার হয়েছে।";
  }
  if (statusCode === 404) return "Transaction পাওয়া যায়নি। TxID সঠিক কিনা দেখুন।";
  if (statusCode === 403) return "ZiniPay device/service সংযুক্ত নেই।";
  return message || "Payment verification ব্যর্থ হয়েছে।";
}

async function zinipayRequest<T>(
  apiKey: string,
  endpoint: "verify" | "confirm",
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${ZINIPAY_BASE_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "zinipay-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  let json: ZiniPayResponse<T> & { code?: string };
  try {
    json = await res.json();
  } catch {
    throw new ZiniPayError("ZiniPay response parse failed", res.status);
  }

  if (!res.ok || !json.success) {
    const userMessage = mapErrorMessage(res.status, json.message ?? "", json.code);
    throw new ZiniPayError(json.message ?? "ZiniPay request failed", res.status, json.code, userMessage);
  }

  return json.data;
}

export async function verifyTransaction(
  apiKey: string,
  params: { transactionId?: string; smsRef?: string; amount: number },
): Promise<ZiniPayVerifyData> {
  const body: Record<string, unknown> = { amount: params.amount };
  if (params.transactionId) body.transactionId = params.transactionId;
  else if (params.smsRef) body.smsRef = params.smsRef;
  else throw new ZiniPayError("transactionId or smsRef required", 400);

  return zinipayRequest<ZiniPayVerifyData>(apiKey, "verify", body);
}

export async function confirmTransaction(
  apiKey: string,
  params: { transactionId: string; amount: number; id: number; invoiceId?: string },
): Promise<ZiniPayConfirmData> {
  const body: Record<string, unknown> = {
    transactionId: params.transactionId,
    amount: params.amount,
    id: params.id,
  };
  if (params.invoiceId) body.invoiceId = params.invoiceId;
  return zinipayRequest<ZiniPayConfirmData>(apiKey, "confirm", body);
}

export function isZiniPayEnabled(): boolean {
  if (process.env.ZINIPAY_ENABLED === "false") return false;
  return Boolean(process.env.ZINIPAY_API_KEY?.trim());
}

export function getPlatformZiniPayApiKey(): string | null {
  const key = process.env.ZINIPAY_API_KEY?.trim();
  if (!key || !isZiniPayEnabled()) return null;
  return key;
}

export function getPaymentNumbers() {
  return {
    bkash: process.env.ZINIPAY_BKASH_NUMBER?.trim() || "",
    nagad: process.env.ZINIPAY_NAGAD_NUMBER?.trim() || "",
    rocket: process.env.ZINIPAY_ROCKET_NUMBER?.trim() || "",
  };
}
