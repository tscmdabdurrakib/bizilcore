"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatBDT } from "@/lib/utils";
import {
  Camera, Plus, Loader2, Search, X, ChevronRight,
  Calendar, MapPin, Users, AlertCircle, CheckCircle,
  Clock, Truck, Star, XCircle, ArrowRight,
  Heart, Briefcase, User, Package, ShoppingBag,
} from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";

interface Booking {
  id: string;
  bookingNumber: string;
  clientName: string;
  clientPhone: string;
  eventType: string;
  eventDate: string;
  eventTime?: string;
  venue?: string;
  totalAmount: number;
  advancePaid: number;
  dueAmount: number;
  status: string;
  shootingDone: boolean;
  editingDone: boolean;
  deliveryDate?: string;
  notes?: string;
  createdAt: string;
  package?: { name: string; type: string } | null;
  team: Array<{ staffName: string; role: string }>;
  payments: Array<{ id: string; amount: number; method: string; paidAt: string }>;
}

interface Customer { id: string; name: string; phone: string }
interface PhotoPackage { id: string; name: string; type: string; price: number; editingDays: number; isActive?: boolean }
interface PhotoEquipment { id: string; name: string; category: string }

const PHOTO_COLOR = "#DB2777";
const PHOTO_BG = "#FDF2F8";
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };

const STATUS_PIPELINE = [
  { key: "enquiry",      label: "Enquiry",        color: "#6B7280", bg: "#F3F4F6", icon: AlertCircle   },
  { key: "confirmed",    label: "Confirmed",       color: "#0891B2", bg: "#ECFEFF", icon: CheckCircle   },
  { key: "advance_paid", label: "Advance Paid",    color: "#7C3AED", bg: "#F5F3FF", icon: Star          },
  { key: "shooting_done",label: "Shoot Done",      color: "#D97706", bg: "#FEF3C7", icon: Camera        },
  { key: "editing",      label: "Editing",         color: "#DB2777", bg: "#FDF2F8", icon: Clock         },
  { key: "delivered",    label: "Delivered",       color: "#0F6E56", bg: "#E1F5EE", icon: Truck         },
];

const EVENT_TYPES = [
  { value: "wedding",   label: "বিবাহ",      icon: Heart,       color: "#DB2777" },
  { value: "birthday",  label: "জন্মদিন",    icon: Star,        color: "#7C3AED" },
  { value: "corporate", label: "কর্পোরেট",   icon: Briefcase,   color: "#0891B2" },
  { value: "portrait",  label: "পোর্ট্রেট",   icon: User,        color: "#0F6E56" },
  { value: "product",   label: "প্রোডাক্ট",   icon: Package,     color: "#D97706" },
  { value: "other",     label: "অন্যান্য",   icon: ShoppingBag, color: "#6B7280" },
];

const TEAM_ROLES = [
  { value: "lead_photographer", label: "Lead Photographer" },
  { value: "2nd_photographer",  label: "২য় ফটোগ্রাফার" },
  { value: "videographer",      label: "ভিডিওগ্রাফার" },
  { value: "drone_operator",    label: "Drone Operator" },
  { value: "editor",            label: "এডিটর" },
];

const FILTER_TABS = [
  { key: "all",      label: "সব" },
  { key: "এই মাস",  label: "এই মাস" },
  { key: "editing",  label: "Editing এ" },
  { key: "delivered",label: "Delivered" },
];

const PAYMENT_METHODS = [
  { value: "cash",   label: "Cash" },
  { value: "bkash",  label: "bKash" },
  { value: "nagad",  label: "Nagad" },
  { value: "bank",   label: "Bank" },
];

