"use client";

import { useEffect, useState, useCallback } from "react";
import { Shirt, Plus, Search, RefreshCw, ChevronDown, ChevronUp, X, Calendar, Ruler } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { S } from "@/lib/theme";

interface TOrder {
  id: string;
  customerName: string;
  customerPhone: string | null;
  description: string;
  fabricSource: string;
  fabricDetails: string | null;
  styleImageUrl: string | null;
  totalAmount: number;
  advanceAmount: number;
  dueAmount: number;
  deliveryDate: string | null;
  status: string;
  notes: string | null;
  smsSent: boolean;
  createdAt: string;
  measurements: Record<string, number | string | null> | null;
  customer: { id: string; name: string; phone: string | null } | null;
}

interface CustomerRow {
  id: string;
  name: string;
  phone: string | null;
}

interface MeasurementData {
  chest: number | null; waist: number | null; hip: number | null;
  shoulder: number | null; sleeve: number | null; length: number | null;
  neck: number | null; inseam: number | null; notes: string | null;
}

const STATUS_FLOW = ["received", "cutting", "stitching", "finishing", "ready", "delivered"];

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  received:  { label: "কাপড় পেয়েছি", color: "#6B7280", bg: "#F3F4F6" },
  cutting:   { label: "কাটা হচ্ছে",   color: "#F59E0B", bg: "#FFFBEB" },
  stitching: { label: "সেলাই হচ্ছে",  color: "#3B82F6", bg: "#EFF6FF" },
  finishing: { label: "ফিনিশিং",      color: "#8B5CF6", bg: "#F5F3FF" },
  ready:     { label: "রেডি",          color: "#10B981", bg: "#ECFDF5" },
  delivered: { label: "দেওয়া হয়েছে", color: "#6B7280", bg: "#F3F4F6" },
};

const FABRIC_LABELS: Record<string, string> = {
  customer_fabric: "কাস্টমারের কাপড়",
  shop_fabric:     "দোকানের কাপড়",
};

const DESCRIPTION_TEMPLATES = [
  "সালোয়ার কামিজ", "শাড়ি ব্লাউজ", "পাঞ্জাবি", "শার্ট", "প্যান্ট",
  "শেরওয়ানি", "কামিজ", "ফতুয়া", "কোট", "সুট",
];

const MEASURE_FIELDS: { key: string; label: string }[] = [
  { key: "chest",    label: "বুক" },
  { key: "waist",    label: "কোমর" },
  { key: "hip",      label: "হিপ" },
  { key: "shoulder", label: "কাঁধ" },
  { key: "sleeve",   label: "হাতা" },
  { key: "length",   label: "দৈর্ঘ্য" },
  { key: "neck",     label: "গলা" },
  { key: "inseam",   label: "ভেতরের মাপ" },
];

