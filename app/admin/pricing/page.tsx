"use client";

import { useEffect, useState } from "react";
import { Tag, Save, ToggleLeft, ToggleRight } from "lucide-react";
import AdminCard from "../components/AdminCard";
import { PricingConfig } from "../components/constants";

export default function AdminPricingPage() {
  const [pricingDraft, setPricingDraft] = useState<PricingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function loadPricing() {
    setLoading(true);
    const r = await fetch("/api/admin/pricing");
    if (r.ok) setPricingDraft(await r.json());
    setLoading(false);
  }

  useEffect(() => { loadPricing(); }, []);

  async function savePricing() {
    setSaving(true);
    const r = await fetch("/api/admin/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pricingDraft),
    });
    setSaving(false);
    if (r.ok) {
      setPricingDraft(await r.json());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  function updateDraft(planKey: string, field: keyof PricingConfig, value: string | number | boolean) {
    setPricingDraft((prev) => prev.map((p) => (p.planKey === planKey ? { ...p, [field]: value } : p)));
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-52 animate-pulse rounded-xl bg-gray-200" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag size={18} className="text-emerald-600" />
          <h2 className="text-base font-bold text-gray-900">Plan Pricing ম্যানেজমেন্ট</h2>
        </div>
        <button
          onClick={savePricing}
          disabled={saving}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-60 ${saved ? "bg-emerald-700" : "bg-emerald-600"}`}
        >
          <Save size={14} />
          {saving ? "সেভ হচ্ছে..." : saved ? "সেভ হয়েছে ✓" : "পরিবর্তন সেভ করুন"}
        </button>
      </div>

      <div className="space-y-4">
        {pricingDraft.map((pc) => {
          const planName = pc.planKey === "free" ? "Free" : pc.planKey === "pro" ? "Pro" : "Business";
          const planColor = pc.planKey === "free" ? "#6B7280" : pc.planKey === "pro" ? "#059669" : "#D97706";
          const discountedMonthly = pc.discountEnabled && pc.discountPercent > 0
            ? Math.round(pc.monthlyPrice * (1 - pc.discountPercent / 100))
            : pc.monthlyPrice;

          return (
            <AdminCard key={pc.planKey} hover={false}>
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{
                  backgroundColor: pc.planKey === "pro" ? "#ECFDF5" : pc.planKey === "business" ? "#FFF3DC" : "#F3F4F6",
                  color: planColor,
                }}>
                  {planName}
                </span>
                {pc.discountEnabled && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                    {pc.discountPercent}% ছাড় চলছে
                  </span>
                )}
              </div>
              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500">মাসিক মূল্য (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={pc.monthlyPrice}
                    onChange={(e) => updateDraft(pc.planKey, "monthlyPrice", Number(e.target.value))}
                    disabled={pc.planKey === "free"}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none disabled:opacity-50 focus:border-emerald-500"
                  />
                  {pc.discountEnabled && pc.discountPercent > 0 && pc.monthlyPrice > 0 && (
                    <p className="mt-1 text-xs font-medium text-emerald-600">ছাড়ের পর: ৳{discountedMonthly}/মাস</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500">বার্ষিক মূল্য (৳/মাস)</label>
                  <input
                    type="number"
                    min={0}
                    value={pc.yearlyPrice}
                    onChange={(e) => updateDraft(pc.planKey, "yearlyPrice", Number(e.target.value))}
                    disabled={pc.planKey === "free"}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none disabled:opacity-50 focus:border-emerald-500"
                  />
                </div>
              </div>
              {pc.planKey !== "free" && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">ডিসকাউন্ট অফার</span>
                    <button
                      onClick={() => updateDraft(pc.planKey, "discountEnabled", !pc.discountEnabled)}
                      className="flex items-center gap-1.5 text-sm font-medium text-gray-600"
                    >
                      {pc.discountEnabled ? <ToggleRight size={22} className="text-emerald-600" /> : <ToggleLeft size={22} />}
                      {pc.discountEnabled ? "চালু" : "বন্ধ"}
                    </button>
                  </div>
                  {pc.discountEnabled && (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-500">ছাড়ের পরিমাণ (%)</label>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={pc.discountPercent}
                          onChange={(e) => updateDraft(pc.planKey, "discountPercent", Math.min(99, Math.max(1, Number(e.target.value))))}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-500">ব্যাজ লেবেল</label>
                        <input
                          type="text"
                          value={pc.discountLabel}
                          onChange={(e) => updateDraft(pc.planKey, "discountLabel", e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                          placeholder="যেমন: ৫০% ঈদ অফার"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </AdminCard>
          );
        })}
      </div>

      <AdminCard hover={false} className="!border-amber-200 !bg-amber-50">
        <p className="mb-1 text-xs font-semibold text-amber-800">গুরুত্বপূর্ণ নোট</p>
        <p className="text-xs text-amber-900">
          দাম পরিবর্তন করলে Pricing পেজ, bKash ও Nagad payment এ সাথে সাথে নতুন দাম প্রযোজ্য হবে।
          বিদ্যমান subscriptions এ কোনো প্রভাব পড়বে না।
        </p>
      </AdminCard>
    </div>
  );
}
