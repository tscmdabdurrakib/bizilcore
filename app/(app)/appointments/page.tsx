"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar, Plus, X, ChevronLeft, ChevronRight, Clock, User, Scissors, Check, Play, XCircle, Loader2, List, ChevronDown } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface Service { id: string; name: string; price: number; durationMins: number; category: string; isActive: boolean; }
interface StaffOption { id: string; user: { name: string }; }
interface CustomerOption { id: string; name: string; phone: string | null; }
interface ApptItem { id: string; serviceName: string; price: number; staffCommission: number; commissionPaid: boolean; service?: { id: string; name: string } | null; }
interface Appointment {
  id: string; customerName: string; customerPhone: string | null; date: string;
  startTime: string; endTime?: string | null; status: string; note?: string | null;
  totalAmount: number; commissionPaid: boolean;
  items: ApptItem[];
  customer?: { id: string; name: string; phone: string | null } | null;
  staff?: { id: string; user: { name: string } } | null;
}

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", primary: "var(--c-primary)", bg: "var(--c-bg)",
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  scheduled:   { label: "নির্ধারিত",    color: "#3B82F6", bg: "#EFF6FF" },
  confirmed:   { label: "নিশ্চিত",       color: "#10B981", bg: "#ECFDF5" },
  in_progress: { label: "চলছে",          color: "#F59E0B", bg: "#FFFBEB" },
  completed:   { label: "সম্পন্ন",       color: "#6B7280", bg: "#F3F4F6" },
  cancelled:   { label: "বাতিল",         color: "#EF4444", bg: "#FEF2F2" },
};

const inp = (f: boolean) => ({
  height: "40px", border: `1px solid ${f ? "var(--c-primary)" : "var(--c-border)"}`,
  borderRadius: "8px", color: "var(--c-text)", backgroundColor: "var(--c-surface)",
  padding: "0 12px", fontSize: "14px", outline: "none", width: "100%",
});

const TIME_SLOTS = Array.from({ length: 25 }, (_, i) => {
  const h = Math.floor((i * 30 + 9 * 60) / 60);
  const m = (i * 30 + 9 * 60) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}).filter(t => t <= "21:00");

