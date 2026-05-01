"use client";

import { useEffect, useState, useCallback } from "react";
import { formatBDT } from "@/lib/utils";
import { BarChart2, Loader2, Clock, AlertTriangle, Calendar, TrendingUp } from "lucide-react";

interface Booking {
  id: string;
  bookingNumber: string;
  clientName: string;
  eventType: string;
  eventDate: string;
  totalAmount: number;
  advancePaid: number;
  dueAmount: number;
  status: string;
  deliveryDate?: string;
  deliveredAt?: string;
  shootingDone: boolean;
  package?: { editingDays: number; name: string; type: string } | null;
  createdAt: string;
}

const PHOTO_COLOR = "#DB2777";
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: "বিবাহ", birthday: "জন্মদিন", corporate: "কর্পোরেট",
  portrait: "পোর্ট্রেট", product: "প্রোডাক্ট", other: "অন্যান্য",
};

const MONTHS_BN = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

export default function ReportsBoard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodMonths, setPeriodMonths] = useState(3);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/photography/bookings", { cache: "no-store" });
      if (res.ok) setBookings(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - periodMonths);

  const recent = bookings.filter(b => new Date(b.createdAt) >= cutoff && b.status !== "cancelled");

  const totalRevenue = recent.reduce((s, b) => s + b.totalAmount, 0);
  const totalReceived = recent.reduce((s, b) => s + b.advancePaid, 0);
  const totalDue = recent.reduce((s, b) => s + b.dueAmount, 0);

  // Monthly breakdown
  const monthlyData: Record<string, { bookings: number; revenue: number }> = {};
  recent.forEach(b => {
    const d = new Date(b.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!monthlyData[key]) monthlyData[key] = { bookings: 0, revenue: 0 };
    monthlyData[key].bookings++;
    monthlyData[key].revenue += b.totalAmount;
  });

  // Event type breakdown
  const typeBreakdown: Record<string, number> = {};
  recent.forEach(b => {
    typeBreakdown[b.eventType] = (typeBreakdown[b.eventType] ?? 0) + 1;
  });
  const totalTypes = Object.values(typeBreakdown).reduce((s, v) => s + v, 0);

  // Avg delivery time
  const delivered = bookings.filter(b => b.status === "delivered" && b.deliveredAt && b.eventDate);
  const avgDeliveryDays = delivered.length > 0
    ? delivered.reduce((s, b) => {
        const diff = new Date(b.deliveredAt!).getTime() - new Date(b.eventDate).getTime();
        return s + diff / (1000 * 60 * 60 * 24);
      }, 0) / delivered.length
    : 0;

  // Pending deliveries
  const pendingDeliveries = bookings.filter(b => b.status === "editing");

  // Monthly chart bars
  const chartMonths: Array<{ label: string; bookings: number; revenue: number }> = [];
  for (let i = periodMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    chartMonths.push({
      label: MONTHS_BN[d.getMonth()].slice(0, 3),
      bookings: monthlyData[key]?.bookings ?? 0,
      revenue: monthlyData[key]?.revenue ?? 0,
    });
  }
  const maxRevenue = Math.max(...chartMonths.map(m => m.revenue), 1);

  const TYPE_COLORS: Record<string, string> = {
    wedding: "#DB2777", birthday: "#7C3AED", corporate: "#0891B2",
    portrait: "#0F6E56", product: "#D97706", other: "#6B7280",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>রিপোর্ট</h1>
          <p className="text-sm" style={{ color: S.muted }}>ফটোগ্রাফি বিজনেস অ্যানালিটিক্স</p>
        </div>
        <select value={periodMonths} onChange={e => setPeriodMonths(Number(e.target.value))} className="px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
          <option value={1}>এই মাস</option>
          <option value={3}>৩ মাস</option>
          <option value={6}>৬ মাস</option>
          <option value={12}>১ বছর</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: PHOTO_COLOR }} /></div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "মোট বুকিং",    value: `${recent.length}টি`,         color: PHOTO_COLOR, bg: "#FDF2F8" },
              { label: "মোট আয়",       value: formatBDT(totalRevenue),       color: "#0891B2",   bg: "#ECFEFF" },
              { label: "সংগ্রহিত",     value: formatBDT(totalReceived),      color: "#0F6E56",   bg: "#E1F5EE" },
              { label: "বাকি আদায়",    value: formatBDT(totalDue),           color: "#D97706",   bg: "#FEF3C7" },
            ].map(card => (
              <div key={card.label} className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
                <p className="text-xs mt-0.5" style={{ color: S.muted }}>{card.label}</p>
              </div>
            ))}
          </div>

          {/* Monthly revenue chart */}
          <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h2 className="font-bold text-sm mb-4" style={{ color: S.text }}>মাসিক আয় (৳)</h2>
            <div className="flex items-end gap-2 h-32">
              {chartMonths.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-xs font-bold" style={{ color: PHOTO_COLOR }}>
                    {m.revenue > 0 ? `${Math.round(m.revenue / 1000)}k` : ""}
                  </p>
                  <div className="w-full rounded-t-lg transition-all" style={{
                    height: `${Math.max(4, (m.revenue / maxRevenue) * 96)}px`,
                    backgroundColor: m.revenue > 0 ? PHOTO_COLOR : S.border,
                  }} />
                  <p className="text-xs" style={{ color: S.muted }}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Event type breakdown */}
          <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h2 className="font-bold text-sm mb-4" style={{ color: S.text }}>ইভেন্ট ধরন (পাই চার্ট)</h2>
            {totalTypes === 0 ? (
              <p className="text-sm" style={{ color: S.muted }}>কোনো তথ্য নেই</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(typeBreakdown).sort(([, a], [, b]) => b - a).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: TYPE_COLORS[type] ?? "#6B7280" }} />
                    <p className="text-sm flex-1" style={{ color: S.text }}>{EVENT_TYPE_LABELS[type] ?? type}</p>
                    <div className="flex-1 rounded-full h-2 overflow-hidden" style={{ backgroundColor: S.border }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${(count / totalTypes) * 100}%`, backgroundColor: TYPE_COLORS[type] ?? "#6B7280" }} />
                    </div>
                    <p className="text-sm font-bold w-8 text-right" style={{ color: S.text }}>{count}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <h2 className="font-bold text-sm mb-3" style={{ color: S.text }}>গড় ডেলিভারি সময়</h2>
              <div className="flex items-center gap-3">
                <Clock size={28} style={{ color: PHOTO_COLOR }} />
                <div>
                  <p className="text-2xl font-bold" style={{ color: PHOTO_COLOR }}>{avgDeliveryDays.toFixed(1)} দিন</p>
                  <p className="text-xs" style={{ color: S.muted }}>{delivered.length}টি ডেলিভারি থেকে গড়</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <h2 className="font-bold text-sm mb-3" style={{ color: S.text }}>Editing পেন্ডিং</h2>
              <div className="flex items-center gap-3">
                <AlertTriangle size={28} style={{ color: "#D97706" }} />
                <div>
                  <p className="text-2xl font-bold" style={{ color: "#D97706" }}>{pendingDeliveries.length}টি</p>
                  <p className="text-xs" style={{ color: S.muted }}>ডেলিভারি বাকি আছে</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pending deliveries list */}
          {pendingDeliveries.length > 0 && (
            <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <h2 className="font-bold text-sm mb-3" style={{ color: S.text }}>পেন্ডিং ডেলিভারি তালিকা</h2>
              <div className="space-y-2">
                {pendingDeliveries.map(b => {
                  const shootDays = Math.floor((Date.now() - new Date(b.eventDate).getTime()) / (1000 * 60 * 60 * 24));
                  const target = b.package?.editingDays ?? 7;
                  const isLate = shootDays > target;
                  return (
                    <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-xl border" style={{ borderColor: S.border }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: S.text }}>{b.clientName}</p>
                        <p className="text-xs" style={{ color: S.muted }}>{EVENT_TYPE_LABELS[b.eventType]} · {new Date(b.eventDate).toLocaleDateString("bn-BD")}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isLate ? "text-red-600 bg-red-50" : "text-amber-600 bg-amber-50"}`}>
                        {shootDays}দিন{isLate ? " ⚠️" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
