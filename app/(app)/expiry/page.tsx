"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, Clock, Package2, Loader2, RefreshCw, Tag } from "lucide-react";

interface BatchWithMedicine {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  buyPrice: number | null;
  medicine: {
    id: string;
    brandName: string;
    genericName: string | null;
    category: string;
    unit: string;
  };
}

const FILTERS = [
  { value: "expired",  label: "মেয়াদ শেষ",        color: "#EF4444", bg: "#FEF2F2" },
  { value: "1month",   label: "১ মাসের মধ্যে",    color: "#F59E0B", bg: "#FFFBEB" },
  { value: "3months",  label: "৩ মাসের মধ্যে",   color: "#10B981", bg: "#ECFDF5" },
];

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)",
};

export default function ExpiryPage() {
  const [filter, setFilter] = useState("1month");
  const [batches, setBatches] = useState<BatchWithMedicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchExpiry = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/expiry?filter=${filter}`);
    const data = await r.json();
    setBatches(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchExpiry(); }, [fetchExpiry]);

  function daysUntil(dateStr: string) {
    return Math.floor((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  function badgeStyle(days: number) {
    if (days < 0) return { bg: "#1F2937", color: "#F9FAFB" };
    if (days <= 7) return { bg: "#EF4444", color: "#fff" };
    if (days <= 30) return { bg: "#F59E0B", color: "#fff" };
    return { bg: "#10B981", color: "#fff" };
  }

  const activeFilter = FILTERS.find(f => f.value === filter)!;
  const totalQty = batches.reduce((s, b) => s + b.quantity, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)" }}>
            <AlertTriangle size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>মেয়াদ সতর্কতা</h1>
            <p className="text-xs" style={{ color: S.muted }}>মেয়াদোত্তীর্ণ ও মেয়াদ-প্রায়-শেষ ব্যাচ</p>
          </div>
        </div>
        <button onClick={fetchExpiry} className="flex items-center gap-2 px-4 h-10 rounded-xl border text-sm font-medium"
          style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
          <RefreshCw size={14} /> রিফ্রেশ
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
            style={filter === f.value
              ? { backgroundColor: f.color, color: "#fff", borderColor: f.color }
              : { backgroundColor: S.surface, color: S.secondary, borderColor: S.border }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      {!loading && batches.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ backgroundColor: activeFilter.bg, borderLeft: `4px solid ${activeFilter.color}` }}>
          <AlertTriangle size={18} style={{ color: activeFilter.color, flexShrink: 0 }} />
          <p className="text-sm font-medium" style={{ color: activeFilter.color }}>
            {batches.length}টি ব্যাচ · মোট {totalQty} পিস ওষুধ মেয়াদ সংক্রান্ত সমস্যায় আছে।
          </p>
        </div>
      )}

      {/* Batch Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: "#EF4444" }} />
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-20">
          <Package2 size={40} className="mx-auto mb-3" style={{ color: S.muted }} />
          <p className="font-medium" style={{ color: S.text }}>কোনো সমস্যা পাওয়া যায়নি।</p>
          <p className="text-sm mt-1" style={{ color: S.muted }}>এই বিভাগে কোনো মেয়াদ সমস্যা নেই।</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border, backgroundColor: S.surface }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--c-surface-raised)", borderBottom: `1px solid ${S.border}` }}>
                  {["ওষুধ", "ব্যাচ নম্বর", "মেয়াদ শেষ", "পরিমাণ", "দিন বাকি", "একশন"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: S.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batches.map(b => {
                  const days = daysUntil(b.expiryDate);
                  const badge = badgeStyle(days);
                  return (
                    <tr key={b.id} className="border-b last:border-0 hover:bg-black/[0.02]" style={{ borderColor: S.border }}>
                      <td className="px-4 py-3">
                        <p className="font-semibold" style={{ color: S.text }}>{b.medicine.brandName}</p>
                        {b.medicine.genericName && <p className="text-xs" style={{ color: S.muted }}>{b.medicine.genericName}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: "var(--c-surface-raised)", color: S.secondary }}>
                          {b.batchNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} style={{ color: days < 0 ? "#EF4444" : days <= 30 ? "#F59E0B" : S.muted }} />
                          <span className="text-sm" style={{ color: S.text }}>
                            {new Date(b.expiryDate).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold" style={{ color: S.text }}>
                        {b.quantity} {b.medicine.unit}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: badge.bg, color: badge.color }}>
                          {days < 0 ? `${Math.abs(days)} দিন আগে শেষ` : `${days} দিন বাকি`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => showToast("success", `"${b.medicine.brandName}" সরবরাহকারীকে ফেরত দেওয়ার জন্য চিহ্নিত করা হয়েছে।`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-black/5 transition-colors"
                            style={{ borderColor: "#F59E0B", color: "#F59E0B" }}>
                            <Package2 size={12} /> সরবরাহকারীকে ফেরত
                          </button>
                          <button
                            onClick={() => showToast("success", `"${b.medicine.brandName}" ডিসকাউন্টের জন্য চিহ্নিত হয়েছে।`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-black/5 transition-colors"
                            style={{ borderColor: "#10B981", color: "#10B981" }}>
                            <Tag size={12} /> ডিসকাউন্ট করুন
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
