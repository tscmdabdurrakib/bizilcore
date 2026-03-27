"use client";

import { useEffect, useState } from "react";
import { Shirt, Calendar, ChevronLeft, ChevronRight, RefreshCw, Search, ChevronDown, ChevronUp, Ruler } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { S } from "@/lib/theme";

interface TailorOrderRow {
  id: string;
  customerName: string;
  customerPhone: string | null;
  description: string;
  fabricDetails: string | null;
  totalAmount: number;
  dueAmount: number;
  advanceAmount: number;
  deliveryDate: string | null;
  status: string;
  notes: string | null;
  smsSent: boolean;
  measurements: Record<string, number | string | null> | null;
  createdAt: string;
  customer: { id: string; name: string; phone: string | null } | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  received:  { label: "কাপড় পেয়েছি", color: "#6B7280", bg: "#F3F4F6" },
  cutting:   { label: "কাটা হচ্ছে",   color: "#F59E0B", bg: "#FFFBEB" },
  stitching: { label: "সেলাই হচ্ছে",  color: "#3B82F6", bg: "#EFF6FF" },
  finishing: { label: "ফিনিশিং",      color: "#8B5CF6", bg: "#F5F3FF" },
  ready:     { label: "রেডি",          color: "#10B981", bg: "#ECFDF5" },
  delivered: { label: "দেওয়া হয়েছে", color: "#6B7280", bg: "#F3F4F6" },
};

const STATUS_FLOW = ["received", "cutting", "stitching", "finishing", "ready", "delivered"];

const MEASURE_FIELDS = [
  { key: "chest", label: "বুক" }, { key: "waist", label: "কোমর" },
  { key: "hip", label: "হিপ" }, { key: "shoulder", label: "কাঁধ" },
  { key: "sleeve", label: "হাতা" }, { key: "length", label: "দৈর্ঘ্য" },
  { key: "neck", label: "গলা" }, { key: "inseam", label: "ভেতরের মাপ" },
];

function urgencyStyle(dateStr: string, status: string) {
  if (status === "delivered") return { border: "#D1D5DB", bg: "var(--c-surface)", header: "#6B7280" };
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr); d.setHours(0,0,0,0);
  const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0)  return { border: "#EF4444", bg: "#FEF2F2", header: "#EF4444" };
  if (diff === 0) return { border: "#F59E0B", bg: "#FFFBEB", header: "#D97706" };
  if (diff === 1) return { border: "#EAB308", bg: "#FEFCE8", header: "#CA8A04" };
  return { border: "#D1D5DB", bg: "var(--c-surface)", header: "#6B7280" };
}

function dateUrgencyLabel(dateStr: string) {
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr); d.setHours(0,0,0,0);
  const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0)  return `${Math.abs(diff)}দিন দেরি হয়েছে!`;
  if (diff === 0) return "আজকের ডেলিভারি";
  if (diff === 1) return "আগামীকাল";
  return `${diff} দিন বাকি`;
}

function toBanglaNum(n: number) {
  return String(n).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);
}

function fmtGroupDate(dateKey: string) {
  if (dateKey === "no-date") return "তারিখ নেই";
  const d = new Date(dateKey);
  const months = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];
  const days = ["রবিবার","সোমবার","মঙ্গলবার","বুধবার","বৃহস্পতিবার","শুক্রবার","শনিবার"];
  return `${days[d.getDay()]}, ${toBanglaNum(d.getDate())} ${months[d.getMonth()]} ${toBanglaNum(d.getFullYear())}`;
}

const ALL_STATUSES = ["", "received", "cutting", "stitching", "finishing", "ready", "delivered"];

