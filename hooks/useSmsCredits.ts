"use client";

import { useCallback, useEffect, useState } from "react";
import type { SmsType } from "@/lib/sms/types";

interface BalanceData {
  balance: number;
  maskingBalance: number;
  nonMaskingBalance: number;
  isLow: boolean;
  isLowMasking: boolean;
  isLowNonMasking: boolean;
  lowCreditThreshold: number;
  pricePerSms: number;
  pricePerSmsMasking: number;
  pricePerSmsNonMasking: number;
  minPurchaseAmount: number;
  isSmsServiceActive: boolean;
  maskingEnabled: boolean;
  nonMaskingEnabled: boolean;
  senderIdStatus: string | null;
  senderId: string | null;
}

export function useSmsCredits() {
  const [data, setData] = useState<BalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/sms-credits/balance");
      if (!res.ok) throw new Error("Failed to fetch balance");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  const priceFor = (type: SmsType) =>
    type === "masking"
      ? (data?.pricePerSmsMasking ?? 0.35)
      : (data?.pricePerSmsNonMasking ?? data?.pricePerSms ?? 0.3);

  const balanceFor = (type: SmsType) =>
    type === "masking" ? (data?.maskingBalance ?? 0) : (data?.nonMaskingBalance ?? 0);

  return {
    balance: data?.balance ?? 0,
    maskingBalance: data?.maskingBalance ?? 0,
    nonMaskingBalance: data?.nonMaskingBalance ?? 0,
    isLow: data?.isLow ?? false,
    isLowMasking: data?.isLowMasking ?? false,
    isLowNonMasking: data?.isLowNonMasking ?? false,
    lowCreditThreshold: data?.lowCreditThreshold ?? 10,
    pricePerSms: data?.pricePerSms ?? 0.3,
    pricePerSmsMasking: data?.pricePerSmsMasking ?? 0.35,
    pricePerSmsNonMasking: data?.pricePerSmsNonMasking ?? 0.3,
    minPurchaseAmount: data?.minPurchaseAmount ?? 10,
    isSmsServiceActive: data?.isSmsServiceActive ?? true,
    maskingEnabled: data?.maskingEnabled ?? false,
    nonMaskingEnabled: data?.nonMaskingEnabled ?? true,
    senderIdStatus: data?.senderIdStatus ?? null,
    senderId: data?.senderId ?? null,
    priceFor,
    balanceFor,
    isLoading,
    error,
    refetch,
  };
}
