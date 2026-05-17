"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, CalendarRange, Search, X, Check, ChevronRight } from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";

const S = {
  surface: "var(--c-surface)",
  border:  "var(--c-border)",
  text:    "var(--c-text)",
  muted:   "var(--c-text-muted)",
  primary: "#EA580C",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: "💍 বিয়ে", birthday: "🎂 জন্মদিন", aqiqa: "🐑 আকিকা",
  corporate: "🏢 Corporate", mehndi: "💜 মেহেন্দি", other: "✨ অন্যান্য",
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  enquiry:      { label: "তদন্ত",        bg: "#F3F4F6", color: "#374151" },
  confirmed:    { label: "নিশ্চিত",      bg: "#DCFCE7", color: "#166534" },
  advance_paid: { label: "অগ্রিম পাওয়া", bg: "#DBEAFE", color: "#1E40AF" },
  preparation:  { label: "Preparation",  bg: "#FEF3C7", color: "#92400E" },
  completed:    { label: "সম্পন্ন",      bg: "#D1FAE5", color: "#065F46" },
  cancelled:    { label: "বাতিল",        bg: "#FEE2E2", color: "#991B1B" },
};

const MEAL_LABELS: Record<string, string> = {
  breakfast: "সকাল", lunch: "দুপুর", dinner: "রাত", snacks: "স্ন্যাকস",
};

const CAT_LABELS: Record<string, string> = {
  main: "মূল খাবার", starter: "স্টার্টার", drink: "পানীয়",
  dessert: "ডেজার্ট", snack: "স্ন্যাকস", side: "সাইড",
};

type TemplateItem = { id?: string; itemName: string; category: string; perHeadCost: number; quantity?: string };
type Template = { id: string; name: string; type: string; perHeadPrice: number; items: TemplateItem[] };
type Event = {
  id: string; bookingNumber: string; clientName: string; clientPhone: string;
  eventType: string; eventDate: string; eventTime: string | null; venue: string;
  guestCount: number; status: string; totalAmount: number; dueAmount: number;
  advancePaid: number; profit: number; staffNeeded: number | null;
};

type FormItem = { itemName: string; category: string; perHeadCost: string; quantity: string };
const emptyItem = (): FormItem => ({ itemName: "", category: "main", perHeadCost: "", quantity: "" });

const FILTERS = [
  { key: "", label: "সব" },
  { key: "thisMonth", label: "এই মাস" },
  { key: "upcoming", label: "আসন্ন" },
  { key: "preparation", label: "Preparation" },
  { key: "completed", label: "Completed" },
];

