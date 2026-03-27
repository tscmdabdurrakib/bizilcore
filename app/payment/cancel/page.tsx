"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";

export default function PaymentCancelPage() {
  const S = { primary: "#0F6E56", bg: "#F7F6F2", surface: "#FFFFFF", border: "#E8E6DF", text: "#1A1A18", muted: "#A8A69E" };

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
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#FFE8E8" }}>
            <XCircle size={36} style={{ color: "#E24B4A" }} />
          </div>
          <h2 className="font-bold text-xl mb-2" style={{ color: S.text }}>পেমেন্ট বাতিল হয়েছে</h2>
          <p className="text-sm mb-6" style={{ color: S.muted }}>
            আপনার পেমেন্ট সম্পন্ন হয়নি। আবার চেষ্টা করুন।
          </p>
          <div className="space-y-3">
            <Link href="/settings?tab=subscription" className="block w-full py-3 rounded-xl text-white font-semibold text-sm text-center" style={{ backgroundColor: S.primary }}>
              আবার চেষ্টা করুন
            </Link>
            <Link href="/dashboard" className="block w-full py-3 rounded-xl border font-semibold text-sm text-center" style={{ borderColor: S.border, color: S.text }}>
              Dashboard এ ফিরুন
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
