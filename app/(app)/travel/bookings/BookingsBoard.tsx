"use client";

import { useEffect, useState } from "react";
import {
  Ticket, Plus, X, Loader2, ChevronRight, Search,
  Plane, Hotel, Bus, Stamp, Wrench, Mosque,
  CheckCircle, Clock, XCircle, AlertCircle,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface Booking {
  id: string;
  bookingNumber: string;
  clientName: string;
  clientPhone: string;
  bookingType: string;
  destination: string;
  travelDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  totalPersons: number;
  totalAmount: number;
  advancePaid: number;
  dueAmount: number;
  status: string;
  profit: number;
  description?: string;
  notes?: string;
  package?: { name: string } | null;
  payments?: Array<{ id: string; amount: number; method: string; paidAt: string; note?: string }>;
}

interface Package {
  id: string;
  name: string;
  destination: string;
  adultPrice: number;
  childPrice?: number;
  infantPrice?: number;
}

const FILTER_TABS = [
  { key: "all",       label: "সব" },
  { key: "package",   label: "প্যাকেজ" },
  { key: "ticket",    label: "টিকেট" },
  { key: "visa",      label: "ভিসা" },
  { key: "hajj_umrah",label: "হজ/উমরাহ" },
  { key: "hotel",     label: "হোটেল" },
  { key: "custom",    label: "কাস্টম" },
];

const BOOKING_TYPES = [
  { value: "package",    label: "প্যাকেজ ট্যুর",    icon: Plane,   color: "#0891B2", bg: "#ECFEFF" },
  { value: "ticket",     label: "টিকেট",             icon: Ticket,  color: "#7C3AED", bg: "#F5F3FF" },
  { value: "hotel",      label: "হোটেল",             icon: Hotel,   color: "#B45309", bg: "#FEF3C7" },
  { value: "hajj_umrah", label: "হজ/উমরাহ",          icon: Mosque,  color: "#0F6E56", bg: "#E1F5EE" },
  { value: "visa",       label: "ভিসা প্রসেসিং",     icon: Stamp,   color: "#DC2626", bg: "#FEE2E2" },
  { value: "custom",     label: "কাস্টম",            icon: Wrench,  color: "#6B7280", bg: "#F3F4F6" },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  enquiry:      { label: "জিজ্ঞাসা",    color: "#6B7280", bg: "#F3F4F6", icon: Clock },
  confirmed:    { label: "নিশ্চিত",     color: "#0891B2", bg: "#ECFEFF", icon: CheckCircle },
  advance_paid: { label: "অগ্রিম দেওয়া", color: "#7C3AED", bg: "#F5F3FF", icon: CheckCircle },
  completed:    { label: "সম্পন্ন",     color: "#0F6E56", bg: "#E1F5EE", icon: CheckCircle },
  cancelled:    { label: "বাতিল",       color: "#DC2626", bg: "#FEE2E2", icon: XCircle },
};

const PAYMENT_METHODS = ["cash", "bkash", "nagad", "rocket", "bank", "card"];

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};
const inputCls = "w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500";
const inputStyle = { borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text)" };

const emptyForm = {
  step: 1,
  bookingType: "",
  packageId: "",
  clientName: "", clientPhone: "",
  destination: "", travelDate: "", returnDate: "",
  adults: "1", children: "0", infants: "0",
  totalAmount: "", costAmount: "", advancePaid: "",
  paymentMethod: "cash",
  description: "", notes: "",
};