export default function CateringEventsPage() {
  const [events, setEvents]       = useState<Event[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("");
  const [search, setSearch]       = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [step, setStep]           = useState(1);

  // Form state
  const [clientName, setClientName]     = useState("");
  const [clientPhone, setClientPhone]   = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [eventType, setEventType]       = useState("wedding");
  const [eventDate, setEventDate]       = useState("");
  const [eventTime, setEventTime]       = useState("");
  const [venue, setVenue]               = useState("");
  const [guestCount, setGuestCount]     = useState("100");
  const [mealTypes, setMealTypes]       = useState<string[]>(["lunch"]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [customItems, setCustomItems]   = useState<FormItem[]>([emptyItem()]);
  const [sellingPrice, setSellingPrice] = useState("");
  const [staffNeeded, setStaffNeeded]   = useState("");
  const [equipmentNote, setEquipmentNote] = useState("");
  const [advancePaid, setAdvancePaid]   = useState("");
  const [notes, setNotes]               = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [er, tr] = await Promise.all([
      fetch(`/api/catering/events?filter=${filter}`),
      fetch("/api/catering/menus"),
    ]);
    if (er.ok) setEvents(await er.json());
    if (tr.ok) setTemplates(await tr.json());
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setStep(1);
    setClientName(""); setClientPhone(""); setClientAddress("");
    setEventType("wedding"); setEventDate(""); setEventTime(""); setVenue("");
    setGuestCount("100"); setMealTypes(["lunch"]);
    setSelectedTemplate(null); setCustomItems([emptyItem()]);
    setSellingPrice(""); setStaffNeeded(""); setEquipmentNote(""); setAdvancePaid(""); setNotes("");
    setShowModal(true);
  }

  function toggleMeal(m: string) {
    setMealTypes(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  }

  const allItems: TemplateItem[] = [
    ...(selectedTemplate ? selectedTemplate.items : []),
    ...customItems.filter(i => i.itemName).map(i => ({ itemName: i.itemName, category: i.category, perHeadCost: Number(i.perHeadCost) || 0, quantity: i.quantity })),
  ];
  const totalPerHead = allItems.reduce((s, i) => s + (Number(i.perHeadCost) || 0), 0);
  const guests       = Number(guestCount) || 0;
  const totalCost    = totalPerHead * guests;
  const suggested    = Math.round(totalCost * 1.3);
  const selling      = Number(sellingPrice) || suggested;
  const profit       = selling - totalCost;
  const advance      = Number(advancePaid) || 0;
  const dueAmount    = selling - advance;

  function autoShoppingList() {
    return allItems.map(item => ({
      item: item.itemName,
      qty:  item.quantity ? `${item.quantity} × ${guests} জন` : `${guests} জন`,
      cat:  item.category,
    }));
  }

  async function submit() {
    if (!clientName || !clientPhone || !eventType || !eventDate || !venue || !guestCount) return;
    setSaving(true);
    const body = {
      clientName, clientPhone, clientAddress, eventType,
      eventDate, eventTime, venue, guestCount: Number(guestCount),
      mealTypes, templateId: selectedTemplate?.id || null,
      customItems: customItems.filter(i => i.itemName).map(i => ({
        itemName: i.itemName, category: i.category,
        perHeadCost: Number(i.perHeadCost) || 0, quantity: i.quantity,
      })),
      perHeadCost:  totalPerHead,
      totalCost,
      totalAmount:  selling,
      advancePaid:  advance,
      staffNeeded:  staffNeeded ? Number(staffNeeded) : null,
      equipmentNote, notes,
      shoppingList: autoShoppingList(),
    };
    const r = await fetch("/api/catering/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) { setShowModal(false); load(); }
    setSaving(false);
  }

  const filtered = events.filter(e =>
    !search || e.clientName.toLowerCase().includes(search.toLowerCase()) ||
    e.bookingNumber.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: S.primary }} />
    </div>
  );

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFF7ED" }}>
            <CalendarRange size={20} style={{ color: S.primary }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: S.text }}>ইভেন্ট বুকিং</h1>
            <p className="text-xs" style={{ color: S.muted }}>{events.length}টি ইভেন্ট</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: S.primary }}>
          <Plus size={16} /> নতুন বুকিং
        </button>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
              style={{
                backgroundColor: filter === f.key ? S.primary : S.surface,
                color:           filter === f.key ? "white" : S.muted,
                borderColor:     filter === f.key ? S.primary : S.border,
              }}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border rounded-xl text-sm"
            style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
            placeholder="নাম বা বুকিং নম্বর..." />
        </div>
      </div>

      {/* Events List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed" style={{ borderColor: S.border }}>
          <CalendarRange size={40} className="mx-auto mb-3" style={{ color: S.muted }} />
          <p className="font-medium" style={{ color: S.muted }}>কোনো ইভেন্ট পাওয়া যায়নি</p>
          <button onClick={openCreate} className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: S.primary }}>
            নতুন বুকিং করুন
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ev => {
            const st  = STATUS_CONFIG[ev.status] ?? STATUS_CONFIG.confirmed;
            const d   = new Date(ev.eventDate);
            const diffDays = Math.ceil((d.getTime() - Date.now()) / 86400000);
            return (
              <Link key={ev.id} href={`/catering/events/${ev.id}`}>
                <div className="rounded-2xl border p-4 flex items-center gap-4 hover:border-orange-300 transition-colors cursor-pointer"
                  style={{ backgroundColor: S.surface, borderColor: S.border }}>
                  {/* Date Block */}
                  <div className="shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center border text-center"
                    style={{ backgroundColor: "#FFF7ED", borderColor: "#FDBA74" }}>
                    <span className="text-lg font-bold leading-none" style={{ color: S.primary }}>{d.getDate()}</span>
                    <span className="text-[10px] font-medium" style={{ color: S.primary }}>
                      {d.toLocaleString("bn-BD", { month: "short" })}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: S.text }}>{ev.clientName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FFF7ED", color: S.primary }}>
                        {EVENT_TYPE_LABELS[ev.eventType] ?? ev.eventType}
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: S.muted }}>
                      📍 {ev.venue} · 👥 {ev.guestCount} জন{ev.eventTime ? ` · ${ev.eventTime}` : ""}
                    </p>
                    <p className="text-xs" style={{ color: diffDays <= 3 && diffDays >= 0 ? "#DC2626" : S.muted }}>
                      {diffDays < 0 ? `${Math.abs(diffDays)} দিন আগে` : diffDays === 0 ? "আজ!" : diffDays === 1 ? "কাল" : `${diffDays} দিন বাকি`}
                      <span className="ml-1 text-xs" style={{ color: S.muted }}>{ev.bookingNumber}</span>
                    </p>
                  </div>
                  {/* Amounts */}
                  <div className="shrink-0 text-right">
                    <p className="text-base font-bold" style={{ color: S.text }}>৳{ev.totalAmount.toLocaleString()}</p>
                    {ev.dueAmount > 0
                      ? <p className="text-xs" style={{ color: "#DC2626" }}>বাকি ৳{ev.dueAmount.toLocaleString()}</p>
                      : <p className="text-xs flex items-center gap-0.5 justify-end" style={{ color: "#10B981" }}><Check size={11} /> পরিশোধ</p>}
                  </div>
                  <ChevronRight size={16} style={{ color: S.muted, flexShrink: 0 }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* New Booking Modal — 4 Steps */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-6 px-4 overflow-y-auto" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-2xl rounded-2xl p-6 space-y-5" style={{ backgroundColor: S.surface }}>
            {/* Step indicator */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: S.text }}>নতুন ইভেন্ট বুকিং</h2>
              <button onClick={() => setShowModal(false)}><X size={20} style={{ color: S.muted }} /></button>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className="flex-1 h-1.5 rounded-full transition-colors"
                  style={{ backgroundColor: s <= step ? S.primary : S.border }} />
              ))}
            </div>
            <p className="text-xs font-medium" style={{ color: S.muted }}>
              ধাপ {step}/4 — {["ইভেন্ট তথ্য", "Menu নির্বাচন", "Planning", "পেমেন্ট"][step - 1]}
            </p>

            {/* Step 1: Event Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>ক্লায়েন্টের নাম *</label>
                    <input value={clientName} onChange={e => setClientName(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 text-sm" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
                      placeholder="পূর্ণ নাম" />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>ফোন নম্বর *</label>
                    <input value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 text-sm" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
                      placeholder="01XXXXXXXXX" />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>ইভেন্টের ধরন *</label>
                    <select value={eventType} onChange={e => setEventType(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 text-sm" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                      {Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>অনুষ্ঠানের তারিখ *</label>
                    <DatePicker
  value={eventDate}
  onChange={v => setEventDate(v)}
  className="w-full border rounded-xl px-3 py-2 text-sm"
  style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
/>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>সময়</label>
                    <input value={eventTime} onChange={e => setEventTime(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 text-sm" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
                      placeholder="যেমন: 1:00 PM" />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>স্থান / ভেন্যু *</label>
                    <input value={venue} onChange={e => setVenue(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 text-sm" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
                      placeholder="ভেন্যুর নাম ও ঠিকানা" />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>অতিথি সংখ্যা *</label>
                    <input type="number" value={guestCount} onChange={e => setGuestCount(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 text-sm" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
                      placeholder="100" />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>ঠিকানা</label>
                    <input value={clientAddress} onChange={e => setClientAddress(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 text-sm" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
                      placeholder="ক্লায়েন্টের ঠিকানা" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-2" style={{ color: S.muted }}>খাবারের ধরন</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(MEAL_LABELS).map(([v, l]) => (
                      <button key={v} onClick={() => toggleMeal(v)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                        style={{
                          backgroundColor: mealTypes.includes(v) ? S.primary : S.surface,
                          color:           mealTypes.includes(v) ? "white" : S.muted,
                          borderColor:     mealTypes.includes(v) ? S.primary : S.border,
                        }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Menu */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Template selection */}
                {templates.filter(t => t.isActive).length > 0 && (
                  <div>
                    <label className="text-sm font-medium block mb-2" style={{ color: S.text }}>Template নির্বাচন করুন</label>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {templates.filter(t => (t as Template & { isActive: boolean }).isActive !== false).map(t => (
                        <button key={t.id} onClick={() => setSelectedTemplate(selectedTemplate?.id === t.id ? null : t)}
                          className="text-left p-3 rounded-xl border transition-colors"
                          style={{
                            borderColor: selectedTemplate?.id === t.id ? S.primary : S.border,
                            backgroundColor: selectedTemplate?.id === t.id ? "#FFF7ED" : S.surface,
                          }}>
                          <p className="text-sm font-semibold" style={{ color: S.text }}>{t.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: S.primary }}>৳{t.perHeadPrice}/জন · {t.items.length}টি আইটেম</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium" style={{ color: S.text }}>
                      {selectedTemplate ? "অতিরিক্ত আইটেম" : "Custom আইটেম"}
                    </label>
                    <button onClick={() => setCustomItems(prev => [...prev, emptyItem()])}
                      className="text-xs px-3 py-1 rounded-lg font-medium" style={{ backgroundColor: "#FFF7ED", color: S.primary }}>
                      + আইটেম যোগ
                    </button>
                  </div>
                  <div className="space-y-2">
                    {customItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input value={item.itemName} onChange={e => setCustomItems(prev => prev.map((x, i) => i === idx ? { ...x, itemName: e.target.value } : x))}
                          className="flex-1 border rounded-lg px-2 py-1.5 text-sm" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
                          placeholder="আইটেম নাম" />
                        <select value={item.category} onChange={e => setCustomItems(prev => prev.map((x, i) => i === idx ? { ...x, category: e.target.value } : x))}
                          className="border rounded-lg px-2 py-1.5 text-sm" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface, minWidth: 90 }}>
                          {Object.entries(CAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                        <input type="number" value={item.perHeadCost} onChange={e => setCustomItems(prev => prev.map((x, i) => i === idx ? { ...x, perHeadCost: e.target.value } : x))}
                          className="w-20 border rounded-lg px-2 py-1.5 text-sm" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
                          placeholder="৳/জন" />
                        {customItems.length > 1 && (
                          <button onClick={() => setCustomItems(prev => prev.filter((_, i) => i !== idx))}><X size={14} style={{ color: "#EF4444" }} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="rounded-xl p-4 border space-y-2" style={{ backgroundColor: "#FFF7ED", borderColor: "#FDBA74" }}>
                  <p className="text-sm font-semibold" style={{ color: S.text }}>মূল্য সারসংক্ষেপ</p>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: S.muted }}>প্রতি জনের খরচ</span>
                    <span className="font-semibold" style={{ color: S.primary }}>৳{totalPerHead.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: S.muted }}>মোট খরচ ({guests} জন)</span>
                    <span className="font-semibold" style={{ color: S.text }}>৳{totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: S.muted }}>বিক্রয় মূল্য (Suggested ৳{suggested.toLocaleString()}):</span>
                    <input type="number" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)}
                      className="flex-1 border rounded-lg px-2 py-1 text-sm font-semibold" style={{ borderColor: "#FDBA74", color: S.primary, backgroundColor: "white" }}
                      placeholder={String(suggested)} />
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span style={{ color: S.muted }}>প্রত্যাশিত মুনাফা</span>
                    <span style={{ color: profit >= 0 ? "#10B981" : "#DC2626" }}>৳{profit.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Planning */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>Staff সংখ্যা দরকার</label>
                    <input type="number" value={staffNeeded} onChange={e => setStaffNeeded(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 text-sm" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
                      placeholder="10" />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>নোট</label>
                    <input value={notes} onChange={e => setNotes(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 text-sm" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
                      placeholder="অতিরিক্ত নোট..." />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>সরঞ্জাম নোট</label>
                  <textarea value={equipmentNote} onChange={e => setEquipmentNote(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 text-sm resize-none" rows={3}
                    style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
                    placeholder="যেমন: 50টি প্লেট, 10টি serving tray দরকার..." />
                </div>

                {/* Auto Shopping List Preview */}
                <div className="rounded-xl border p-4" style={{ borderColor: S.border }}>
                  <p className="text-sm font-semibold mb-3" style={{ color: S.text }}>🛒 অটো Shopping List</p>
                  {allItems.length === 0 ? (
                    <p className="text-xs" style={{ color: S.muted }}>Step 2-এ আইটেম যোগ করুন</p>
                  ) : (
                    <div className="space-y-1.5">
                      {allItems.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span style={{ color: S.text }}>{item.itemName}</span>
                          <span style={{ color: S.muted }}>{item.quantity ? `${item.quantity} × ${guests}` : `${guests} জন`}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Payment */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="rounded-xl p-4 border space-y-2" style={{ backgroundColor: "#FFF7ED", borderColor: "#FDBA74" }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: S.muted }}>মোট পরিমাণ</span>
                    <span className="font-bold" style={{ color: S.text }}>৳{selling.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm shrink-0" style={{ color: S.muted }}>অগ্রিম (min. {40}%):</span>
                    <input type="number" value={advancePaid} onChange={e => setAdvancePaid(e.target.value)}
                      className="flex-1 border rounded-lg px-2 py-1 text-sm font-semibold" style={{ borderColor: "#FDBA74", color: S.primary, backgroundColor: "white" }}
                      placeholder={String(Math.ceil(selling * 0.4))} />
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-1 border-t" style={{ borderColor: "#FDBA74" }}>
                    <span style={{ color: S.muted }}>বাকি</span>
                    <span style={{ color: "#DC2626" }}>৳{dueAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="rounded-xl border p-4 space-y-2 text-sm" style={{ borderColor: S.border }}>
                  <p className="font-semibold" style={{ color: S.text }}>বুকিং সারসংক্ষেপ</p>
                  {[
                    ["ক্লায়েন্ট", clientName],
                    ["ফোন", clientPhone],
                    ["ইভেন্ট", EVENT_TYPE_LABELS[eventType] ?? eventType],
                    ["তারিখ", eventDate],
                    ["ভেন্যু", venue],
                    ["অতিথি", `${guests} জন`],
                    ["মুনাফা", `৳${profit.toLocaleString()}`],
                  ].map(([k, v], i) => (
                    <div key={i} className="flex justify-between">
                      <span style={{ color: S.muted }}>{k}</span>
                      <span className="font-medium" style={{ color: S.text }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nav buttons */}
            <div className="flex gap-3 justify-between pt-2">
              {step > 1
                ? <button onClick={() => setStep(s => s - 1)} className="px-5 py-2 rounded-xl text-sm border font-medium" style={{ borderColor: S.border, color: S.muted }}>← পিছনে</button>
                : <button onClick={() => setShowModal(false)} className="px-5 py-2 rounded-xl text-sm border font-medium" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
              }
              {step < 4
                ? <button onClick={() => setStep(s => s + 1)}
                    disabled={step === 1 && (!clientName || !clientPhone || !eventDate || !venue || !guestCount)}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm text-white font-semibold disabled:opacity-50"
                    style={{ backgroundColor: S.primary }}>
                    পরবর্তী →
                  </button>
                : <button onClick={submit} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm text-white font-semibold disabled:opacity-50"
                    style={{ backgroundColor: S.primary }}>
                    <Check size={15} /> {saving ? "সেভ হচ্ছে..." : "বুকিং নিশ্চিত করুন"}
                  </button>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