function fmtDate(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const months = ["জান","ফেব","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগ","সেপ","অক্ট","নভ","ডিস"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function urgencyLabel(deliveryDate: string | null, status: string) {
  if (status === "delivered") return null;
  if (!deliveryDate) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(deliveryDate); d.setHours(0,0,0,0);
  const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0)  return { label: `${Math.abs(diff)}দিন দেরি`, color: "#EF4444", bg: "#FEE2E2" };
  if (diff === 0) return { label: "আজ", color: "#D97706", bg: "#FEF3C7" };
  if (diff === 1) return { label: "কাল", color: "#CA8A04", bg: "#FEF9C3" };
  return null;
}

const EMPTY_FORM = {
  customerId: "", customerName: "", customerPhone: "",
  description: "", fabricSource: "customer_fabric", fabricDetails: "",
  styleImageUrl: "", advanceAmount: "", totalAmount: "", deliveryDate: "", notes: "",
};

export default function TailorOrders() {
  const [orders, setOrders] = useState<TOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [customerMeasurement, setCustomerMeasurement] = useState<MeasurementData | null>(null);
  const [loadingMeasurement, setLoadingMeasurement] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    const r = await fetch(`/api/tailor-orders?${params}`);
    const d = await r.json();
    setOrders(Array.isArray(d) ? d : []);
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    if (!showNew) return;
    fetch("/api/customers?limit=500").then(r => r.json()).then(d => {
      setCustomers((d.customers ?? d ?? []).slice(0, 500));
    }).catch(() => {});
  }, [showNew]);

  async function handleCustomerSelect(id: string) {
    const c = customers.find(c => c.id === id);
    if (c) {
      setForm(f => ({ ...f, customerId: c.id, customerName: c.name, customerPhone: c.phone ?? "" }));
      setLoadingMeasurement(true);
      setCustomerMeasurement(null);
      try {
        const r = await fetch(`/api/measurements/${c.id}`);
        if (r.ok) {
          const data = await r.json();
          setCustomerMeasurement(data.measurement ?? null);
        }
      } catch {}
      setLoadingMeasurement(false);
    } else {
      setForm(f => ({ ...f, customerId: "" }));
      setCustomerMeasurement(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const adv = parseFloat(form.advanceAmount) || 0;
    const tot = parseFloat(form.totalAmount) || 0;
    const r = await fetch("/api/tailor-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: form.customerId || undefined,
        customerName: form.customerName,
        customerPhone: form.customerPhone || undefined,
        description: form.description,
        fabricSource: form.fabricSource,
        fabricDetails: form.fabricDetails || undefined,
        styleImageUrl: form.styleImageUrl || undefined,
        advanceAmount: adv,
        totalAmount: tot,
        deliveryDate: form.deliveryDate || undefined,
        notes: form.notes || undefined,
      }),
    });
    if (r.ok) {
      setShowNew(false);
      setForm(EMPTY_FORM);
      setCustomerMeasurement(null);
      loadOrders();
    } else {
      const data = await r.json();
      alert(data.error ?? "অর্ডার তৈরি করতে ব্যর্থ হয়েছে।");
    }
    setSubmitting(false);
  }

  async function advanceStatus(orderId: string) {
    setAdvancingId(orderId);
    const r = await fetch(`/api/tailor-orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ advanceNext: true }),
    });
    if (r.ok) {
      loadOrders();
    } else {
      const data = await r.json();
      alert(data.error ?? "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।");
    }
    setAdvancingId(null);
  }

  const activeCount = orders.filter(o => o.status !== "delivered").length;
  const todayCount = orders.filter(o => {
    if (!o.deliveryDate || o.status === "delivered") return false;
    const today = new Date(); today.setHours(0,0,0,0);
    const d = new Date(o.deliveryDate); d.setHours(0,0,0,0);
    return d.getTime() === today.getTime();
  }).length;

  const computedDue = () => {
    const adv = parseFloat(form.advanceAmount) || 0;
    const tot = parseFloat(form.totalAmount) || 0;
    return tot - adv;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)" }}>
            <Shirt size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>টেইলর অর্ডার</h1>
            <p className="text-xs" style={{ color: S.muted }}>সব সেলাই অর্ডার</p>
          </div>
        </div>
        <button
          onClick={() => { setShowNew(v => !v); setCustomerMeasurement(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}
        >
          <Plus size={16} /> নতুন অর্ডার
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "চলমান অর্ডার", value: activeCount, color: "#8B5CF6", bg: "#F5F3FF" },
          { label: "আজ Delivery",  value: todayCount,  color: "#D97706", bg: "#FFFBEB" },
          { label: "মোট",         value: orders.length, color: S.text,  bg: S.surface  },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ backgroundColor: s.bg, borderColor: S.border }}>
            <p className="text-xs mb-1" style={{ color: S.muted }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {showNew && (
        <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm" style={{ color: S.text }}>নতুন অর্ডার</h3>
            <button onClick={() => { setShowNew(false); setCustomerMeasurement(null); }}>
              <X size={18} style={{ color: S.muted }} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.secondary }}>কাস্টমার (ঐচ্ছিক)</label>
                <select
                  value={form.customerId}
                  onChange={e => handleCustomerSelect(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                >
                  <option value="">— নতুন কাস্টমার —</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.secondary }}>কাস্টমারের নাম *</label>
                <input
                  required
                  value={form.customerName}
                  onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                  placeholder="নাম লিখুন"
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.secondary }}>মোবাইল নম্বর</label>
                <input
                  value={form.customerPhone}
                  onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.secondary }}>পোশাকের বিবরণ *</label>
                <input
                  required
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                  placeholder="পাঞ্জাবি × ২, শেরওয়ানি × ১..."
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {DESCRIPTION_TEMPLATES.map(t => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setForm(f => ({ ...f, description: f.description ? `${f.description}, ${t}` : t }))}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors hover:opacity-80"
                      style={{ borderColor: "#DDD6FE", backgroundColor: "#F5F3FF", color: "#7C3AED" }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.secondary }}>কাপড়ের উৎস</label>
                <select
                  value={form.fabricSource}
                  onChange={e => setForm(f => ({ ...f, fabricSource: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                >
                  <option value="customer_fabric">কাস্টমারের কাপড়</option>
                  <option value="shop_fabric">দোকানের কাপড়</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.secondary }}>কাপড়ের বিবরণ</label>
                <input
                  value={form.fabricDetails}
                  onChange={e => setForm(f => ({ ...f, fabricDetails: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                  placeholder="সুতি / সিল্ক / লিনেন..."
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.secondary }}>ডেলিভারি তারিখ</label>
                <input
                  type="date"
                  value={form.deliveryDate}
                  onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.secondary }}>স্টাইল রেফারেন্স (URL)</label>
                <input
                  type="url"
                  value={form.styleImageUrl}
                  onChange={e => setForm(f => ({ ...f, styleImageUrl: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.secondary }}>মোট মূল্য (৳)</label>
                <input
                  type="number" min={0}
                  value={form.totalAmount}
                  onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.secondary }}>অগ্রিম (৳)</label>
                <input
                  type="number" min={0}
                  value={form.advanceAmount}
                  onChange={e => setForm(f => ({ ...f, advanceAmount: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                  placeholder="0"
                />
              </div>
            </div>

            {(form.totalAmount || form.advanceAmount) && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" }}>
                <span className="text-xs font-semibold" style={{ color: "#065F46" }}>বাকি:</span>
                <span className="text-sm font-bold" style={{ color: "#059669" }}>{formatBDT(Math.max(0, computedDue()))}</span>
              </div>
            )}

            {form.customerId && (
              <div className="rounded-xl border p-3" style={{ borderColor: "#DDD6FE", backgroundColor: "#F5F3FF" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Ruler size={14} style={{ color: "#7C3AED" }} />
                  <p className="text-xs font-bold" style={{ color: "#7C3AED" }}>সংরক্ষিত মাপ</p>
                </div>
                {loadingMeasurement ? (
                  <p className="text-xs" style={{ color: S.muted }}>লোড হচ্ছে...</p>
                ) : customerMeasurement ? (
                  <div className="grid grid-cols-4 gap-1.5">
                    {MEASURE_FIELDS.map(f => {
                      const val = (customerMeasurement as unknown as Record<string, number | null | string>)[f.key];
                      return (
                        <div key={f.key} className="text-center p-1.5 rounded-lg" style={{ backgroundColor: val != null ? "#EDE9FE" : "#F3F4F6" }}>
                          <p className="text-[9px]" style={{ color: S.muted }}>{f.label}</p>
                          <p className="text-[11px] font-bold" style={{ color: val != null ? "#7C3AED" : "#D1D5DB" }}>
                            {val != null ? `${val}″` : "—"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: S.muted }}>এই কাস্টমারের কোনো মাপ সংরক্ষিত নেই।</p>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: S.secondary }}>নোট</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
                style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                placeholder="বিশেষ নির্দেশনা..."
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 h-10 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}
              >
                {submitting ? "সংরক্ষণ হচ্ছে..." : "অর্ডার তৈরি করুন"}
              </button>
              <button
                type="button"
                onClick={() => { setShowNew(false); setForm(EMPTY_FORM); setCustomerMeasurement(null); }}
                className="px-4 h-10 rounded-xl border text-sm font-medium"
                style={{ borderColor: S.border, backgroundColor: S.surface, color: S.secondary }}
              >
                বাতিল
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 p-1 rounded-xl border overflow-x-auto" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          {["", ...STATUS_FLOW].map(s => {
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
        <button onClick={loadOrders} className="p-2 rounded-xl border" style={{ borderColor: S.border, backgroundColor: S.surface, color: S.muted }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ backgroundColor: S.surface }} />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#F5F3FF" }}>
            <Shirt size={28} style={{ color: "#8B5CF6" }} />
          </div>
          <p className="font-semibold text-sm" style={{ color: S.secondary }}>কোনো অর্ডার নেই</p>
          <p className="text-xs mt-1" style={{ color: S.muted }}>নতুন অর্ডার নিন বা ফিল্টার পরিবর্তন করুন</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map(o => {
            const st = STATUS_LABELS[o.status] ?? STATUS_LABELS.received;
            const urg = urgencyLabel(o.deliveryDate, o.status);
            const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(o.status) + 1];
            const nextLabel = nextStatus ? STATUS_LABELS[nextStatus]?.label : null;
            const expanded = expandedId === o.id;

            return (
              <div
                key={o.id}
                className="rounded-2xl border overflow-hidden"
                style={{ backgroundColor: S.surface, borderColor: S.border }}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                        {urg && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: urg.bg, color: urg.color }}>
                            {urg.label}
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F3F4F6", color: S.muted }}>
                          {FABRIC_LABELS[o.fabricSource] ?? o.fabricSource}
                        </span>
                      </div>
                      <p className="text-sm font-bold" style={{ color: S.text }}>{o.customerName}</p>
                      {o.customerPhone && <p className="text-xs" style={{ color: S.muted }}>{o.customerPhone}</p>}
                      <p className="text-xs mt-0.5" style={{ color: S.secondary }}>{o.description}</p>
                      {o.deliveryDate && (
                        <p className="text-xs mt-1 flex items-center gap-1" style={{ color: S.muted }}>
                          <Calendar size={11} /> ডেলিভারি: {fmtDate(o.deliveryDate)}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold" style={{ color: S.text }}>{formatBDT(o.totalAmount)}</p>
                      {o.dueAmount > 0 && (
                        <p className="text-xs" style={{ color: "#EF4444" }}>বাকি {formatBDT(o.dueAmount)}</p>
                      )}
                      <button
                        onClick={() => setExpandedId(expanded ? null : o.id)}
                        className="mt-2 flex items-center gap-1 text-xs font-medium ml-auto"
                        style={{ color: S.secondary }}
                      >
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        বিস্তারিত
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="mt-3 pt-3 border-t space-y-3" style={{ borderColor: S.border }}>
                      {(o.fabricDetails || o.styleImageUrl) && (
                        <div className="flex flex-wrap gap-2">
                          {o.fabricDetails && (
                            <span className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: "#FFFBEB", color: "#92400E" }}>
                              🧵 {o.fabricDetails}
                            </span>
                          )}
                          {o.styleImageUrl && (
                            <a href={o.styleImageUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 rounded-lg underline" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>
                              🖼️ স্টাইল রেফারেন্স
                            </a>
                          )}
                        </div>
                      )}

                      {o.measurements && (
                        <div className="rounded-xl p-3" style={{ backgroundColor: "#F5F3FF" }}>
                          <p className="text-[10px] font-bold mb-2" style={{ color: "#7C3AED" }}>
                            <Ruler size={10} className="inline mr-1" /> মাপ (অর্ডারের সময় নেওয়া)
                          </p>
                          <div className="grid grid-cols-4 gap-1.5">
                            {MEASURE_FIELDS.map(f => {
                              const val = (o.measurements as Record<string, number | null | string>)?.[f.key];
                              return (
                                <div key={f.key} className="text-center p-1.5 rounded-lg" style={{ backgroundColor: val != null ? "#EDE9FE" : "#F3F4F6" }}>
                                  <p className="text-[9px]" style={{ color: S.muted }}>{f.label}</p>
                                  <p className="text-[11px] font-bold" style={{ color: val != null ? "#7C3AED" : "#D1D5DB" }}>
                                    {val != null ? `${val}″` : "—"}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {o.notes && (
                        <p className="text-xs rounded-xl p-3" style={{ backgroundColor: "#FFFBEB", color: "#92400E" }}>
                          📝 {o.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex gap-1 overflow-x-auto pb-1">
                            {STATUS_FLOW.map((s, idx) => {
                              const sInfo = STATUS_LABELS[s];
                              const currentIdx = STATUS_FLOW.indexOf(o.status);
                              const done = idx <= currentIdx;
                              return (
                                <div
                                  key={s}
                                  className="flex-shrink-0 px-2 py-1 rounded-lg text-[10px] font-semibold"
                                  style={{
                                    backgroundColor: done ? sInfo.bg : "#F3F4F6",
                                    color: done ? sInfo.color : "#D1D5DB",
                                  }}
                                >
                                  {sInfo.label}
                                </div>
                              );
                            })}
                          </div>
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
      )}
    </div>
  );
}
