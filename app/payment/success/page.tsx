"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";

function SuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const paymentId = params.get("paymentId");
  const method = params.get("method");
  const demo = params.get("demo");

  const [activated, setActivated] = useState(false);
  const [payment, setPayment] = useState<{ amount: number; plan: string; months: number } | null>(null);

  useEffect(() => {
    if (!paymentId) return;
    // If demo mode, activate subscription
    if (demo === "1") {
      fetch(`/api/payment/${method}/callback?paymentId=${paymentId}&demo=1`, { method: "POST" })
        .finally(() => setActivated(true));
    } else {
      setActivated(true);
    }
    // Fetch payment details
    fetch("/api/subscription").then(r => r.json()).then(d => {
      const p = d.payments?.find((x: { id: string }) => x.id === paymentId);
      if (p) setPayment(p);
    });
  }, [paymentId, method, demo]);

  const S = { primary: "#0F6E56", bg: "#F7F6F2", surface: "#FFFFFF", border: "#E8E6DF", text: "#1A1A18", muted: "#A8A69E" };

  const PLAN_BN: Record<string, string> = { pro: "Pro", business: "Business" };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: S.bg }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: S.primary }}>
            হ
          </div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>BizilCore</h1>
        </div>

        <div className="rounded-2xl border p-8 text-center" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          {!activated ? (
            <div className="py-4">
              <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: S.primary }} />
              <p className="text-sm" style={{ color: S.muted }}>Subscription activate হচ্ছে...</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#E1F5EE" }}>
                <CheckCircle2 size={36} style={{ color: S.primary }} />
              </div>
              <h2 className="font-bold text-xl mb-2" style={{ color: S.text }}>পেমেন্ট সফল হয়েছে!</h2>
              {payment && (
                <div className="my-4 p-4 rounded-xl space-y-2" style={{ backgroundColor: "#F7F6F2" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: S.muted }}>পরিমাণ</span>
                    <span className="font-bold" style={{ color: S.text }}>৳{payment.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: S.muted }}>Plan</span>
                    <span className="font-semibold px-2 py-0.5 rounded-full text-sm" style={{ backgroundColor: "#E1F5EE", color: S.primary }}>
                      {PLAN_BN[payment.plan] ?? payment.plan}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: S.muted }}>মেয়াদ</span>
                    <span className="text-sm font-medium" style={{ color: S.text }}>{payment.months} মাস</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: S.muted }}>Payment Method</span>
                    <span className="text-sm font-medium capitalize" style={{ color: S.text }}>{method}</span>
                  </div>
                </div>
              )}
              <p className="text-xs mb-5" style={{ color: S.muted }}>আপনার account এ সব premium ফিচার activate হয়েছে।</p>
              <Link href="/dashboard" className="block w-full py-3 rounded-xl text-white font-semibold text-sm" style={{ backgroundColor: S.primary }}>
                Dashboard এ যান
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F7F6F2" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "#0F6E56" }} />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