export default function TailorDelivery() {
  const [orders, setOrders] = useState<TailorOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("month", String(month));
    params.set("year", String(year));
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    const r = await fetch(`/api/tailor-orders?${params}`);
    const d = await r.json();
    setOrders(Array.isArray(d) ? d : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [month, year, statusFilter, search]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  async function advanceStatus(orderId: string) {
    setAdvancingId(orderId);
    const r = await fetch(`/api/tailor-orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ advanceNext: true }),
    });
    if (r.ok) { load(); } else {
      const data = await r.json();
      alert(data.error ?? "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।");
    }
    setAdvancingId(null);
  }

  const BANGLA_MONTHS = ["","জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

  const today = new Date(); today.setHours(0,0,0,0);

  const overdueCount = orders.filter(o => {
    if (!o.deliveryDate || o.status === "delivered") return false;
    const d = new Date(o.deliveryDate); d.setHours(0,0,0,0);
    return d < today;
  }).length;
  const todayCount = orders.filter(o => {
    if (!o.deliveryDate || o.status === "delivered") return false;
    const d = new Date(o.deliveryDate); d.setHours(0,0,0,0);
    return d.getTime() === today.getTime();
  }).length;
  const readyCount = orders.filter(o => o.status === "ready").length;

  const grouped = orders.reduce((acc, o) => {
    const key = o.deliveryDate ? o.deliveryDate.slice(0,10) : "no-date";
    if (!acc[key]) acc[key] = [];
    acc[key].push(o);
    return acc;
  }, {} as Record<string, TailorOrderRow[]>);

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a === "no-date") return 1;
    if (b === "no-date") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)" }}>
            <Calendar size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>ডেলিভারি ক্যালেন্ডার</h1>
            <p className="text-xs" style={{ color: S.muted }}>অর্ডার ডেলিভারি তারিখ অনুযায়ী</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium"
          style={{ borderColor: S.border, backgroundColor: S.surface, color: S.secondary }}
        >
          <RefreshCw size={12} /> রিফ্রেশ
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "মেয়াদ পেরিয়েছে", value: overdueCount, color: "#EF4444", bg: "#FEF2F2" },
          { label: "আজ দিতে হবে",    value: todayCount,   color: "#D97706", bg: "#FFFBEB" },
          { label: "রেডি আছে",       value: readyCount,   color: "#10B981", bg: "#ECFDF5" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ backgroundColor: s.bg, borderColor: S.border }}>
            <p className="text-xs mb-1" style={{ color: S.muted }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-2xl border p-3" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: S.secondary }}>
          <ChevronLeft size={16} />
        </button>
        <p className="font-bold text-sm" style={{ color: S.text }}>{BANGLA_MONTHS[month]} {toBanglaNum(year)}</p>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: S.secondary }}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 p-1 rounded-xl border overflow-x-auto" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          {ALL_STATUSES.map(s => {
            const info = s ? STATUS_LABELS[s] : null;
            return (
              <button
                key={s || "all"}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
                style={statusFilter === s
                  ? { backgroundColor: info?.color ?? "#374151", color: "#fff" }
                  : { color: S.secondary }}
              >
                {info?.label ?? "সব"}
              </button>
            );
          })}
        </div>
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="কাস্টমার বা বিবরণ..."
            className="w-full h-9 pl-8 pr-3 rounded-xl border text-sm outline-none"
            style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ backgroundColor: S.surface }} />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#F5F3FF" }}>
            <Shirt size={28} style={{ color: "#8B5CF6" }} />
          </div>
          <p className="font-semibold text-sm" style={{ color: S.secondary }}>এই মাসে কোনো অর্ডার নেই</p>
          <p className="text-xs mt-1" style={{ color: S.muted }}>মাস পরিবর্তন করুন বা ফিল্টার সরান</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedKeys.map(dateKey => {
            const dayOrders = grouped[dateKey];
            const dateStyle = dateKey !== "no-date" ? urgencyStyle(dateKey, dayOrders.every(o => o.status === "delivered") ? "delivered" : "pending") : { border: "#D1D5DB", bg: "var(--c-surface)", header: "#6B7280" };
            const pendingForDate = dateKey !== "no-date" ? dayOrders.filter(o => o.status !== "delivered").length : dayOrders.length;
            const dateUrgLabel = dateKey !== "no-date" ? dateUrgencyLabel(dateKey) : null;

            return (
              <div key={dateKey}>
                <div className="flex items-center gap-3 mb-2 px-1">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dateStyle.header }} />
                    <p className="text-sm font-bold" style={{ color: dateStyle.header }}>
                      {fmtGroupDate(dateKey)}
                    </p>
                    {dateUrgLabel && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: dateStyle.bg, color: dateStyle.header, border: `1px solid ${dateStyle.border}` }}>
                        {dateUrgLabel}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium" style={{ color: S.muted }}>
                    {pendingForDate}টি
                  </span>
                </div>

                <div className="space-y-2">
                  {dayOrders.map(o => {
                    const st = STATUS_LABELS[o.status] ?? STATUS_LABELS.received;
                    const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(o.status) + 1];
                    const nextLabel = nextStatus ? STATUS_LABELS[nextStatus]?.label : null;
                    const expanded = expandedId === o.id;

                    return (
                      <div
                        key={o.id}
                        className="rounded-2xl border overflow-hidden"
                        style={{ backgroundColor: dateStyle.bg, borderColor: dateStyle.border, borderLeft: `3px solid ${dateStyle.border}` }}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: st.bg, color: st.color }}>
                                  {st.label}
                                </span>
                              </div>
                              <p className="text-sm font-bold" style={{ color: S.text }}>{o.customerName}</p>
                              {o.customerPhone && <p className="text-xs" style={{ color: S.muted }}>{o.customerPhone}</p>}
                              <p className="text-xs mt-0.5" style={{ color: S.secondary }}>{o.description}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold" style={{ color: S.text }}>{formatBDT(o.totalAmount)}</p>
                              {o.dueAmount > 0 && (
                                <p className="text-xs" style={{ color: "#EF4444" }}>বাকি {formatBDT(o.dueAmount)}</p>
                              )}
                              <button
                                onClick={() => setExpandedId(expanded ? null : o.id)}
                                className="mt-1.5 flex items-center gap-1 text-xs font-medium ml-auto"
                                style={{ color: S.secondary }}
                              >
                                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              </button>
                            </div>
                          </div>

                          {expanded && (
                            <div className="mt-3 pt-3 border-t space-y-3" style={{ borderColor: S.border }}>
                              {o.measurements && (
                                <div className="rounded-xl p-3" style={{ backgroundColor: "#F5F3FF" }}>
                                  <p className="text-[10px] font-bold mb-2 flex items-center gap-1" style={{ color: "#7C3AED" }}>
                                    <Ruler size={10} /> মাপ
                                  </p>
                                  <div className="grid grid-cols-4 gap-1">
                                    {MEASURE_FIELDS.map(f => {
                                      const val = (o.measurements as Record<string, number | null>)?.[f.key];
                                      return val != null ? (
                                        <div key={f.key} className="text-center p-1 rounded-lg" style={{ backgroundColor: "#EDE9FE" }}>
                                          <p className="text-[9px]" style={{ color: S.muted }}>{f.label}</p>
                                          <p className="text-[11px] font-bold" style={{ color: "#7C3AED" }}>{val}″</p>
                                        </div>
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                              )}

                              {o.notes && (
                                <p className="text-xs rounded-xl p-3" style={{ backgroundColor: "#FFFBEB", color: "#92400E" }}>📝 {o.notes}</p>
                              )}

                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex gap-1 overflow-x-auto flex-1">
                                  {STATUS_FLOW.map((s, idx) => {
                                    const sInfo = STATUS_LABELS[s];
                                    const done = idx <= STATUS_FLOW.indexOf(o.status);
                                    return (
                                      <div key={s} className="flex-shrink-0 px-2 py-1 rounded-lg text-[10px] font-semibold"
                                        style={{ backgroundColor: done ? sInfo.bg : "#F3F4F6", color: done ? sInfo.color : "#D1D5DB" }}>
                                        {sInfo.label}
                                      </div>
                                    );
                                  })}
                                </div>
                                {nextLabel && (
                                  <button
                                    onClick={() => advanceStatus(o.id)}
                                    disabled={advancingId === o.id}
                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-60 whitespace-nowrap"
                                    style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}
                                  >
                                    {advancingId === o.id ? "..." : `→ ${nextLabel}`}
                                  </button>
                                )}
                              </div>
                              {o.smsSent && (
                                <p className="text-[10px] px-2 py-1 rounded-lg inline-block" style={{ backgroundColor: "#ECFDF5", color: "#065F46" }}>
                                  ✓ রেডি SMS পাঠানো হয়েছে
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
