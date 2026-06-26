"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, TrendingUp, Users, Clock, Settings, Tag, Receipt, ShieldCheck, Gift, Loader2, Search, SlidersHorizontal } from "lucide-react";

const S = {
  primary: "#0F6E56", primaryLight: "#E1F5EE",
  bg: "#F7F6F2", surface: "#FFFFFF", border: "#E8E6DF",
  text: "#1A1A18", textSub: "#5A5A56", textMuted: "#A8A69E",
};

interface Overview {
  totalRevenue: number;
  totalSmsSold: number;
  maskingRevenue: number;
  maskingSmsSold: number;
  nonMaskingRevenue: number;
  nonMaskingSmsSold: number;
  activeUsers: number;
  pendingPayments: number;
  isSmsServiceActive: boolean;
  maskingEnabled: boolean;
  pricePerSmsMasking: number;
  pricePerSmsNonMasking: number;
  platformBalance: number | null | false;
}

interface UserResult {
  id: string;
  name: string;
  email: string;
}

export default function SmsCreditsAdminPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingMasking, setTogglingMasking] = useState(false);
  const [adjustSearch, setAdjustSearch] = useState("");
  const [adjustUsers, setAdjustUsers] = useState<UserResult[]>([]);
  const [adjustUser, setAdjustUser] = useState<UserResult | null>(null);
  const [adjustForm, setAdjustForm] = useState({ creditsAmount: "", smsType: "non_masking" as "masking" | "non_masking", note: "" });
  const [adjusting, setAdjusting] = useState(false);
  const [adjustToast, setAdjustToast] = useState<string | null>(null);

  function loadOverview() {
    return fetch("/api/admin/sms/overview")
      .then((r) => r.json())
      .then(setData);
  }

  useEffect(() => {
    loadOverview().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (adjustSearch.trim().length < 2) {
      setAdjustUsers([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/admin/users?search=${encodeURIComponent(adjustSearch.trim())}`)
        .then((r) => r.json())
        .then((list) => setAdjustUsers(Array.isArray(list) ? list.slice(0, 8) : []))
        .catch(() => setAdjustUsers([]));
    }, 300);
    return () => clearTimeout(t);
  }, [adjustSearch]);

  async function submitAdjust() {
    if (!adjustUser) return;
    const creditsAmount = parseInt(adjustForm.creditsAmount);
    if (!Number.isFinite(creditsAmount) || creditsAmount === 0 || !adjustForm.note.trim()) {
      setAdjustToast("Credits amount ও note দিন");
      return;
    }
    setAdjusting(true);
    const r = await fetch("/api/admin/sms/credits/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: adjustUser.id,
        creditsAmount,
        smsType: adjustForm.smsType,
        note: adjustForm.note.trim(),
      }),
    });
    setAdjusting(false);
    if (r.ok) {
      setAdjustToast("Credits adjusted successfully");
      setAdjustForm({ creditsAmount: "", smsType: "non_masking", note: "" });
      setAdjustUser(null);
      setAdjustSearch("");
    } else {
      const d = await r.json().catch(() => ({}));
      setAdjustToast(d.error ?? "Adjustment failed");
    }
    setTimeout(() => setAdjustToast(null), 3500);
  }

  async function toggleMasking() {
    if (!data) return;
    setTogglingMasking(true);
    try {
      const r = await fetch("/api/admin/sms/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maskingEnabled: !data.maskingEnabled }),
      });
      if (r.ok) await loadOverview();
    } finally {
      setTogglingMasking(false);
    }
  }

  const cards = data ? [
    { label: "মোট রাজস্ব", value: `৳${data.totalRevenue.toLocaleString("bn-BD")}`, icon: TrendingUp, color: "#059669" },
    { label: "মোট বিক্রয়", value: `${data.totalSmsSold.toLocaleString("bn-BD")} SMS`, icon: MessageSquare, color: "#0F6E56" },
    ...(data.maskingEnabled
      ? [{ label: "Masking বিক্রয়", value: `${data.maskingSmsSold.toLocaleString("bn-BD")} SMS`, icon: ShieldCheck, color: "#7C3AED" }]
      : []),
    { label: "Non-Masking বিক্রয়", value: `${data.nonMaskingSmsSold.toLocaleString("bn-BD")} SMS`, icon: MessageSquare, color: "#6366F1" },
    { label: "সক্রিয় ইউজার", value: String(data.activeUsers), icon: Users, color: "#6366F1" },
    { label: "পেন্ডিং পেমেন্ট", value: String(data.pendingPayments), icon: Clock, color: "#D97706" },
  ] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: S.text }}>SMS Credits</h1>
          <p className="text-sm" style={{ color: S.textMuted }}>
            {data?.isSmsServiceActive ? "🟢 সার্ভিস সক্রিয়" : "🔴 সার্ভিস বন্ধ"}
            {data && (
              data.maskingEnabled
                ? ` · Masking ৳${data.pricePerSmsMasking} · Non-Masking ৳${data.pricePerSmsNonMasking}`
                : ` · Non-Masking ৳${data.pricePerSmsNonMasking}`
            )}
          </p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: S.textMuted }}>লোড হচ্ছে...</p>
      ) : (
        <>
          {data && (
            <div className="rounded-2xl border p-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              style={{ background: data.maskingEnabled ? S.primaryLight : S.surface, borderColor: S.border }}>
              <div>
                <p className="font-bold" style={{ color: S.text }}>Masking SMS</p>
                <p className="text-sm mt-1" style={{ color: S.textSub }}>
                  {data.maskingEnabled
                    ? "সক্রিয় — ইউজাররা Masking SMS কিনতে ও পাঠাতে পারবে"
                    : "বন্ধ — সব জায়গায় Masking অপশন লুকানো থাকবে"}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleMasking}
                disabled={togglingMasking}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60 shrink-0"
                style={{ background: data.maskingEnabled ? "#DC2626" : S.primary }}
              >
                {togglingMasking && <Loader2 size={14} className="animate-spin" />}
                {data.maskingEnabled ? "Masking বন্ধ করুন" : "Masking চালু করুন"}
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {cards.map((c) => (
              <div key={c.label} className="rounded-2xl border p-5" style={{ background: S.surface, borderColor: S.border }}>
                <c.icon size={20} style={{ color: c.color }} className="mb-2" />
                <p className="text-xs font-semibold" style={{ color: S.textMuted }}>{c.label}</p>
                <p className="text-xl font-black mt-1" style={{ color: S.text }}>{c.value}</p>
              </div>
            ))}
          </div>

          {data && (
          <div className="rounded-xl border p-4 mb-6" style={{ background: S.primaryLight, borderColor: S.border }}>
            <p className="text-xs font-semibold mb-1" style={{ color: S.textMuted }}>sms.net.bd Platform Wallet</p>
            <p className="text-lg font-black" style={{ color: S.primary }}>
              {data.platformBalance === false
                ? "API key সঠিক নয়"
                : data.platformBalance === null
                  ? "ব্যালেন্স লোড হয়নি"
                  : `৳${Number(data.platformBalance).toLocaleString("bn-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </p>
            <p className="text-xs mt-1" style={{ color: S.textMuted }}>
              BizilCore-এর master API key-এ sms.net.bd-তে যা BDT ব্যালেন্স আছে
            </p>
          </div>
          )}

          <div className="rounded-2xl border p-5 mb-6" style={{ background: S.surface, borderColor: S.border }}>
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal size={20} style={{ color: S.primary }} />
              <div>
                <p className="font-bold" style={{ color: S.text }}>Manual Credit Adjust</p>
                <p className="text-xs" style={{ color: S.textMuted }}>Positive বা negative amount (+/- credits)</p>
              </div>
            </div>
            {adjustToast && (
              <p className="text-sm mb-3 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700">{adjustToast}</p>
            )}
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={adjustSearch} onChange={(e) => setAdjustSearch(e.target.value)}
                placeholder="User খুঁজুন..."
                className="w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none"
                style={{ borderColor: S.border }} />
            </div>
            {adjustUsers.length > 0 && !adjustUser && (
              <div className="mb-3 rounded-xl border overflow-hidden" style={{ borderColor: S.border }}>
                {adjustUsers.map((u) => (
                  <button key={u.id} type="button" onClick={() => { setAdjustUser(u); setAdjustSearch(u.email); setAdjustUsers([]); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-0">
                    {u.name} · {u.email}
                  </button>
                ))}
              </div>
            )}
            {adjustUser && (
              <p className="text-sm mb-3 font-medium" style={{ color: S.text }}>
                Selected: {adjustUser.name}
                <button type="button" onClick={() => { setAdjustUser(null); setAdjustSearch(""); }} className="ml-2 text-xs text-red-600">Clear</button>
              </p>
            )}
            <div className="grid sm:grid-cols-3 gap-3 mb-3">
              <input value={adjustForm.creditsAmount} onChange={(e) => setAdjustForm((f) => ({ ...f, creditsAmount: e.target.value }))}
                placeholder="Credits (+/-)" type="number"
                className="rounded-xl border px-3 py-2.5 text-sm outline-none" style={{ borderColor: S.border }} />
              <select value={adjustForm.smsType} onChange={(e) => setAdjustForm((f) => ({ ...f, smsType: e.target.value as "masking" | "non_masking" }))}
                className="rounded-xl border px-3 py-2.5 text-sm outline-none" style={{ borderColor: S.border }}>
                <option value="non_masking">Non-Masking</option>
                {data?.maskingEnabled && <option value="masking">Masking</option>}
              </select>
              <input value={adjustForm.note} onChange={(e) => setAdjustForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Note (required)"
                className="rounded-xl border px-3 py-2.5 text-sm outline-none" style={{ borderColor: S.border }} />
            </div>
            <button type="button" onClick={submitAdjust} disabled={adjusting || !adjustUser}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-60"
              style={{ background: S.primary }}>
              {adjusting && <Loader2 size={14} className="animate-spin" />}
              Adjust Credits
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/sms-credits/gifts" className="rounded-2xl border p-5 hover:shadow-md transition-shadow" style={{ background: S.surface, borderColor: S.border, textDecoration: "none" }}>
              <Gift size={22} style={{ color: S.primary }} className="mb-2" />
              <p className="font-bold" style={{ color: S.text }}>Bonuses & Gifts</p>
              <p className="text-xs mt-1" style={{ color: S.textMuted }}>Signup bonus + manual gift</p>
            </Link>
            <Link href="/admin/sms-credits/pricing" className="rounded-2xl border p-5 hover:shadow-md transition-shadow" style={{ background: S.surface, borderColor: S.border, textDecoration: "none" }}>
              <Settings size={22} style={{ color: S.primary }} className="mb-2" />
              <p className="font-bold" style={{ color: S.text }}>Pricing</p>
              <p className="text-xs mt-1" style={{ color: S.textMuted }}>
                {data?.maskingEnabled ? "Masking/Non-Masking মূল্য" : "SMS মূল্য ও সেটিংস"}
              </p>
            </Link>
            {data?.maskingEnabled && (
            <Link href="/admin/sms-credits/sender-ids" className="rounded-2xl border p-5 hover:shadow-md transition-shadow" style={{ background: S.surface, borderColor: S.border, textDecoration: "none" }}>
              <ShieldCheck size={22} style={{ color: S.primary }} className="mb-2" />
              <p className="font-bold" style={{ color: S.text }}>Sender IDs</p>
              <p className="text-xs mt-1" style={{ color: S.textMuted }}>Masking Sender ID approve</p>
            </Link>
            )}
            <Link href="/admin/sms-credits/discounts" className="rounded-2xl border p-5 hover:shadow-md transition-shadow" style={{ background: S.surface, borderColor: S.border, textDecoration: "none" }}>
              <Tag size={22} style={{ color: S.primary }} className="mb-2" />
              <p className="font-bold" style={{ color: S.text }}>Discounts</p>
              <p className="text-xs mt-1" style={{ color: S.textMuted }}>Promo codes</p>
            </Link>
            <Link href="/admin/sms-credits/transactions" className="rounded-2xl border p-5 hover:shadow-md transition-shadow" style={{ background: S.surface, borderColor: S.border, textDecoration: "none" }}>
              <Receipt size={22} style={{ color: S.primary }} className="mb-2" />
              <p className="font-bold" style={{ color: S.text }}>Transactions</p>
              <p className="text-xs mt-1" style={{ color: S.textMuted }}>সব tenant transactions</p>
            </Link>
            <Link href="/admin/sms-credits/logs" className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ textDecoration: "none" }}>
              <MessageSquare size={22} className="mb-2 text-emerald-600" />
              <p className="font-bold text-gray-900">Usage Logs</p>
              <p className="mt-1 text-xs text-gray-500">SMS message history</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