function NewAppointmentModal({
  services, staff, customers, onClose, onSave, initialDate,
}: {
  services: Service[];
  staff: StaffOption[];
  customers: CustomerOption[];
  onClose: () => void;
  onSave: () => void;
  initialDate: string;
}) {
  const [form, setForm] = useState({
    customerName: "", customerPhone: "", customerId: "",
    date: initialDate, startTime: "10:00", staffId: "", note: "",
  });
  const [selectedServices, setSelectedServices] = useState<{ serviceId: string; name: string; price: number }[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [custSuggestions, setCustSuggestions] = useState<CustomerOption[]>([]);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!customerSearch.trim()) { setCustSuggestions([]); return; }
    const q = customerSearch.toLowerCase();
    setCustSuggestions(customers.filter(c => c.name.toLowerCase().includes(q) || (c.phone ?? "").includes(q)).slice(0, 5));
  }, [customerSearch, customers]);

  function toggleService(svc: Service) {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.serviceId === svc.id);
      if (exists) return prev.filter(s => s.serviceId !== svc.id);
      return [...prev, { serviceId: svc.id, name: svc.name, price: svc.price }];
    });
  }

  const total = selectedServices.reduce((s, i) => s + i.price, 0);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!form.customerName.trim()) { setErr("কাস্টমারের নাম আবশ্যিক।"); return; }
    if (selectedServices.length === 0) { setErr("কমপক্ষে একটি সার্ভিস বেছে নিন।"); return; }
    setLoading(true);
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: form.customerName,
        customerPhone: form.customerPhone || null,
        customerId: form.customerId || null,
        date: form.date,
        startTime: form.startTime,
        staffId: form.staffId || null,
        note: form.note || null,
        items: selectedServices.map(s => ({ serviceId: s.serviceId, serviceName: s.name, price: s.price })),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setErr(d.error ?? "সেভ করা যায়নি।");
      return;
    }
    onSave();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: S.surface }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-base" style={{ color: S.text }}>নতুন অ্যাপয়েন্টমেন্ট</h3>
          <button onClick={onClose}><X size={18} style={{ color: S.muted }} /></button>
        </div>

        {err && <div className="mb-3 p-3 rounded-xl text-sm" style={{ backgroundColor: "#FEF2F2", color: "#EF4444" }}>{err}</div>}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="relative">
            <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>কাস্টমার *</label>
            <input
              value={customerSearch}
              onChange={e => { setCustomerSearch(e.target.value); setForm(p => ({ ...p, customerName: e.target.value, customerId: "" })); }}
              placeholder="নাম বা ফোন দিয়ে খুঁজুন..."
              style={inp(focused === "cust")}
              onFocus={() => setFocused("cust")} onBlur={() => setTimeout(() => setFocused(null), 150)}
            />
            {custSuggestions.length > 0 && focused === "cust" && (
              <div className="absolute left-0 right-0 top-full mt-1 rounded-xl border shadow-lg z-10" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                {custSuggestions.map(c => (
                  <button key={c.id} type="button" className="w-full px-3 py-2.5 text-left text-sm hover:bg-[var(--c-primary-light)]"
                    onMouseDown={() => { setCustomerSearch(c.name); setForm(p => ({ ...p, customerName: c.name, customerPhone: c.phone ?? "", customerId: c.id })); setCustSuggestions([]); }}
                    style={{ color: S.text }}>
                    {c.name} {c.phone && <span style={{ color: S.muted }}>— {c.phone}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>ফোন</label>
            <input
              value={form.customerPhone}
              onChange={e => setForm(p => ({ ...p, customerPhone: e.target.value }))}
              placeholder="01XXXXXXXXX"
              style={inp(focused === "phone")}
              onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>তারিখ *</label>
              <input
                type="date" value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                style={inp(focused === "date")}
                onFocus={() => setFocused("date")} onBlur={() => setFocused(null)}
                required
              />
            </div>
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>সময় *</label>
              <div className="relative">
                <select
                  value={form.startTime}
                  onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                  style={{ ...inp(focused === "time"), appearance: "none", paddingRight: "32px" }}
                  onFocus={() => setFocused("time")} onBlur={() => setFocused(null)}
                >
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: S.muted }} />
              </div>
            </div>
          </div>

          {staff.length > 0 && (
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>স্টাফ</label>
              <div className="relative">
                <select
                  value={form.staffId}
                  onChange={e => setForm(p => ({ ...p, staffId: e.target.value }))}
                  style={{ ...inp(focused === "staff"), appearance: "none", paddingRight: "32px" }}
                  onFocus={() => setFocused("staff")} onBlur={() => setFocused(null)}
                >
                  <option value="">-- যেকেউ --</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.user.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: S.muted }} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>সার্ভিস * (একাধিক বাছাই করুন)</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {services.filter(s => s.isActive).map(svc => {
                const selected = selectedServices.some(s => s.serviceId === svc.id);
                return (
                  <button
                    key={svc.id} type="button"
                    onClick={() => toggleService(svc)}
                    className="text-left px-3 py-2.5 rounded-xl border text-xs transition-all"
                    style={{
                      backgroundColor: selected ? "#FDF2F8" : S.surface,
                      borderColor: selected ? "#EC4899" : S.border,
                      color: selected ? "#EC4899" : S.text,
                    }}
                  >
                    <div className="font-medium">{svc.name}</div>
                    <div style={{ color: selected ? "#EC4899" : S.muted }}>{formatBDT(svc.price)}</div>
                  </button>
                );
              })}
            </div>
            {selectedServices.length > 0 && (
              <div className="mt-2 flex items-center justify-between text-xs" style={{ color: S.muted }}>
                <span>{selectedServices.length}টি সার্ভিস নির্বাচিত</span>
                <span className="font-bold" style={{ color: "#EC4899" }}>মোট: {formatBDT(total)}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>নোট</label>
            <input
              value={form.note}
              onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              placeholder="ঐচ্ছিক"
              style={inp(focused === "note")}
              onFocus={() => setFocused("note")} onBlur={() => setFocused(null)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
              style={{ borderColor: S.border, color: S.text }}>
              বাতিল
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #EC4899 0%, #BE185D 100%)" }}>
              {loading ? "সেভ..." : "বুকিং করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ApptCard({ appt, onStatusChange, onRefresh }: {
  appt: Appointment;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const statusMeta = STATUS_MAP[appt.status] ?? STATUS_MAP.scheduled;

  const NEXT_ACTIONS: Record<string, { label: string; next: string; icon: React.ReactNode; color: string }[]> = {
    scheduled:   [{ label: "নিশ্চিত করুন", next: "confirmed",   icon: <Check size={12} />, color: "#10B981" }, { label: "বাতিল", next: "cancelled", icon: <XCircle size={12} />, color: "#EF4444" }],
    confirmed:   [{ label: "শুরু করুন",    next: "in_progress", icon: <Play size={12} />,  color: "#F59E0B" }, { label: "বাতিল", next: "cancelled", icon: <XCircle size={12} />, color: "#EF4444" }],
    in_progress: [{ label: "সম্পন্ন",       next: "completed",   icon: <Check size={12} />, color: "#6B7280" }],
    completed:   [],
    cancelled:   [],
  };

  const actions = NEXT_ACTIONS[appt.status] ?? [];

  async function act(next: string) {
    setLoading(true);
    await onStatusChange(appt.id, next);
    setLoading(false);
  }

  return (
    <div className="p-4 rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm" style={{ color: S.text }}>{appt.customerName}</span>
            {appt.customerPhone && <span className="text-xs" style={{ color: S.muted }}>{appt.customerPhone}</span>}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="inline-flex items-center gap-1 text-xs" style={{ color: S.muted }}>
              <Clock size={11} /> {appt.startTime}{appt.endTime ? `–${appt.endTime}` : ""}
            </span>
            {appt.staff && (
              <span className="inline-flex items-center gap-1 text-xs" style={{ color: S.muted }}>
                <User size={11} /> {appt.staff.user.name}
              </span>
            )}
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
          style={{ backgroundColor: statusMeta.bg, color: statusMeta.color }}>
          {statusMeta.label}
        </span>
      </div>

      <div className="space-y-1 mb-3">
        {appt.items.map(item => (
          <div key={item.id} className="flex justify-between items-center">
            <span className="text-xs flex items-center gap-1.5" style={{ color: S.muted }}>
              <Scissors size={11} /> {item.serviceName}
            </span>
            <span className="text-xs font-medium" style={{ color: S.text }}>{formatBDT(item.price)}</span>
          </div>
        ))}
        <div className="flex justify-between items-center border-t pt-1.5 mt-1.5" style={{ borderColor: S.border }}>
          <span className="text-xs font-semibold" style={{ color: S.text }}>মোট</span>
          <span className="text-sm font-bold" style={{ color: "#EC4899" }}>{formatBDT(appt.totalAmount)}</span>
        </div>
      </div>

      {appt.note && (
        <p className="text-xs mb-3 px-2 py-1.5 rounded-lg" style={{ backgroundColor: S.bg, color: S.muted }}>{appt.note}</p>
      )}

      {actions.length > 0 && (
        <div className="flex gap-2">
          {actions.map(a => (
            <button
              key={a.next}
              onClick={() => act(a.next)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold disabled:opacity-60 border"
              style={{ borderColor: a.color, color: a.color, backgroundColor: a.color + "12" }}
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AppointmentsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState<"list" | "timeline">("list");
  const [walkInLoading, setWalkInLoading] = useState(false);

  const loadAppts = useCallback(async (date: string) => {
    setLoading(true);
    const r = await fetch(`/api/appointments?date=${date}`);
    const data = await r.json();
    setAppointments(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAppts(selectedDate);
  }, [selectedDate, loadAppts]);

  useEffect(() => {
    Promise.all([
      fetch("/api/services").then(r => r.json()),
      fetch("/api/staff").then(r => r.json()),
      fetch("/api/customers?all=1").then(r => r.json()),
    ]).then(([svcs, staffData, custData]) => {
      setServices(Array.isArray(svcs) ? svcs : []);
      setStaff(Array.isArray(staffData) ? staffData : (staffData.staffMembers ?? []));
      setCustomers(Array.isArray(custData) ? custData : []);
    });
  }, []);

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadAppts(selectedDate);
  }

  function changeDate(dir: 1 | -1) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(d.toISOString().slice(0, 10));
  }

  async function handleWalkIn() {
    if (services.filter(s => s.isActive).length === 0) {
      alert("Walk-in এর আগে কমপক্ষে একটি সার্ভিস যোগ করুন।");
      return;
    }
    setWalkInLoading(true);
    const now = new Date();
    const startTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const firstSvc = services.find(s => s.isActive)!;
    await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Walk-in কাস্টমার",
        date: today,
        startTime,
        isWalkIn: true,
        items: [{ serviceId: firstSvc.id, serviceName: firstSvc.name, price: firstSvc.price }],
      }),
    });
    setWalkInLoading(false);
    loadAppts(selectedDate);
  }

  const HOURS = Array.from({ length: 13 }, (_, i) => i + 9);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #EC4899 0%, #BE185D 100%)" }}>
            <Calendar size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>অ্যাপয়েন্টমেন্ট</h1>
            <p className="text-xs" style={{ color: S.muted }}>বুকিং, সময়সূচী ও স্ট্যাটাস</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleWalkIn}
            disabled={walkInLoading}
            className="flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-semibold border disabled:opacity-60"
            style={{ borderColor: "#EC4899", color: "#EC4899", backgroundColor: "#FDF2F8" }}
          >
            {walkInLoading ? <Loader2 size={15} className="animate-spin" /> : <User size={15} />}
            Walk-in নিন
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #EC4899 0%, #BE185D 100%)" }}
          >
            <Plus size={16} /> নতুন অ্যাপয়েন্টমেন্ট
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => changeDate(-1)} className="p-2 rounded-lg border" style={{ borderColor: S.border }}>
          <ChevronLeft size={16} style={{ color: S.muted }} />
        </button>
        <input
          type="date" value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={{ ...inp(false), width: "auto", flexShrink: 0 }}
        />
        <button onClick={() => changeDate(1)} className="p-2 rounded-lg border" style={{ borderColor: S.border }}>
          <ChevronRight size={16} style={{ color: S.muted }} />
        </button>
        {selectedDate !== today && (
          <button onClick={() => setSelectedDate(today)} className="px-3 py-1.5 rounded-lg text-xs font-medium border"
            style={{ borderColor: S.border, color: S.muted }}>
            আজ
          </button>
        )}
        <div className="ml-auto flex gap-1 p-1 rounded-xl" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
          {([["list", <List size={14} key="l" />, "তালিকা"], ["timeline", <Clock size={14} key="t" />, "টাইমলাইন"]] as const).map(([v, icon, label]) => (
            <button key={v} onClick={() => setView(v as "list" | "timeline")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ backgroundColor: view === v ? "#EC4899" : "transparent", color: view === v ? "#fff" : S.muted }}>
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 size={28} className="animate-spin" style={{ color: S.muted }} />
        </div>
      ) : appointments.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#FDF2F8" }}>
            <Calendar size={28} style={{ color: "#EC4899" }} />
          </div>
          <p className="font-semibold text-sm" style={{ color: S.text }}>এই দিনে কোনো অ্যাপয়েন্টমেন্ট নেই</p>
          <button onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #EC4899 0%, #BE185D 100%)" }}>
            <Plus size={14} className="inline mr-1" /> বুকিং করুন
          </button>
        </div>
      ) : view === "list" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {appointments.map(appt => (
            <ApptCard key={appt.id} appt={appt} onStatusChange={handleStatusChange} onRefresh={() => loadAppts(selectedDate)} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="p-3 border-b text-xs font-semibold" style={{ borderColor: S.border, color: S.muted }}>
            টাইমলাইন দৃশ্য (9am – 9pm)
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "600px" }}>
            {HOURS.map(hour => {
              const timeStr = `${String(hour).padStart(2, "0")}:`;
              const hourAppts = appointments.filter(a => a.startTime.startsWith(timeStr));
              return (
                <div key={hour} className="flex border-b" style={{ borderColor: S.border, minHeight: "56px" }}>
                  <div className="w-16 flex-shrink-0 flex items-start justify-end pr-3 pt-3">
                    <span className="text-xs font-medium" style={{ color: S.muted }}>{hour}:00</span>
                  </div>
                  <div className="flex-1 p-2 space-y-1" style={{ borderLeft: `1px solid ${S.border}` }}>
                    {hourAppts.map(appt => {
                      const sm = STATUS_MAP[appt.status];
                      return (
                        <div key={appt.id} className="px-2 py-1.5 rounded-lg text-xs"
                          style={{ backgroundColor: sm?.bg, borderLeft: `3px solid ${sm?.color}` }}>
                          <div className="font-semibold" style={{ color: sm?.color }}>{appt.startTime} {appt.customerName}</div>
                          <div style={{ color: S.muted }}>{appt.items.map(i => i.serviceName).join(", ")}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && (
        <NewAppointmentModal
          services={services}
          staff={staff}
          customers={customers}
          onClose={() => setShowModal(false)}
          onSave={() => loadAppts(selectedDate)}
          initialDate={selectedDate}
        />
      )}
    </div>
  );
}
