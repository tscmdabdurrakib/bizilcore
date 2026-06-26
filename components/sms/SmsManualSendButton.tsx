"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Send, Loader2, X } from "lucide-react";
import { useSmsCredits } from "@/hooks/useSmsCredits";
import type { SmsType } from "@/lib/sms/types";

function countSegments(message: string): number {
  const isUnicode = /[^\u0000-\u007F]/.test(message);
  const singleLimit = isUnicode ? 70 : 160;
  const multiLimit = isUnicode ? 67 : 153;
  const len = message.length;
  if (len === 0) return 1;
  if (len <= singleLimit) return 1;
  return Math.ceil(len / multiLimit);
}

interface Props {
  phoneNumber: string;
  defaultMessage?: string;
  customerId?: string;
  orderId?: string;
  className?: string;
  onSent?: () => void;
}

export default function SmsManualSendButton({
  phoneNumber,
  defaultMessage = "",
  customerId,
  className = "",
  onSent,
}: Props) {
  const { balanceFor, senderIdStatus, maskingEnabled, refetch } = useSmsCredits();
  const [open, setOpen] = useState(false);
  const [noCredits, setNoCredits] = useState(false);
  const [noSenderId, setNoSenderId] = useState(false);
  const [phone, setPhone] = useState(phoneNumber);
  const [message, setMessage] = useState(defaultMessage);
  const [smsType, setSmsType] = useState<SmsType>("non_masking");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const balance = balanceFor(smsType);
  const segments = countSegments(message);

  useEffect(() => {
    if (!maskingEnabled && smsType === "masking") {
      setSmsType("non_masking");
    }
  }, [maskingEnabled, smsType]);

  function handleClick() {
    const totalBalance = maskingEnabled
      ? balanceFor("masking") + balanceFor("non_masking")
      : balanceFor("non_masking");
    if (totalBalance < 1) {
      setNoCredits(true);
      return;
    }
    setPhone(phoneNumber);
    setMessage(defaultMessage);
    setOpen(true);
    setError("");
    setSuccess(false);
  }

  async function handleSend() {
    if (!phone.trim() || !message.trim()) {
      setError("ফোন ও মেসেজ দিন");
      return;
    }
    if (smsType === "masking" && senderIdStatus !== "approved") {
      setNoSenderId(true);
      setOpen(false);
      return;
    }
    if (balance < segments) {
      setNoCredits(true);
      setOpen(false);
      return;
    }

    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/sms-credits/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message, customerId, smsType }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "NO_CREDITS") {
          setOpen(false);
          setNoCredits(true);
        } else if (data.code === "SENDER_ID_NOT_APPROVED") {
          setOpen(false);
          setNoSenderId(true);
        } else {
          setError(data.error ?? "SMS পাঠানো যায়নি");
        }
      } else {
        setSuccess(true);
        refetch();
        onSent?.();
        setTimeout(() => setOpen(false), 1500);
      }
    } catch {
      setError("SMS পাঠাতে ব্যর্থ হয়েছে। ক্রেডিট কাটা হয়নি।");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:scale-105 ${className}`}
        style={{ borderColor: "var(--c-border)", color: "var(--c-primary)", background: "var(--c-primary-light)" }}
      >
        <MessageSquare size={13} />
        SMS পাঠান
      </button>

      {noCredits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="rounded-2xl p-6 max-w-sm w-full" style={{ background: "var(--c-surface)" }}>
            <p className="font-bold mb-2" style={{ color: "var(--c-text)" }}>আপনার SMS ক্রেডিট শেষ।</p>
            <p className="text-sm mb-4" style={{ color: "var(--c-text-sub)" }}>SMS পাঠাতে ক্রেডিট কিনুন।</p>
            <div className="flex gap-2">
              <Link href="/billing#sms-credits" className="flex-1 py-2 rounded-xl text-center text-white text-sm font-bold" style={{ background: "var(--c-primary)" }}>
                কিনুন
              </Link>
              <button type="button" onClick={() => setNoCredits(false)} className="flex-1 py-2 rounded-xl text-sm font-bold border" style={{ borderColor: "var(--c-border)" }}>
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {noSenderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="rounded-2xl p-6 max-w-sm w-full" style={{ background: "var(--c-surface)" }}>
            <p className="font-bold mb-2" style={{ color: "var(--c-text)" }}>Sender ID approve করা নেই</p>
            <p className="text-sm mb-4" style={{ color: "var(--c-text-sub)" }}>Masking SMS পাঠাতে প্রথমে Sender ID approve করান।</p>
            <div className="flex gap-2">
              <Link href="/settings/sms" className="flex-1 py-2 rounded-xl text-center text-white text-sm font-bold" style={{ background: "var(--c-primary)" }}>
                Settings
              </Link>
              <button type="button" onClick={() => setNoSenderId(false)} className="flex-1 py-2 rounded-xl text-sm font-bold border" style={{ borderColor: "var(--c-border)" }}>
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="rounded-2xl p-6 max-w-md w-full" style={{ background: "var(--c-surface)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: "var(--c-text)" }}>SMS পাঠান</h3>
              <button type="button" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>

            <div className="space-y-3">
              {maskingEnabled && (
              <div className="flex gap-2">
                <button type="button" onClick={() => setSmsType("non_masking")}
                  className="flex-1 py-2 rounded-xl text-xs font-bold border"
                  style={{
                    borderColor: smsType === "non_masking" ? "var(--c-primary)" : "var(--c-border)",
                    background: smsType === "non_masking" ? "var(--c-primary-light)" : "transparent",
                    color: smsType === "non_masking" ? "var(--c-primary)" : "var(--c-text-sub)",
                  }}>
                  Non-Masking ({balanceFor("non_masking")})
                </button>
                <button type="button" onClick={() => setSmsType("masking")}
                  disabled={senderIdStatus !== "approved"}
                  className="flex-1 py-2 rounded-xl text-xs font-bold border disabled:opacity-40"
                  style={{
                    borderColor: smsType === "masking" ? "var(--c-primary)" : "var(--c-border)",
                    background: smsType === "masking" ? "var(--c-primary-light)" : "transparent",
                    color: smsType === "masking" ? "var(--c-primary)" : "var(--c-text-sub)",
                  }}>
                  Masking ({balanceFor("masking")})
                </button>
              </div>
              )}
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="ফোন নম্বর"
                className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ borderColor: "var(--c-border)" }}
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="মেসেজ"
                className="w-full px-3 py-2 rounded-xl border text-sm resize-none"
                style={{ borderColor: "var(--c-border)" }}
              />
              <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
                {message.length} অক্ষর · {segments} SMS ক্রেডিট · ব্যালেন্স: {balance}
              </p>
              {error && <p className="text-xs text-red-600">{error}</p>}
              {success && <p className="text-xs text-green-600">SMS পাঠানো হয়েছে! {segments}টি ক্রেডিট কাটা হয়েছে।</p>}
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || success}
                className="w-full py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "var(--c-primary)" }}
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {sending ? "পাঠানো হচ্ছে..." : "পাঠান"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