export default function BookingsBoard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: "", method: "cash", note: "" });
  const [payingSaving, setPayingSaving] = useState(false);

  const load = async (tab = activeTab) => {
    setLoading(true);
    const url = tab === "all" ? "/api/travel/bookings" : `/api/travel/bookings?type=${tab}`;
    const res = await fetch(url);
    if (res.ok) setBookings(await res.json());
    setLoading(false);
  };

  const loadPackages = async () => {
    const res = await fetch("/api/travel/packages");
    if (res.ok) setPackages(await res.json());
  };

  useEffect(() => { load(); loadPackages(); }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    load(tab);
  };

  const openNew = () => {
    setForm({ ...emptyForm });
    setShowForm(true);
    setSelected(null);
  };

  const selectPackage = (pkgId: string) => {
    const pkg = packages.find(p => p.id === pkgId);
    if (!pkg) return;
    const adults = parseInt(form.adults || "1");
    const children = parseInt(form.children || "0");
    const infants = parseInt(form.infants || "0");
    const total = (adults * pkg.adultPrice) + (children * (pkg.childPrice ?? pkg.adultPrice * 0.5)) + (infants * (pkg.infantPrice ?? 0));
    setForm(f => ({ ...f, packageId: pkgId, destination: pkg.destination, totalAmount: String(total) }));
  };

  const handleSave = async () => {
    if (!form.clientName || !form.travelDate || !form.totalAmount) return;
    setSaving(true);
    const res = await fetch("/api/travel/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const newBooking = await res.json();
      await load();
      setShowForm(false);
      alert(`বুকিং নিশ্চিত হয়েছে! বুকিং নং: ${newBooking.bookingNumber}`);
    }
    setSaving(false);
  };

  const handlePayment = async () => {
    if (!selected || !payForm.amount) return;
    setPayingSaving(true);
    const res = await fetch("/api/travel/bookings/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: selected.id, ...payForm }),
    });
    if (res.ok) {
      await load();
      setPaymentModal(false);
      setPayForm({ amount: "", method: "cash", note: "" });
      const updated = await (await fetch("/api/travel/bookings")).json();
      const upd = updated.find((b: Booking) => b.id === selected.id);
      if (upd) setSelected(upd);
    }
    setPayingSaving(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/travel/bookings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
    if (selected?.id === id) setSelected(s => s ? { ...s, status } : s);
  };

  const filtered = bookings.filter(b =>
    b.clientName.toLowerCase().includes(search.toLowerCase()) ||
    b.bookingNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.destination.toLowerCase().includes(search.toLowerCase())
  );

  const profit = parseFloat(form.totalAmount || "0") - parseFloat(form.costAmount || "0");
  const due = parseFloat(form.totalAmount || "0") - parseFloat(form.advancePaid || "0");

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#0891B2" }} /></div>;

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>বুকিং ম্যানেজমেন্ট</h1>
          <p className="text-sm" style={{ color: S.muted }}>{bookings.length}টি বুকিং</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#0891B2" }}>
          <Plus size={16} /> নতুন বুকিং
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_TABS.map(t => (
            <button key={t.key} onClick={() => handleTabChange(t.key)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
              style={{ backgroundColor: activeTab === t.key ? "#0891B2" : S.surface, color: activeTab === t.key ? "#fff" : S.muted, border: `1px solid ${activeTab === t.key ? "#0891B2" : "var(--c-border)"}` }}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input className={inputCls} style={{ ...inputStyle, paddingLeft: "2rem" }} placeholder="নাম, বুকিং নং, গন্তব্য..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <Ticket size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">কোনো বুকিং নেই</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((b) => {
            const status = STATUS_MAP[b.status] ?? { label: b.status, color: "#6B7280", bg: "#F3F4F6", icon: Clock };
            const tDate = new Date(b.travelDate);
            const bType = BOOKING_TYPES.find(t => t.value === b.bookingType) ?? BOOKING_TYPES[5];
            return (
              <button key={b.id} onClick={() => setSelected(b)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all hover:shadow-md"
                style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bType.bg }}>
                  <bType.icon size={18} style={{ color: bType.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm" style={{ color: S.text }}>{b.clientName}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg" style={{ backgroundColor: bType.bg, color: bType.color }}>{bType.label}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: S.muted }}>{b.bookingNumber} · {b.destination} · {tDate.toLocaleDateString("bn-BD")}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm" style={{ color: "#0891B2" }}>{formatBDT(b.totalAmount)}</p>
                  {b.dueAmount > 0 && <p className="text-xs font-semibold" style={{ color: "#DC2626" }}>বাকি {formatBDT(b.dueAmount)}</p>}
                </div>
                <span className="px-2 py-1 rounded-lg text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: status.bg, color: status.color }}>{status.label}</span>
                <ChevronRight size={16} style={{ color: S.muted }} />
              </button>
            );
          })}
        </div>
      )}

      {/* Booking Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="w-full max-w-lg h-full overflow-y-auto p-5 space-y-4" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg" style={{ color: S.text }}>{selected.clientName}</h2>
                <p className="text-xs" style={{ color: S.muted }}>{selected.bookingNumber}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-gray-100"><X size={18} /></button>
            </div>

            {/* Info */}
            <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: "#ECFEFF" }}>
              {[
                ["গন্তব্য", selected.destination],
                ["ভ্রমণের তারিখ", new Date(selected.travelDate).toLocaleDateString("bn-BD")],
                ["ফিরে আসার তারিখ", selected.returnDate ? new Date(selected.returnDate).toLocaleDateString("bn-BD") : "—"],
                ["যাত্রী", `${selected.adults} প্রাপ্তবয়স্ক${selected.children > 0 ? `, ${selected.children} শিশু` : ""}${selected.infants > 0 ? `, ${selected.infants} ইনফ্যান্ট` : ""}`],
                ["ফোন", selected.clientPhone],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span style={{ color: "#0891B2" }}>{k}</span>
                  <span className="font-medium" style={{ color: "#0C4A6E" }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Financial */}
            <div className="rounded-2xl p-4 space-y-2 border" style={{ borderColor: S.border }}>
              {[
                ["মোট", formatBDT(selected.totalAmount), "#0891B2"],
                ["অগ্রিম", formatBDT(selected.advancePaid), "#0F6E56"],
                ["বাকি", formatBDT(selected.dueAmount), selected.dueAmount > 0 ? "#DC2626" : "#0F6E56"],
                ["মুনাফা", formatBDT(selected.profit), "#7C3AED"],
              ].map(([k, v, c]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span style={{ color: S.muted }}>{k}</span>
                  <span className="font-bold" style={{ color: c as string }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Status */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: S.muted }}>স্ট্যাটাস পরিবর্তন</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(STATUS_MAP).map(([key, val]) => (
                  <button key={key} onClick={() => updateStatus(selected.id, key)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                    style={{ backgroundColor: selected.status === key ? val.color : val.bg, color: selected.status === key ? "#fff" : val.color }}>
                    {val.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment history */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium" style={{ color: S.muted }}>পেমেন্ট ইতিহাস</p>
                <button onClick={() => setPaymentModal(true)} className="text-xs font-semibold px-3 py-1.5 rounded-xl text-white" style={{ backgroundColor: "#0F6E56" }}>
                  + পেমেন্ট নিন
                </button>
              </div>
              {selected.payments?.length ? (
                <div className="space-y-1.5">
                  {selected.payments.map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-2.5 rounded-xl" style={{ backgroundColor: "#E1F5EE" }}>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "#0F6E56" }}>{formatBDT(p.amount)}</p>
                        <p className="text-[10px]" style={{ color: "#0F6E56" }}>{p.method} · {new Date(p.paidAt).toLocaleDateString("bn-BD")}</p>
                      </div>
                      {p.note && <p className="text-[10px]" style={{ color: S.muted }}>{p.note}</p>}
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs" style={{ color: S.muted }}>কোনো পেমেন্ট নেই</p>}
            </div>

            {selected.notes && (
              <div className="p-3 rounded-xl" style={{ backgroundColor: "#FFFBEB" }}>
                <p className="text-xs font-medium mb-1" style={{ color: "#B45309" }}>নোট</p>
                <p className="text-sm" style={{ color: "#92600A" }}>{selected.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-3" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ color: S.text }}>পেমেন্ট নিন</h3>
              <button onClick={() => setPaymentModal(false)}><X size={18} /></button>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পরিমাণ *</label>
              <input className={inputCls} style={inputStyle} type="number" placeholder="৳" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পদ্ধতি</label>
              <select className={inputCls} style={inputStyle} value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>নোট</label>
              <input className={inputCls} style={inputStyle} placeholder="ঐচ্ছিক" value={payForm.note} onChange={e => setPayForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPaymentModal(false)} className="flex-1 py-2.5 rounded-xl text-sm border font-semibold" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={handlePayment} disabled={payingSaving || !payForm.amount} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#0F6E56" }}>
                {payingSaving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "সেভ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Booking Modal - 3 steps */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-xl rounded-2xl p-6 space-y-4 mb-10" style={{ backgroundColor: S.surface }}>
            {/* Step indicator */}
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg" style={{ color: S.text }}>নতুন বুকিং</h2>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map(s => (
                  <div key={s} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: form.step >= s ? "#0891B2" : "var(--c-border)", color: form.step >= s ? "#fff" : S.muted }}>{s}</div>
                ))}
              </div>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>

            {/* Step 1: Booking Type */}
            {form.step === 1 && (
              <div className="space-y-3">
                <p className="text-sm font-medium" style={{ color: S.muted }}>বুকিং ধরন বেছে নিন</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {BOOKING_TYPES.map(t => (
                    <button key={t.value} onClick={() => setForm(f => ({ ...f, bookingType: t.value }))}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all"
                      style={{ backgroundColor: form.bookingType === t.value ? t.bg : S.surface, borderColor: form.bookingType === t.value ? t.color : "var(--c-border)" }}>
                      <t.icon size={24} style={{ color: t.color }} />
                      <span className="text-xs font-semibold text-center" style={{ color: t.color }}>{t.label}</span>
                    </button>
                  ))}
                </div>
                {form.bookingType === "package" && (
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>প্যাকেজ বেছে নিন</label>
                    <select className={inputCls} style={inputStyle} value={form.packageId} onChange={e => selectPackage(e.target.value)}>
                      <option value="">— প্যাকেজ নির্বাচন করুন —</option>
                      {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}
                {form.bookingType === "custom" && (
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>বিবরণ *</label>
                    <textarea className={inputCls} style={{ ...inputStyle, height: "80px", resize: "none" }} placeholder="বুকিংয়ের বিস্তারিত..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                )}
                <button onClick={() => setForm(f => ({ ...f, step: 2 }))} disabled={!form.bookingType} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#0891B2" }}>
                  পরবর্তী <ChevronRight size={15} className="inline" />
                </button>
              </div>
            )}

            {/* Step 2: Passenger Info */}
            {form.step === 2 && (
              <div className="space-y-3">
                <p className="text-sm font-medium" style={{ color: S.muted }}>যাত্রীর তথ্য</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>নাম *</label>
                    <input className={inputCls} style={inputStyle} placeholder="ক্লায়েন্টের নাম" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ফোন *</label>
                    <input className={inputCls} style={inputStyle} placeholder="01XXXXXXXXX" value={form.clientPhone} onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>গন্তব্য *</label>
                    <input className={inputCls} style={inputStyle} placeholder="Cox's Bazar" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ভ্রমণের তারিখ *</label>
                    <input className={inputCls} style={inputStyle} type="date" value={form.travelDate} onChange={e => setForm(f => ({ ...f, travelDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ফেরার তারিখ</label>
                    <input className={inputCls} style={inputStyle} type="date" value={form.returnDate} onChange={e => setForm(f => ({ ...f, returnDate: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[["adults", "প্রাপ্তবয়স্ক"], ["children", "শিশু"], ["infants", "ইনফ্যান্ট"]].map(([key, label]) => (
                    <div key={key}>
                      <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>{label}</label>
                      <input className={inputCls} style={inputStyle} type="number" min="0" value={(form as Record<string, string>)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setForm(f => ({ ...f, step: 1 }))} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: S.border, color: S.text }}>আগে</button>
                  <button onClick={() => setForm(f => ({ ...f, step: 3 }))} disabled={!form.clientName || !form.travelDate || !form.destination} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#0891B2" }}>
                    পরবর্তী <ChevronRight size={15} className="inline" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Price & Payment */}
            {form.step === 3 && (
              <div className="space-y-3">
                <p className="text-sm font-medium" style={{ color: S.muted }}>মূল্য ও পেমেন্ট</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>মোট মূল্য *</label>
                    <input className={inputCls} style={inputStyle} type="number" placeholder="৳" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>এজেন্সির খরচ</label>
                    <input className={inputCls} style={inputStyle} type="number" placeholder="৳" value={form.costAmount} onChange={e => setForm(f => ({ ...f, costAmount: e.target.value }))} />
                  </div>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: "#F5F3FF" }}>
                    <p className="text-xs" style={{ color: "#7C3AED" }}>মুনাফা</p>
                    <p className="font-bold" style={{ color: "#7C3AED" }}>{formatBDT(profit > 0 ? profit : 0)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>অগ্রিম</label>
                    <input className={inputCls} style={inputStyle} type="number" placeholder="৳" value={form.advancePaid} onChange={e => setForm(f => ({ ...f, advancePaid: e.target.value }))} />
                  </div>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: due > 0 ? "#FEE2E2" : "#E1F5EE" }}>
                    <p className="text-xs" style={{ color: due > 0 ? "#DC2626" : "#0F6E56" }}>বাকি</p>
                    <p className="font-bold" style={{ color: due > 0 ? "#DC2626" : "#0F6E56" }}>{formatBDT(due > 0 ? due : 0)}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পেমেন্ট পদ্ধতি</label>
                    <select className={inputCls} style={inputStyle} value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                      {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>নোট</label>
                    <textarea className={inputCls} style={{ ...inputStyle, height: "64px", resize: "none" }} placeholder="অতিরিক্ত তথ্য..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setForm(f => ({ ...f, step: 2 }))} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: S.border, color: S.text }}>আগে</button>
                  <button onClick={handleSave} disabled={saving || !form.totalAmount} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#0891B2" }}>
                    {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "বুকিং নিশ্চিত করুন"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
