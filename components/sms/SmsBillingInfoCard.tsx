"use client";

import { useSmsCredits } from "@/hooks/useSmsCredits";

const S = {
  border: "var(--c-border)",
  surface: "var(--c-surface)",
  text: "var(--c-text)",
  textSub: "var(--c-text-sub)",
  textMuted: "var(--c-text-muted)",
  bg: "var(--c-bg)",
};

export default function SmsBillingInfoCard() {
  const { maskingEnabled } = useSmsCredits();

  if (maskingEnabled) {
    return (
      <div className="rounded-2xl border p-5 space-y-3" style={{ borderColor: S.border, background: S.surface }}>
        <h3 className="font-bold text-sm" style={{ color: S.text }}>Masking vs Non-Masking SMS</h3>
        <div className="grid md:grid-cols-2 gap-3 text-xs" style={{ color: S.textSub }}>
          <div className="rounded-xl p-3" style={{ background: S.bg }}>
            <p className="font-bold mb-1" style={{ color: S.text }}>Masking SMS</p>
            <p>প্রাপক আপনার <strong>ব্র্যান্ড নাম</strong> (Sender ID) দেখবে, যেমন MYSTORE। BTRC-approved। Marketing ও brand SMS-এর জন্য ভালো।</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: S.bg }}>
            <p className="font-bold mb-1" style={{ color: S.text }}>Non-Masking SMS</p>
            <p>প্রাপক <strong>সাধারণ নম্বর</strong> দেখবে (যেমন 01924XXXXX)। OTP, transactional — সাধারণত সস্তা ও দ্রুত।</p>
          </div>
        </div>
        <p className="text-xs" style={{ color: S.textMuted }}>
          দুটি wallet আলাদা — Masking ক্রেডিট শুধু Masking SMS-এ, Non-Masking শুধু Non-Masking-এ ব্যবহার হবে।
          বাংলা SMS = ৭০ অক্ষর = ১ segment; ইংরেজি = ১৬০ অক্ষর = ১ segment।
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-5 space-y-2" style={{ borderColor: S.border, background: S.surface }}>
      <h3 className="font-bold text-sm" style={{ color: S.text }}>SMS Credit</h3>
      <p className="text-xs" style={{ color: S.textSub }}>
        প্রাপক <strong>সাধারণ নম্বর</strong> দেখবে। OTP, transactional ও marketing SMS-এর জন্য ব্যবহার করুন।
      </p>
      <p className="text-xs" style={{ color: S.textMuted }}>
        বাংলা SMS = ৭০ অক্ষর = ১ segment; ইংরেজি = ১৬০ অক্ষর = ১ segment।
      </p>
    </div>
  );
}
