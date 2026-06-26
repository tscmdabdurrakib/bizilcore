"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { useSmsCredits } from "@/hooks/useSmsCredits";

export default function SmsCreditsHeaderBadge() {
  const {
    maskingBalance,
    nonMaskingBalance,
    maskingEnabled,
    isLoading,
    isLowMasking,
    isLowNonMasking,
  } = useSmsCredits();

  if (isLoading) {
    return (
      <div className="h-8 w-28 rounded-full animate-pulse" style={{ backgroundColor: "var(--c-bg)" }} />
    );
  }

  const balance = maskingEnabled ? null : nonMaskingBalance;
  const maskingZero = maskingBalance === 0;
  const nonMaskingZero = nonMaskingBalance === 0;
  const maskingCritical = maskingBalance > 0 && maskingBalance < 5;
  const nonMaskingCritical = nonMaskingBalance > 0 && nonMaskingBalance < 5;

  const anyCritical = maskingEnabled
    ? maskingZero || nonMaskingZero || maskingCritical || nonMaskingCritical
    : nonMaskingZero || nonMaskingCritical;
  const anyLow = maskingEnabled ? isLowMasking || isLowNonMasking : isLowNonMasking;

  let bg = "var(--bg-success-soft)";
  let color = "var(--bg-success-text)";
  let border = "var(--bg-success-border, #BBF7D0)";

  if (anyCritical) {
    bg = "var(--bg-danger-soft)";
    color = "var(--bg-danger-text)";
    border = "var(--bg-danger-border, #FECACA)";
  } else if (anyLow) {
    bg = "var(--bg-warning-soft)";
    color = "var(--bg-warning-text)";
    border = "var(--bg-warning-border, #FDE68A)";
  }

  const tooltip = maskingEnabled
    ? "M = Masking SMS (ব্র্যান্ড নাম দেখাবে) · NM = Non-Masking SMS (সাধারণ নম্বর দেখাবে)"
    : "SMS Credit ব্যালেন্স";

  return (
    <Link
      href="/billing#sms-credits"
      title={tooltip}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 relative"
      style={{ backgroundColor: bg, color, border: `1px solid ${border}` }}
    >
      <MessageSquare size={13} />
      {maskingEnabled ? (
        <span className="flex items-center gap-1">
          <span title="Masking SMS">M {maskingBalance}</span>
          <span className="opacity-50">·</span>
          <span title="Non-Masking SMS">NM {nonMaskingBalance}</span>
        </span>
      ) : (
        <span>{balance} SMS</span>
      )}
      {anyLow && <span className="opacity-80">· কিনুন</span>}
      {anyCritical && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      )}
    </Link>
  );
}
