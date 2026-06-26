"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  PartyPopper, Plus, X, Loader2, Calendar, List,
  Users, Clock, ChevronLeft, ChevronRight, Trash2,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";
import DatePicker from "@/components/ui/DatePicker";

interface Hall {
  id: string;
  name: string;
  capacity: number;
  ratePerDay: number;
}

interface EventPackage {
  id: string;
  name: string;
  price: number;
  includes: Array<{ item: string; value: string }>;
  isActive?: boolean;
}

interface HallEvent {
  id: string;
  bookingNumber: string;
  clientName: string;
  clientPhone: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  totalAmount: number;
  advancePaid: number;
  dueAmount: number;
  status: string;
  hall: { id: string; name: string; capacity: number };
  package: { id: string; name: string; price: number } | null;
}

const EVENT_TYPES = [
  { value: "wedding",   label: "💍 বিবাহ" },
  { value: "birthday",  label: "🎂 জন্মদিন" },
  { value: "aqiqa",     label: "👶 আকিকা" },
  { value: "corporate", label: "💼 Corporate" },
  { value: "seminar",   label: "🎓 Seminar" },
  { value: "mehndi",    label: "💃 Mehndi/Reception" },
  { value: "reception", label: "🎉 Reception" },
  { value: "other",     label: "🎊 অন্যান্য" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  enquiry:      { label: "Enquiry",    color: "#6B7280", bg: "#F3F4F6" },
  confirmed:    { label: "নিশ্চিত",   color: "#3B82F6", bg: "#EFF6FF" },
  advance_paid: { label: "অগ্রিম দেওয়া", color: "#7C3AED", bg: "#F5F3FF" },
  completed:    { label: "সম্পন্ন",   color: "#0F6E56", bg: "#E1F5EE" },
  cancelled:    { label: "বাতিল",     color: "#EF4444", bg: "#FEE2E2" },
};

const PAYMENT_METHODS = [
  { value: "cash",  label: "নগদ" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "bank",  label: "Bank Transfer" },
];

const VENDOR_CATEGORIES = [
  { value: "catering",     label: "Catering" },
  { value: "decoration",   label: "Decoration" },
  { value: "photography",  label: "Photography" },
  { value: "dj_music",     label: "DJ / Music" },
  { value: "cake",         label: "Cake" },
  { value: "transport",    label: "Transport" },
  { value: "other",        label: "অন্যান্য" },
];

const TABS = [
  { value: "all",       label: "সব" },
  { value: "upcoming",  label: "আসন্ন" },
  { value: "completed", label: "সম্পন্ন" },
  { value: "cancelled", label: "বাতিল" },
];

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  bg: "var(--c-bg)",
};

const emptyBooking = () => ({
  clientName: "", clientPhone: "", clientAddress: "",
  eventType: "wedding", eventDate: "", startTime: "10:00", endTime: "22:00", setupTime: "",
  guestCount: "", hallId: "", packageId: "",
  customItems: [] as Array<{ desc: string; price: string }>,
  discount: "", totalAmount: "", advancePaid: "", paymentMethod: "cash", paymentNote: "",
  vendors: [] as Array<{ category: string; vendorName: string; contactPhone: string; quotedAmount: string }>,
  internalNotes: "",
});

