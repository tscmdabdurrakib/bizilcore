import {
  verifyTransaction,
  confirmTransaction,
  ZiniPayError,
  type ZiniPayVerifyData,
} from "@/lib/zinipay";

const PROVIDER_METHOD_MAP: Record<string, string[]> = {
  bkash: ["bkash", "bKash"],
  nagad: ["nagad", "Nagad"],
  rocket: ["rocket", "Rocket", "DBBL"],
};

export interface ZiniPayAttemptParams {
  transactionId: string;
  amount: number;
  invoiceId?: string;
  expectedMethod?: string;
}

export interface ZiniPayAttemptResult {
  success: boolean;
  verified: boolean;
  confirmed: boolean;
  transactionId?: string;
  senderNumber?: string;
  provider?: string;
  verifyId?: number;
  verifyData?: ZiniPayVerifyData;
  error?: string;
  fallbackReason?: string;
}

function providerMatchesMethod(provider: string, method?: string): boolean {
  if (!method) return true;
  const normalized = method.toLowerCase();
  const aliases = PROVIDER_METHOD_MAP[normalized];
  if (!aliases) return provider.toLowerCase().includes(normalized);
  return aliases.some((a) => provider.toLowerCase().includes(a.toLowerCase()));
}

export async function attemptZiniPayVerification(
  apiKey: string,
  params: ZiniPayAttemptParams,
): Promise<ZiniPayAttemptResult> {
  const trxId = params.transactionId.trim();
  if (!trxId) {
    return { success: false, verified: false, confirmed: false, error: "Transaction ID প্রয়োজন" };
  }

  try {
    const verifyData = await verifyTransaction(apiKey, {
      transactionId: trxId,
      amount: params.amount,
    });

    if (verifyData.amount !== params.amount) {
      return {
        success: false,
        verified: true,
        confirmed: false,
        verifyId: verifyData.id,
        verifyData,
        fallbackReason: "amount_mismatch",
        error: "Transaction amount মিলছে না।",
      };
    }

    if (params.expectedMethod && !providerMatchesMethod(verifyData.provider, params.expectedMethod)) {
      return {
        success: false,
        verified: true,
        confirmed: false,
        verifyId: verifyData.id,
        verifyData,
        fallbackReason: "provider_mismatch",
        error: `Payment provider (${verifyData.provider}) নির্বাচিত method (${params.expectedMethod}) এর সাথে মিলছে না।`,
      };
    }

    const confirmedTrxId = verifyData.trxID || trxId;

    try {
      const confirmData = await confirmTransaction(apiKey, {
        transactionId: confirmedTrxId,
        amount: params.amount,
        id: verifyData.id,
        invoiceId: params.invoiceId,
      });

      return {
        success: true,
        verified: true,
        confirmed: true,
        transactionId: confirmData.transactionId || confirmedTrxId,
        senderNumber: confirmData.senderNumber,
        provider: confirmData.provider || verifyData.provider,
        verifyId: verifyData.id,
        verifyData,
      };
    } catch (confirmErr) {
      const msg =
        confirmErr instanceof ZiniPayError
          ? confirmErr.userMessage ?? confirmErr.message
          : "Payment confirm ব্যর্থ হয়েছে।";
      console.error("[ZiniPay] Confirm failed:", confirmErr);
      return {
        success: false,
        verified: true,
        confirmed: false,
        verifyId: verifyData.id,
        verifyData,
        transactionId: confirmedTrxId,
        provider: verifyData.provider,
        fallbackReason: "confirm_failed",
        error: msg,
      };
    }
  } catch (verifyErr) {
    const msg =
      verifyErr instanceof ZiniPayError
        ? verifyErr.userMessage ?? verifyErr.message
        : "Payment verification ব্যর্থ হয়েছে।";
    console.error("[ZiniPay] Verify failed:", verifyErr);
    return {
      success: false,
      verified: false,
      confirmed: false,
      fallbackReason: "verify_failed",
      error: msg,
    };
  }
}
