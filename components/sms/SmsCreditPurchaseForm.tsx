"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Loader2, MessageSquare, CheckCircle, Info } from "lucide-react";
import { useSmsCredits } from "@/hooks/useSmsCredits";
import type { SmsType } from "@/lib/sms/types";

interface CalcResult {
  credits: number;
  finalAmount: number;
  originalAmount: number;
  discountAmount: number;
  bonusCredits: number;
  totalCredits: number;
  pricePerSms: number;
  smsType: SmsType;
}

const METHODS = [
  { id: "bkash", label: "bKash", color: "#C3115D" },
  { id: "nagad", label: "Nagad", color: "#E04F24" },
  { id: "bank", label: "Bank Transfer", color: "#0F6E56" },
  { id: "manual", label: "Manual", color: "#6B7280" },
];

const S = {
  primary: "var(--c-primary)",
  primaryLight: "var(--c-primary-light)",
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  textSub: "var(--c-text-sub)",
  textMuted: "var(--c-text-muted)",
  bg: "var(--c-bg)",
};

interface Props {
  onPurchaseComplete?: () => void;
}

export default function SmsCreditPurchaseForm({ onPurchaseComplete }: Props) {
  const {
    maskingBalance,
    nonMaskingBalance,
    minPurchaseAmount,
    refetch,
    isSmsServiceActive,
    maskingEnabled,
    nonMaskingEnabled,
    senderIdStatus,
    priceFor,
  } = useSmsCredits();

  const [smsType, setSmsType] = useState<SmsType>("non_masking");
  const pricePerSms = priceFor(smsType);

  const [smsQty, setSmsQty] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [method, setMethod] = useState("");
  const [txId, setTxId] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [calc, setCalc] = useState<CalcResult | null>(null);
  const [calcError, setCalcError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [autoVerified, setAutoVerified] = useState(false);
  const [error, setError] = useState("");

  const qtyNum = parseInt(smsQty, 10);
  const minSmsQty = Math.max(1, Math.ceil((minPurchaseAmount ?? 10) / pricePerSms));

  const previewBdt = useMemo(() => {
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) return null;
    return Math.round(qtyNum * pricePerSms * 100) / 100;
  }, [qtyNum, pricePerSms]);

  const runCalculate = useCallback(
    async (qty: string, code: string, pps: number, minBdt: number, type: SmsType) => {
      const n = parseInt(qty, 10);
      if (!Number.isFinite(n) || n <= 0) {
        setCalc(null);
        setCalcError("");
        return;
      }
      const amountBdt = Math.round(n * pps * 100) / 100;
      if (amountBdt < minBdt) {
        setCalc(null);
        setCalcError(`সর্বনিম্ন ৳${minBdt} (≈${Math.ceil(minBdt / pps)} SMS) কেনতে হবে`);
        return;
      }
      try {
        const res = await fetch("/api/sms-credits/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amountBdt, discountCode: code || undefined, smsType: type }),
        });
        const data = await res.json();
        if (!res.ok) {
          setCalcError(data.error ?? "Calculation failed");
          setCalc(null);
        } else {
          setCalc(data);
          setCalcError("");
        }
      } catch {
        setCalcError("গণনা ব্যর্থ");
      }
    },
    []
  );

  useEffect(() => {
    if (!maskingEnabled && smsType === "masking") {
      setSmsType("non_masking");
    }
  }, [maskingEnabled, smsType]);

  useEffect(() => {
    const t = setTimeout(
      () => runCalculate(smsQty, discountCode, pricePerSms, minPurchaseAmount ?? 10, smsType),
      400
    );
    return () => clearTimeout(t);
  }, [smsQty, discountCode, pricePerSms, minPurchaseAmount, smsType, runCalculate]);

  async function handlePurchase() {
    if (!method) { setError("পেমেন্ট পদ্ধতি নির্বাচন করুন"); return; }
    if (!txId.trim() && method !== "manual") { setError("Transaction ID দিন"); return; }
    if (!previewBdt) { setError("SMS পরিমাণ দিন"); return; }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/sms-credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountBdt: previewBdt,
          smsType,
          discountCode: discountCode || undefined,
          method,
          transactionId: txId,
          senderPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "ক্রয় ব্যর্থ");
      } else {
        setAutoVerified(Boolean(data.autoVerified));
        setDone(true);
        refetch();
        onPurchaseComplete?.();
      }
    } catch {
      setError("ক্রয় ব্যর্থ হয়েছে");
    } finally {
      setSubmitting(false);
    }
  }

  const maskingBlocked = !maskingEnabled || senderIdStatus !== "approved";

  if (!isSmsServiceActive) {
    return (
      <div className="p-6 rounded-2xl border text-center" style={{ borderColor: S.border, background: S.surface }}>
        <p className="text-sm font-medium" style={{ color: S.textSub }}>SMS সার্ভিস বর্তমানে বন্ধ আছে।</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="p-8 rounded-2xl border text-center" style={{ borderColor: S.border, background: S.surface }}>
        <CheckCircle size={40} className="mx-auto mb-3" style={{ color: S.primary }} />
        <p className="font-bold mb-1" style={{ color: S.text }}>
          {autoVerified ? "ক্রেডিট যোগ হয়েছে!" : "অর্ডার জমা হয়েছে!"}
        </p>
        <p className="text-sm" style={{ color: S.textMuted }}>
          {autoVerified
            ? `${maskingEnabled && smsType === "masking" ? "Masking" : ""} SMS credit আপনার account-এ যোগ হয়েছে।`
            : "পেমেন্ট verify হলে ক্রেডিট যোগ হবে। সাধারণত ১২–২৪ ঘণ্টার মধ্যে।"}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border, background: S.surface }}>
      <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${S.border}` }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: S.primaryLight }}>
          <MessageSquare size={16} style={{ color: S.primary }} />
        </div>
        <div>
          <h3 className="font-bold text-sm" style={{ color: S.text }}>SMS Credit কিনুন</h3>
          <p className="text-xs" style={{ color: S.textMuted }}>
            {maskingEnabled ? (
              <>
                Masking: <strong style={{ color: S.primary }}>{maskingBalance}</strong>
                {" · "}
                Non-Masking: <strong style={{ color: S.primary }}>{nonMaskingBalance}</strong>
              </>
            ) : (
              <>ব্যালেন্স: <strong style={{ color: S.primary }}>{nonMaskingBalance}</strong> SMS</>
            )}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {maskingEnabled && (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!nonMaskingEnabled}
            onClick={() => setSmsType("non_masking")}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all disabled:opacity-40"
            style={{
              borderColor: smsType === "non_masking" ? S.primary : S.border,
              background: smsType === "non_masking" ? S.primaryLight : S.bg,
              color: smsType === "non_masking" ? S.primary : S.textSub,
            }}
          >
            Non-Masking
            <span className="block text-[10px] font-normal mt-0.5">৳{priceFor("non_masking").toFixed(2)}/SMS</span>
          </button>
          <button
            type="button"
            disabled={maskingBlocked}
            onClick={() => setSmsType("masking")}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all disabled:opacity-40"
            style={{
              borderColor: smsType === "masking" ? S.primary : S.border,
              background: smsType === "masking" ? S.primaryLight : S.bg,
              color: smsType === "masking" ? S.primary : S.textSub,
            }}
          >
            Masking
            <span className="block text-[10px] font-normal mt-0.5">৳{priceFor("masking").toFixed(2)}/SMS</span>
          </button>
        </div>
        )}

        {maskingEnabled && maskingBlocked && smsType === "masking" && (
          <p className="text-xs text-amber-700 flex items-start gap-1">
            <Info size={12} className="mt-0.5 shrink-0" />
            Masking SMS কিনতে{" "}
            <Link href="/settings/sms" style={{ color: S.primary }}>Sender ID approve</Link> করুন।
          </p>
        )}

        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: S.textMuted }}>
            কতটি {maskingEnabled && smsType === "masking" ? "Masking" : ""} SMS কিনবেন? — সর্বনিম্ন {minSmsQty}টি
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={smsQty}
            onChange={(e) => setSmsQty(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="100"
            className="w-full px-4 py-2.5 rounded-xl border text-sm"
            style={{ borderColor: S.border, background: S.bg, color: S.text }}
          />
          {previewBdt !== null && (
            <p className="text-xs mt-1.5" style={{ color: S.textMuted }}>
              মোট পরিশোধ: <strong style={{ color: S.text }}>৳{previewBdt.toFixed(2)}</strong>
              <span className="mx-1">·</span>
              {qtyNum} × ৳{pricePerSms.toFixed(2)}
            </p>
          )}
          {calc && !calcError && (
            <p className="text-xs mt-1" style={{ color: S.primary }}>
              আপনি পাবেন: {calc.totalCredits} SMS credits
              {calc.bonusCredits > 0 && ` (+${calc.bonusCredits} বোনাস)`}
            </p>
          )}
          {calcError && <p className="text-xs mt-1 text-red-600">{calcError}</p>}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
            placeholder="ডিসকাউন্ট কোড (ঐচ্ছিক)"
            className="flex-1 px-4 py-2.5 rounded-xl border text-sm"
            style={{ borderColor: S.border, background: S.bg, color: S.text }}
          />
        </div>

        {calc && (
          <div className="rounded-xl p-4 space-y-2 text-sm" style={{ background: S.bg }}>
            <div className="flex justify-between"><span>মূল্য:</span><span>৳{calc.originalAmount.toFixed(2)}</span></div>
            {calc.discountAmount > 0 && (
              <div className="flex justify-between" style={{ color: "#16A34A" }}>
                <span>ডিসকাউন্ট:</span><span>-৳{calc.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {calc.bonusCredits > 0 && (
              <div className="flex justify-between" style={{ color: "#7C3AED" }}>
                <span>বোনাস ক্রেডিট:</span><span>+{calc.bonusCredits} SMS</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-2 border-t" style={{ borderColor: S.border }}>
              <span>মোট পরিশোধ:</span><span>৳{calc.finalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold" style={{ color: S.primary }}>
              <span>মোট ক্রেডিট:</span><span>{calc.totalCredits} SMS</span>
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: S.textMuted }}>পেমেন্ট পদ্ধতি:</p>
          <div className="flex flex-wrap gap-2">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className="px-4 py-2 rounded-xl text-xs font-bold border transition-all"
                style={{
                  borderColor: method === m.id ? m.color : S.border,
                  background: method === m.id ? `${m.color}15` : S.bg,
                  color: method === m.id ? m.color : S.textSub,
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {method && method !== "manual" && (
          <div className="space-y-3">
            <input
              type="text"
              value={txId}
              onChange={(e) => setTxId(e.target.value)}
              placeholder="Transaction ID"
              className="w-full px-4 py-2.5 rounded-xl border text-sm"
              style={{ borderColor: S.border, background: S.bg, color: S.text }}
            />
            <input
              type="text"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              placeholder="প্রেরকের ফোন (ঐচ্ছিক)"
              className="w-full px-4 py-2.5 rounded-xl border text-sm"
              style={{ borderColor: S.border, background: S.bg, color: S.text }}
            />
          </div>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handlePurchase}
          disabled={submitting || !calc || !smsQty || qtyNum < minSmsQty || (smsType === "masking" && maskingBlocked)}
          className="w-full py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: S.primary }}
        >
          {submitting ? <><Loader2 size={16} className="animate-spin" /> প্রক্রিয়াকরণ...</> : "ক্রেডিট কিনুন"}
        </button>
      </div>
    </div>
  );
}