export default function EventsBoard() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<HallEvent[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [packages, setPackages] = useState<EventPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [showNewBooking, setShowNewBooking] = useState(searchParams.get("new") === "1");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyBooking());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [calMonth, setCalMonth] = useState(new Date());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [evRes, hallRes, pkgRes] = await Promise.all([
      fetch("/api/convention/events"),
      fetch("/api/convention/halls"),
      fetch("/api/convention/packages"),
    ]);
    if (evRes.ok) setEvents(await evRes.json());
    if (hallRes.ok) setHalls(await hallRes.json());
    if (pkgRes.ok) setPackages(await pkgRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredEvents = events.filter((ev) => {
    if (activeTab === "upcoming") {
      return !["cancelled", "completed"].includes(ev.status) && new Date(ev.eventDate) >= new Date();
    }
    if (activeTab === "completed") return ev.status === "completed";
    if (activeTab === "cancelled") return ev.status === "cancelled";
    return true;
  });

  const selectedPackage = packages.find((p) => p.id === form.packageId);
  const packageTotal = selectedPackage ? selectedPackage.price : 0;
  const customTotal = form.customItems.reduce((s, x) => s + (parseFloat(x.price) || 0), 0);
  const discount = parseFloat(form.discount) || 0;
  const computedTotal = packageTotal + customTotal - discount;
  const advance = parseFloat(form.advancePaid) || 0;
  const due = Math.max(0, computedTotal - advance);

  const handleSubmit = async () => {
    if (!form.clientName || !form.clientPhone || !form.hallId || !form.eventDate) {
      setError("সব প্রয়োজনীয় তথ্য পূরণ করুন।");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/convention/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          guestCount: Number(form.guestCount),
          totalAmount: computedTotal,
          advancePaid: advance,
          vendors: form.vendors.filter((v) => v.vendorName),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "কোনো সমস্যা হয়েছে।");
        return;
      }
      setShowNewBooking(false);
      setForm(emptyBooking());
      setStep(1);
      fetchAll();
    } catch {
      setError("নেটওয়ার্ক সমস্যা হয়েছে।");
    } finally {
      setSaving(false);
    }
  };

  const addVendor = () => {
    setForm((f) => ({
      ...f,
      vendors: [...f.vendors, { category: "catering", vendorName: "", contactPhone: "", quotedAmount: "" }],
    }));
  };

  const addCustomItem = () => {
    setForm((f) => ({ ...f, customItems: [...f.customItems, { desc: "", price: "" }] }));
  };

  // Calendar helpers
  const calStart = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1);
  const calEnd = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0);
  const calDays: (Date | null)[] = [];
  for (let i = 0; i < calStart.getDay(); i++) calDays.push(null);
  for (let d = 1; d <= calEnd.getDate(); d++) calDays.push(new Date(calMonth.getFullYear(), calMonth.getMonth(), d));

  const eventsByDate: Record<string, HallEvent[]> = {};
  for (const ev of events) {
    if (ev.status === "cancelled") continue;
    const key = new Date(ev.eventDate).toISOString().split("T")[0];
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(ev);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: "#7C3AED" }} />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: S.text }}>ইভেন্ট বুকিং</h1>
          <p className="text-xs" style={{ color: S.muted }}>{events.length}টি মোট বুকিং</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: S.border }}>
            <button
              onClick={() => setViewMode("list")}
              className="p-2"
              style={{ backgroundColor: viewMode === "list" ? "#F5F3FF" : S.bg }}
            >
              <List size={15} style={{ color: viewMode === "list" ? "#7C3AED" : S.muted }} />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className="p-2"
              style={{ backgroundColor: viewMode === "calendar" ? "#F5F3FF" : S.bg }}
            >
              <Calendar size={15} style={{ color: viewMode === "calendar" ? "#7C3AED" : S.muted }} />
            </button>
          </div>
          <button
            onClick={() => { setShowNewBooking(true); setStep(1); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "#7C3AED" }}
          >
            <Plus size={15} /> নতুন বুকিং
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveTab(t.value)}
            className="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={{
              backgroundColor: activeTab === t.value ? "#7C3AED" : S.surface,
              color: activeTab === t.value ? "#fff" : S.muted,
              border: `1px solid ${activeTab === t.value ? "#7C3AED" : S.border}`,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}>
              <ChevronLeft size={18} style={{ color: S.muted }} />
            </button>
            <h3 className="text-sm font-bold" style={{ color: S.text }}>
              {calMonth.toLocaleDateString("bn-BD", { year: "numeric", month: "long" })}
            </h3>
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}>
              <ChevronRight size={18} style={{ color: S.muted }} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"].map((d) => (
              <div key={d} className="text-[10px] font-bold pb-1" style={{ color: S.muted }}>{d}</div>
            ))}
            {calDays.map((d, i) => {
              if (!d) return <div key={`empty-${i}`} />;
              const key = d.toISOString().split("T")[0];
              const dayEvents = eventsByDate[key] ?? [];
              const isToday = key === new Date().toISOString().split("T")[0];
              return (
                <div
                  key={key}
                  className="rounded-lg p-1 text-center cursor-pointer"
                  style={{
                    backgroundColor: isToday ? "#F5F3FF" : dayEvents.length ? "#E1F5EE" : "transparent",
                    border: `1px solid ${isToday ? "#7C3AED" : dayEvents.length ? "#0F6E56" : "transparent"}`,
                    minHeight: 40,
                  }}
                >
                  <p className="text-[11px] font-semibold" style={{ color: isToday ? "#7C3AED" : S.text }}>{d.getDate()}</p>
                  {dayEvents.length > 0 && (
                    <p className="text-[9px] font-bold" style={{ color: "#0F6E56" }}>{dayEvents.length}টি</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        filteredEvents.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <PartyPopper size={40} className="mx-auto mb-3 opacity-30" style={{ color: S.muted }} />
            <p className="text-sm font-medium" style={{ color: S.muted }}>কোনো ইভেন্ট বুকিং নেই</p>
            <button
              onClick={() => setShowNewBooking(true)}
              className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "#7C3AED" }}
            >
              প্রথম বুকিং নিন
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((ev) => {
              const statusCfg = STATUS_CONFIG[ev.status] ?? STATUS_CONFIG.confirmed;
              const evDate = new Date(ev.eventDate);
              return (
                <Link
                  key={ev.id}
                  href={`/convention/events/${ev.id}`}
                  className="block rounded-2xl p-4 border transition-all hover:shadow-md"
                  style={{ backgroundColor: S.surface, borderColor: S.border }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold" style={{ color: S.text }}>{ev.clientName}</p>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                        >
                          {statusCfg.label}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}>
                          {ev.bookingNumber}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: S.muted }}>
                        {EVENT_TYPES.find((t) => t.value === ev.eventType)?.label ?? ev.eventType} · {ev.hall.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar size={11} style={{ color: S.muted }} />
                          <span className="text-[11px]" style={{ color: S.muted }}>
                            {evDate.toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={11} style={{ color: S.muted }} />
                          <span className="text-[11px]" style={{ color: S.muted }}>{ev.startTime} - {ev.endTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={11} style={{ color: S.muted }} />
                          <span className="text-[11px]" style={{ color: S.muted }}>{ev.guestCount} জন</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold" style={{ color: S.text }}>{formatBDT(ev.totalAmount)}</p>
                      {ev.dueAmount > 0 && (
                        <p className="text-[11px] font-bold mt-0.5" style={{ color: "#EF4444" }}>বাকি {formatBDT(ev.dueAmount)}</p>
                      )}
                      {ev.dueAmount === 0 && (
                        <p className="text-[11px] font-bold mt-0.5" style={{ color: "#0F6E56" }}>পরিশোধিত</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      )}

      {/* New Booking Modal - Multi-step */}
      {showNewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl p-5 w-full max-w-2xl max-h-[95vh] overflow-y-auto" style={{ backgroundColor: S.surface }}>
            {/* Step Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-base" style={{ color: S.text }}>নতুন ইভেন্ট বুকিং</h2>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4].map((s) => (
                    <div
                      key={s}
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: s === step ? 24 : 8,
                        backgroundColor: s <= step ? "#7C3AED" : S.border,
                      }}
                    />
                  ))}
                  <p className="text-[11px] ml-1" style={{ color: S.muted }}>ধাপ {step}/4</p>
                </div>
              </div>
              <button onClick={() => { setShowNewBooking(false); setStep(1); setForm(emptyBooking()); setError(""); }}>
                <X size={20} style={{ color: S.muted }} />
              </button>
            </div>

            {error && (
              <div className="mb-3 px-3 py-2 rounded-xl text-sm" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
                {error}
              </div>
            )}

            {/* Step 1: ইভেন্ট তথ্য */}
            {step === 1 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold" style={{ color: S.text }}>ধাপ ১: ইভেন্ট তথ্য</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>ক্লায়েন্টের নাম *</label>
                    <input
                      value={form.clientName}
                      onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                      placeholder="মোঃ রাহিম"
                      className="w-full px-3 py-2 rounded-xl border text-sm"
                      style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>ফোন নম্বর *</label>
                    <input
                      value={form.clientPhone}
                      onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))}
                      placeholder="01XXXXXXXXX"
                      className="w-full px-3 py-2 rounded-xl border text-sm"
                      style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>ঠিকানা</label>
                  <input
                    value={form.clientAddress}
                    onChange={(e) => setForm((f) => ({ ...f, clientAddress: e.target.value }))}
                    placeholder="ক্লায়েন্টের ঠিকানা"
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: S.text }}>ইভেন্টের ধরন *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {EVENT_TYPES.map((et) => (
                      <button
                        key={et.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, eventType: et.value }))}
                        className="px-2 py-2 rounded-xl border text-xs font-medium text-center"
                        style={{
                          backgroundColor: form.eventType === et.value ? "#F5F3FF" : S.bg,
                          borderColor: form.eventType === et.value ? "#7C3AED" : S.border,
                          color: form.eventType === et.value ? "#7C3AED" : S.muted,
                        }}
                      >
                        {et.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>তারিখ *</label>
                    <DatePicker
  value={form.eventDate}
  onChange={v => setForm((f) => ({ ...f, eventDate: v }))}
  className="w-full px-3 py-2 rounded-xl border text-sm"
  style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>মোট অতিথি *</label>
                    <input
                      type="number"
                      value={form.guestCount}
                      onChange={(e) => setForm((f) => ({ ...f, guestCount: e.target.value }))}
                      placeholder="200"
                      className="w-full px-3 py-2 rounded-xl border text-sm"
                      style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>শুরুর সময় *</label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border text-sm"
                      style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>শেষের সময় *</label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border text-sm"
                      style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>Setup শুরুর সময়</label>
                    <input
                      type="time"
                      value={form.setupTime}
                      onChange={(e) => setForm((f) => ({ ...f, setupTime: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border text-sm"
                      style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: S.text }}>হল নির্বাচন করুন *</label>
                  <div className="space-y-2">
                    {halls.filter((h) => (h as Hall & { isActive?: boolean }).isActive !== false).map((hall) => (
                      <button
                        key={hall.id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, hallId: hall.id }))}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left"
                        style={{
                          backgroundColor: form.hallId === hall.id ? "#F5F3FF" : S.bg,
                          borderColor: form.hallId === hall.id ? "#7C3AED" : S.border,
                        }}
                      >
                        <div>
                          <p className="text-sm font-semibold" style={{ color: form.hallId === hall.id ? "#7C3AED" : S.text }}>{hall.name}</p>
                          <p className="text-[11px]" style={{ color: S.muted }}>সর্বোচ্চ {hall.capacity} জন</p>
                        </div>
                        <p className="text-sm font-bold" style={{ color: form.hallId === hall.id ? "#7C3AED" : S.text }}>{formatBDT(hall.ratePerDay)}/দিন</p>
                      </button>
                    ))}
                    {halls.length === 0 && (
                      <p className="text-xs text-center py-3" style={{ color: S.muted }}>
                        কোনো হল পাওয়া যায়নি। আগে হল যোগ করুন।
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Package ও অতিরিক্ত সেবা */}
            {step === 2 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold" style={{ color: S.text }}>ধাপ ২: Package ও অতিরিক্ত সেবা</h3>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, packageId: "" }))}
                    className="w-full px-3 py-2.5 rounded-xl border text-left"
                    style={{
                      backgroundColor: form.packageId === "" ? "#F5F3FF" : S.bg,
                      borderColor: form.packageId === "" ? "#7C3AED" : S.border,
                    }}
                  >
                    <p className="text-sm font-semibold" style={{ color: form.packageId === "" ? "#7C3AED" : S.text }}>Custom (কোনো প্যাকেজ নেই)</p>
                    <p className="text-[11px]" style={{ color: S.muted }}>নিজে আইটেম যোগ করুন</p>
                  </button>

                  {packages.filter((p) => p.isActive !== false).map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, packageId: pkg.id }))}
                      className="w-full px-3 py-2.5 rounded-xl border text-left"
                      style={{
                        backgroundColor: form.packageId === pkg.id ? "#F5F3FF" : S.bg,
                        borderColor: form.packageId === pkg.id ? "#7C3AED" : S.border,
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: form.packageId === pkg.id ? "#7C3AED" : S.text }}>{pkg.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {pkg.includes.map((inc, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}>
                                {inc.item}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm font-bold flex-shrink-0 ml-2" style={{ color: "#7C3AED" }}>{formatBDT(pkg.price)}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold" style={{ color: S.text }}>অতিরিক্ত আইটেম</label>
                    <button onClick={addCustomItem} className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ backgroundColor: "#F5F3FF", color: "#7C3AED" }}>
                      + যোগ করুন
                    </button>
                  </div>
                  {form.customItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input
                        value={item.desc}
                        onChange={(e) => {
                          const updated = [...form.customItems];
                          updated[idx] = { ...updated[idx], desc: e.target.value };
                          setForm((f) => ({ ...f, customItems: updated }));
                        }}
                        placeholder="আইটেমের বিবরণ"
                        className="flex-1 px-2.5 py-2 rounded-xl border text-xs"
                        style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                      />
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => {
                          const updated = [...form.customItems];
                          updated[idx] = { ...updated[idx], price: e.target.value };
                          setForm((f) => ({ ...f, customItems: updated }));
                        }}
                        placeholder="মূল্য (৳)"
                        className="w-28 px-2.5 py-2 rounded-xl border text-xs"
                        style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                      />
                      <button
                        onClick={() => setForm((f) => ({ ...f, customItems: f.customItems.filter((_, i) => i !== idx) }))}
                        className="p-2 rounded-xl"
                        style={{ backgroundColor: "#FEE2E2" }}
                      >
                        <Trash2 size={12} style={{ color: "#EF4444" }} />
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>ছাড় (৳)</label>
                  <input
                    type="number"
                    value={form.discount}
                    onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                  />
                </div>

                <div className="rounded-xl p-3" style={{ backgroundColor: "#F5F3FF" }}>
                  <div className="flex justify-between text-xs mb-1" style={{ color: S.muted }}>
                    <span>প্যাকেজ মূল্য</span><span>{formatBDT(packageTotal)}</span>
                  </div>
                  {customTotal > 0 && (
                    <div className="flex justify-between text-xs mb-1" style={{ color: S.muted }}>
                      <span>অতিরিক্ত</span><span>{formatBDT(customTotal)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-xs mb-1" style={{ color: "#EF4444" }}>
                      <span>ছাড়</span><span>- {formatBDT(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1" style={{ borderColor: "#DDD6FE", color: "#7C3AED" }}>
                    <span>মোট</span><span>{formatBDT(computedTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Vendor Assignment */}
            {step === 3 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold" style={{ color: S.text }}>ধাপ ৩: Vendor (ঐচ্ছিক)</h3>

                {form.vendors.map((vendor, idx) => (
                  <div key={idx} className="rounded-xl p-3 border space-y-2" style={{ borderColor: S.border, backgroundColor: S.bg }}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold" style={{ color: S.text }}>Vendor {idx + 1}</p>
                      <button
                        onClick={() => setForm((f) => ({ ...f, vendors: f.vendors.filter((_, i) => i !== idx) }))}
                        className="p-1 rounded-lg"
                        style={{ backgroundColor: "#FEE2E2" }}
                      >
                        <X size={12} style={{ color: "#EF4444" }} />
                      </button>
                    </div>
                    <select
                      value={vendor.category}
                      onChange={(e) => {
                        const updated = [...form.vendors];
                        updated[idx] = { ...updated[idx], category: e.target.value };
                        setForm((f) => ({ ...f, vendors: updated }));
                      }}
                      className="w-full px-3 py-2 rounded-xl border text-sm"
                      style={{ backgroundColor: S.surface, borderColor: S.border, color: S.text }}
                    >
                      {VENDOR_CATEGORIES.map((vc) => (
                        <option key={vc.value} value={vc.value}>{vc.label}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={vendor.vendorName}
                        onChange={(e) => {
                          const updated = [...form.vendors];
                          updated[idx] = { ...updated[idx], vendorName: e.target.value };
                          setForm((f) => ({ ...f, vendors: updated }));
                        }}
                        placeholder="Vendor নাম *"
                        className="px-3 py-2 rounded-xl border text-sm"
                        style={{ backgroundColor: S.surface, borderColor: S.border, color: S.text }}
                      />
                      <input
                        value={vendor.contactPhone}
                        onChange={(e) => {
                          const updated = [...form.vendors];
                          updated[idx] = { ...updated[idx], contactPhone: e.target.value };
                          setForm((f) => ({ ...f, vendors: updated }));
                        }}
                        placeholder="ফোন নম্বর"
                        className="px-3 py-2 rounded-xl border text-sm"
                        style={{ backgroundColor: S.surface, borderColor: S.border, color: S.text }}
                      />
                    </div>
                    <input
                      type="number"
                      value={vendor.quotedAmount}
                      onChange={(e) => {
                        const updated = [...form.vendors];
                        updated[idx] = { ...updated[idx], quotedAmount: e.target.value };
                        setForm((f) => ({ ...f, vendors: updated }));
                      }}
                      placeholder="কোটেড পরিমাণ (৳)"
                      className="w-full px-3 py-2 rounded-xl border text-sm"
                      style={{ backgroundColor: S.surface, borderColor: S.border, color: S.text }}
                    />
                  </div>
                ))}

                <button
                  onClick={addVendor}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold"
                  style={{ borderColor: "#7C3AED", color: "#7C3AED", borderStyle: "dashed" }}
                >
                  <Plus size={14} /> Vendor যোগ করুন
                </button>

                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>অভ্যন্তরীণ নোট (স্টাফের জন্য)</label>
                  <textarea
                    value={form.internalNotes}
                    onChange={(e) => setForm((f) => ({ ...f, internalNotes: e.target.value }))}
                    rows={2}
                    placeholder="স্টাফকে জানানোর কথা..."
                    className="w-full px-3 py-2 rounded-xl border text-sm resize-none"
                    style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Payment */}
            {step === 4 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold" style={{ color: S.text }}>ধাপ ৪: পেমেন্ট ও নিশ্চিতকরণ</h3>

                <div className="rounded-xl p-4" style={{ backgroundColor: "#F5F3FF" }}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: S.muted }}>মোট পরিমাণ</span>
                    <span className="font-bold" style={{ color: "#7C3AED" }}>{formatBDT(computedTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-0.5" style={{ color: S.muted }}>
                    <span>সর্বনিম্ন অগ্রিম (৩০%)</span>
                    <span className="font-semibold">{formatBDT(computedTotal * 0.30)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>অগ্রিম পরিমাণ (৳) *</label>
                  <input
                    type="number"
                    value={form.advancePaid}
                    onChange={(e) => setForm((f) => ({ ...f, advancePaid: e.target.value }))}
                    placeholder={String(Math.round(computedTotal * 0.30))}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: S.text }}>পেমেন্ট পদ্ধতি</label>
                  <div className="grid grid-cols-4 gap-2">
                    {PAYMENT_METHODS.map((pm) => (
                      <button
                        key={pm.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, paymentMethod: pm.value }))}
                        className="py-2 rounded-xl border text-xs font-medium"
                        style={{
                          backgroundColor: form.paymentMethod === pm.value ? "#F5F3FF" : S.bg,
                          borderColor: form.paymentMethod === pm.value ? "#7C3AED" : S.border,
                          color: form.paymentMethod === pm.value ? "#7C3AED" : S.muted,
                        }}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>পেমেন্ট নোট</label>
                  <input
                    value={form.paymentNote}
                    onChange={(e) => setForm((f) => ({ ...f, paymentNote: e.target.value }))}
                    placeholder="পেমেন্ট সংক্রান্ত নোট"
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                  />
                </div>

                {advance > 0 && (
                  <div className="rounded-xl p-3" style={{ backgroundColor: "#E1F5EE" }}>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "#0F6E56" }}>অগ্রিম</span>
                      <span className="font-bold" style={{ color: "#0F6E56" }}>{formatBDT(advance)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-0.5">
                      <span style={{ color: "#EF4444" }}>বাকি</span>
                      <span className="font-bold" style={{ color: "#EF4444" }}>{formatBDT(due)}</span>
                    </div>
                  </div>
                )}

                <div className="rounded-xl p-3 border" style={{ borderColor: S.border, backgroundColor: S.bg }}>
                  <p className="text-xs font-bold mb-1" style={{ color: S.text }}>বুকিং সারসংক্ষেপ</p>
                  <p className="text-[11px]" style={{ color: S.muted }}>
                    ক্লায়েন্ট: {form.clientName} · {form.clientPhone}
                  </p>
                  <p className="text-[11px]" style={{ color: S.muted }}>
                    ইভেন্ট: {EVENT_TYPES.find((t) => t.value === form.eventType)?.label} · {halls.find((h) => h.id === form.hallId)?.name}
                  </p>
                  <p className="text-[11px]" style={{ color: S.muted }}>
                    তারিখ: {form.eventDate} · সময়: {form.startTime} - {form.endTime}
                  </p>
                  <p className="text-[11px]" style={{ color: S.muted }}>অতিথি: {form.guestCount} জন</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-2 mt-4">
              {step > 1 && (
                <button
                  onClick={() => { setStep((s) => s - 1); setError(""); }}
                  className="flex-1 py-2.5 rounded-xl border text-sm font-semibold"
                  style={{ borderColor: S.border, color: S.text }}
                >
                  পেছনে
                </button>
              )}
              {step < 4 ? (
                <button
                  onClick={() => {
                    if (step === 1 && (!form.clientName || !form.clientPhone || !form.hallId || !form.eventDate || !form.guestCount)) {
                      setError("সব প্রয়োজনীয় তথ্য পূরণ করুন।");
                      return;
                    }
                    setError("");
                    setStep((s) => s + 1);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold"
                  style={{ backgroundColor: "#7C3AED" }}
                >
                  পরবর্তী
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#7C3AED" }}
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  বুকিং নিশ্চিত করুন
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