export default function BookingsBoard() {
  const searchParams = useSearchParams();
  const initStatus = searchParams.get("status") ?? "all";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [activeTab, setActiveTab] = useState(initStatus === "editing" ? "editing" : "all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [packages, setPackages] = useState<PhotoPackage[]>([]);
  const [equipment, setEquipment] = useState<PhotoEquipment[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    clientName: "", clientPhone: "", customerId: "",
    eventType: "wedding", eventDate: "", eventTime: "", venue: "", duration: "",
    packageId: "", notes: "",
    team: [{ staffName: "", role: "lead_photographer" }],
    equipmentIds: [] as string[],
    totalAmount: "", costAmount: "", advancePaid: "", paymentMethod: "cash",
    deliveryDate: "",
  });

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

  useEffect(() => {
    fetch("/api/customers?limit=200").then(r => r.json()).then(d => setCustomers(d.customers ?? d ?? [])).catch(() => {});
    fetch("/api/photography/packages").then(r => r.json()).then(setPackages).catch(() => {});
    fetch("/api/photography/equipment").then(r => r.json()).then(setEquipment).catch(() => {});
  }, []);

  const filteredBookings = bookings.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !q || b.clientName.toLowerCase().includes(q) || b.clientPhone.includes(q) || b.bookingNumber.toLowerCase().includes(q);
    if (!matchSearch) return false;

    if (activeTab === "all") return true;
    if (activeTab === "editing") return b.status === "editing";
    if (activeTab === "delivered") return b.status === "delivered";
    if (activeTab === "এই মাস") {
      const now = new Date();
      const d = new Date(b.createdAt ?? b.eventDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const handlePackageSelect = (pkgId: string) => {
    const pkg = packages.find(p => p.id === pkgId);
    if (pkg) {
      const eventDate = form.eventDate;
      let deliveryDate = "";
      if (eventDate) {
        const d = new Date(eventDate);
        d.setDate(d.getDate() + pkg.editingDays);
        deliveryDate = d.toISOString().split("T")[0];
      }
      setForm(f => ({ ...f, packageId: pkgId, totalAmount: String(pkg.price), deliveryDate }));
    } else {
      setForm(f => ({ ...f, packageId: "" }));
    }
  };

  const handleSave = async () => {
    if (!form.clientName || !form.clientPhone || !form.eventDate || !form.totalAmount) return;
    setSaving(true);
    try {
      const res = await fetch("/api/photography/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          customerId: form.customerId || null,
          packageId: form.packageId || null,
          team: form.team.filter(t => t.staffName),
          equipment: form.equipmentIds.map(id => ({ equipmentId: id, quantity: 1 })),
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setStep(1);
        resetForm();
        load();
      }
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => setForm({
    clientName: "", clientPhone: "", customerId: "",
    eventType: "wedding", eventDate: "", eventTime: "", venue: "", duration: "",
    packageId: "", notes: "",
    team: [{ staffName: "", role: "lead_photographer" }],
    equipmentIds: [],
    totalAmount: "", costAmount: "", advancePaid: "", paymentMethod: "cash",
    deliveryDate: "",
  });

  const statusInfo = (status: string) => STATUS_PIPELINE.find(s => s.key === status) ?? STATUS_PIPELINE[1];
  const eventInfo = (type: string) => EVENT_TYPES.find(e => e.value === type) ?? EVENT_TYPES[5];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>ফটোগ্রাফি বুকিং</h1>
          <p className="text-sm" style={{ color: S.muted }}>{bookings.length}টি বুকিং</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: S.border }}>
            <button onClick={() => setView("kanban")} className="px-3 py-1.5 text-sm font-medium transition-colors" style={{ backgroundColor: view === "kanban" ? PHOTO_COLOR : "transparent", color: view === "kanban" ? "#fff" : S.muted }}>Kanban</button>
            <button onClick={() => setView("list")} className="px-3 py-1.5 text-sm font-medium transition-colors" style={{ backgroundColor: view === "list" ? PHOTO_COLOR : "transparent", color: view === "list" ? "#fff" : S.muted }}>তালিকা</button>
          </div>
          <button onClick={() => { setShowForm(true); setStep(1); }} className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 text-white" style={{ backgroundColor: PHOTO_COLOR }}>
            <Plus size={15} /> নতুন বুকিং
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ক্লায়েন্ট নাম বা নম্বর খুঁজুন..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }} />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={14} style={{ color: S.muted }} /></button>}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap border transition-colors" style={{ backgroundColor: activeTab === tab.key ? PHOTO_COLOR : S.surface, color: activeTab === tab.key ? "#fff" : S.muted, borderColor: activeTab === tab.key ? PHOTO_COLOR : S.border }}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: PHOTO_COLOR }} /></div>
      ) : view === "kanban" ? (
        /* Kanban view */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_PIPELINE.map(col => {
            const colBookings = filteredBookings.filter(b => b.status === col.key);
            return (
              <div key={col.key} className="flex-shrink-0 w-72 rounded-2xl border" style={{ borderColor: S.border, backgroundColor: S.surface }}>
                <div className="p-3 border-b flex items-center gap-2" style={{ borderColor: S.border }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: col.bg }}>
                    <col.icon size={14} style={{ color: col.color }} />
                  </div>
                  <span className="font-semibold text-sm" style={{ color: col.color }}>{col.label}</span>
                  <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: col.bg, color: col.color }}>{colBookings.length}</span>
                </div>
                <div className="p-2 space-y-2 min-h-[200px]">
                  {colBookings.map(b => {
                    const ei = eventInfo(b.eventType);
                    return (
                      <Link key={b.id} href={`/photography/bookings/${b.id}`} className="block rounded-xl border p-3 hover:shadow-md transition-all" style={{ borderColor: S.border }}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: `${ei.color}15` }}>
                            <ei.icon size={11} style={{ color: ei.color }} />
                          </div>
                          <span className="text-xs font-medium" style={{ color: ei.color }}>{ei.label}</span>
                        </div>
                        <p className="font-semibold text-sm" style={{ color: S.text }}>{b.clientName}</p>
                        <p className="text-xs mt-0.5 font-mono" style={{ color: S.muted }}>{b.bookingNumber}</p>
                        <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: S.muted }}>
                          <Calendar size={11} />
                          {new Date(b.eventDate).toLocaleDateString("bn-BD", { day: "numeric", month: "short" })}
                          {b.venue && <><span>·</span><MapPin size={11} /><span className="truncate max-w-[80px]">{b.venue}</span></>}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-bold" style={{ color: PHOTO_COLOR }}>{formatBDT(b.totalAmount)}</span>
                          {b.dueAmount > 0 && <span className="text-xs text-red-500 font-semibold">বাকি {formatBDT(b.dueAmount)}</span>}
                        </div>
                        {b.team.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: S.muted }}>
                            <Users size={11} />
                            {b.team[0].staffName}{b.team.length > 1 ? ` +${b.team.length - 1}` : ""}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                  {colBookings.length === 0 && (
                    <p className="text-xs text-center py-6" style={{ color: S.muted }}>কোনো বুকিং নেই</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
          {filteredBookings.length === 0 ? (
            <p className="text-center py-12 text-sm" style={{ color: S.muted }}>কোনো বুকিং পাওয়া যায়নি</p>
          ) : (
            filteredBookings.map(b => {
              const si = statusInfo(b.status);
              const ei = eventInfo(b.eventType);
              return (
                <Link key={b.id} href={`/photography/bookings/${b.id}`} className="flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors" style={{ borderColor: S.border }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: ei.color + "15" }}>
                    <ei.icon size={18} style={{ color: ei.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm" style={{ color: S.text }}>{b.clientName}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: si.bg, color: si.color }}>{si.label}</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: S.muted }}>
                      {b.bookingNumber} · {new Date(b.eventDate).toLocaleDateString("bn-BD")}
                      {b.venue ? ` · ${b.venue}` : ""}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: S.text }}>{formatBDT(b.totalAmount)}</p>
                    {b.dueAmount > 0 && <p className="text-xs text-red-500">বাকি {formatBDT(b.dueAmount)}</p>}
                  </div>
                  <ChevronRight size={16} style={{ color: S.muted }} />
                </Link>
              );
            })
          )}
        </div>
      )}

      {/* New Booking Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ backgroundColor: S.surface }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: S.border }}>
              <div>
                <h2 className="font-bold" style={{ color: S.text }}>নতুন বুকিং</h2>
                <div className="flex items-center gap-1 mt-1">
                  {[1,2,3].map(n => (
                    <div key={n} className="w-8 h-1.5 rounded-full transition-colors" style={{ backgroundColor: step >= n ? PHOTO_COLOR : S.border }} />
                  ))}
                  <span className="text-xs ml-1" style={{ color: S.muted }}>ধাপ {step}/৩</span>
                </div>
              </div>
              <button onClick={() => { setShowForm(false); resetForm(); }}><X size={20} style={{ color: S.muted }} /></button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
              {step === 1 && (
                <>
                  <h3 className="font-semibold text-sm" style={{ color: S.text }}>ধাপ ১ — ইভেন্ট তথ্য</h3>

                  {/* Client */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold" style={{ color: S.muted }}>ক্লায়েন্ট নাম *</label>
                    <input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} placeholder="ক্লায়েন্টের নাম" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold" style={{ color: S.muted }}>ফোন নম্বর *</label>
                    <input value={form.clientPhone} onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))} placeholder="01XXXXXXXXX" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                  </div>

                  {/* Event type */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold" style={{ color: S.muted }}>ইভেন্ট ধরন *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {EVENT_TYPES.map(et => (
                        <button key={et.value} onClick={() => setForm(f => ({ ...f, eventType: et.value }))} className="rounded-xl border p-2.5 flex flex-col items-center gap-1 transition-all" style={{ borderColor: form.eventType === et.value ? et.color : S.border, backgroundColor: form.eventType === et.value ? et.color + "10" : S.surface }}>
                          <et.icon size={18} style={{ color: et.color }} />
                          <span className="text-xs font-medium" style={{ color: form.eventType === et.value ? et.color : S.muted }}>{et.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold" style={{ color: S.muted }}>তারিখ *</label>
                      <DatePicker value={form.eventDate} onChange={v => setForm(f => ({ ...f, eventDate: v }))} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold" style={{ color: S.muted }}>সময়</label>
                      <input type="time" value={form.eventTime} onChange={e => setForm(f => ({ ...f, eventTime: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold" style={{ color: S.muted }}>ভেন্যু</label>
                    <input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="অনুষ্ঠানের স্থান" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                  </div>

                  {/* Package selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold" style={{ color: S.muted }}>প্যাকেজ (ঐচ্ছিক)</label>
                    <select value={form.packageId} onChange={e => handlePackageSelect(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                      <option value="">কাস্টম মূল্য নির্ধারণ করুন</option>
                      {packages.filter(p => p.isActive ?? true).map(p => (
                        <option key={p.id} value={p.id}>{p.name} — {formatBDT(p.price)}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h3 className="font-semibold text-sm" style={{ color: S.text }}>ধাপ ২ — Team ও Equipment</h3>

                  {/* Team */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold" style={{ color: S.muted }}>Team সদস্য</label>
                      <button onClick={() => setForm(f => ({ ...f, team: [...f.team, { staffName: "", role: "lead_photographer" }] }))} className="text-xs font-bold px-2 py-1 rounded-lg" style={{ color: PHOTO_COLOR, backgroundColor: PHOTO_BG }}>+ যোগ করুন</button>
                    </div>
                    {form.team.map((t, i) => (
                      <div key={i} className="flex gap-2">
                        <input value={t.staffName} onChange={e => setForm(f => ({ ...f, team: f.team.map((tt, ii) => ii === i ? { ...tt, staffName: e.target.value } : tt) }))} placeholder="নাম" className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                        <select value={t.role} onChange={e => setForm(f => ({ ...f, team: f.team.map((tt, ii) => ii === i ? { ...tt, role: e.target.value } : tt) }))} className="px-2 py-2 rounded-xl border text-xs outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                          {TEAM_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        {form.team.length > 1 && (
                          <button onClick={() => setForm(f => ({ ...f, team: f.team.filter((_, ii) => ii !== i) }))}><X size={14} style={{ color: S.muted }} /></button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Equipment */}
                  {equipment.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold" style={{ color: S.muted }}>সরঞ্জাম (চেকলিস্ট)</label>
                      <div className="rounded-xl border divide-y" style={{ borderColor: S.border }}>
                        {equipment.slice(0, 10).map(eq => (
                          <label key={eq.id} className="flex items-center gap-3 p-2.5 cursor-pointer">
                            <input type="checkbox" checked={form.equipmentIds.includes(eq.id)} onChange={e => setForm(f => ({ ...f, equipmentIds: e.target.checked ? [...f.equipmentIds, eq.id] : f.equipmentIds.filter(id => id !== eq.id) }))} className="w-4 h-4 rounded" style={{ accentColor: PHOTO_COLOR }} />
                            <span className="text-sm" style={{ color: S.text }}>{eq.name}</span>
                            <span className="text-xs ml-auto" style={{ color: S.muted }}>{eq.category}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-semibold" style={{ color: S.muted }}>নোট / শুট রিকোয়ারমেন্ট</label>
                    <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="বিশেষ নির্দেশনা..." className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h3 className="font-semibold text-sm" style={{ color: S.text }}>ধাপ ৩ — মূল্য ও পেমেন্ট</h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold" style={{ color: S.muted }}>মোট মূল্য (৳) *</label>
                      <input type="number" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} placeholder="0" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold" style={{ color: S.muted }}>খরচ (৳)</label>
                      <input type="number" value={form.costAmount} onChange={e => setForm(f => ({ ...f, costAmount: e.target.value }))} placeholder="0" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold" style={{ color: S.muted }}>অগ্রিম (৳)</label>
                      <input type="number" value={form.advancePaid} onChange={e => setForm(f => ({ ...f, advancePaid: e.target.value }))} placeholder="0" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold" style={{ color: S.muted }}>পেমেন্ট পদ্ধতি</label>
                      <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                        {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {form.totalAmount && form.advancePaid && (
                    <div className="rounded-xl p-3 text-sm font-semibold" style={{ backgroundColor: PHOTO_BG, color: PHOTO_COLOR }}>
                      বাকি: {formatBDT(Math.max(0, parseFloat(form.totalAmount || "0") - parseFloat(form.advancePaid || "0")))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-semibold" style={{ color: S.muted }}>প্রত্যাশিত ডেলিভারি তারিখ</label>
                    <DatePicker value={form.deliveryDate} onChange={v => setForm(f => ({ ...f, deliveryDate: v }))} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-5 border-t gap-3" style={{ borderColor: S.border }}>
              {step > 1 ? (
                <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.muted }}>পেছনে</button>
              ) : (
                <button onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
              )}
              {step < 3 ? (
                <button onClick={() => setStep(s => s + 1)} className="flex-1 py-2 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1" style={{ backgroundColor: PHOTO_COLOR }}>
                  পরের ধাপ <ArrowRight size={15} />
                </button>
              ) : (
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1 disabled:opacity-60" style={{ backgroundColor: PHOTO_COLOR }}>
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
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
