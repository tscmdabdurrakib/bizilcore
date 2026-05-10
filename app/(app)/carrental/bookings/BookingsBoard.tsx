"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Plus, Search, X, Car, Users, DollarSign, Loader2, CheckCircle, MapPin } from "lucide-react";
import { formatBDT } from "@/lib/utils";

const S = {
  surface: "var(--c-surface)",
  border:  "var(--c-border)",
  text:    "var(--c-text)",
  muted:   "var(--c-text-muted)",
  primary: "#DC2626",
};

const BOOKING_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  confirmed:  { label: "নিশ্চিত",   bg: "#EFF6FF", color: "#1D4ED8" },
  on_trip:    { label: "ট্রিপে",    bg: "#F5F3FF", color: "#7C3AED" },
  completed:  { label: "সম্পন্ন",   bg: "#DCFCE7", color: "#166534" },
  cancelled:  { label: "বাতিল",    bg: "#FEF2F2", color: "#991B1B" },
};

const RATE_TYPES = [
  { key: "hourly",   label: "ঘণ্টা প্রতি" },
  { key: "half_day", label: "হাফ ডে" },
  { key: "daily",    label: "সারাদিন" },
  { key: "monthly",  label: "মাসিক" },
];

const PURPOSES = ["wedding", "airport", "tour", "corporate", "other"];
const PURPOSE_LABELS: Record<string, string> = {
  wedding: "বিয়ে", airport: "এয়ারপোর্ট", tour: "ট্যুর", corporate: "কর্পোরেট", other: "অন্য"
};

type Vehicle = {
  id: string;
  regNumber: string;
  type: string;
  brand: string;
  model: string;
  seats: number;
  acAvailable: boolean;
  dailyRate: number;
  halfDayRate?: number | null;
  hourlyRate?: number | null;
  monthlyRate?: number | null;
  status: string;
  defaultDriver?: { id: string; name: string; phone: string } | null;
};

type Driver = { id: string; name: string; phone: string; status: string };

type Booking = {
  id: string;
  bookingNumber: string;
  clientName: string;
  clientPhone: string;
  purpose?: string | null;
  startDateTime: string;
  endDateTime: string;
  totalAmount: number;
  advancePaid: number;
  dueAmount: number;
  status: string;
  rateType: string;
  units: number;
  ratePerUnit: number;
  notes?: string | null;
  vehicle: { id: string; regNumber: string; brand: string; model: string; type: string };
  driver?: { id: string; name: string; phone: string } | null;
  pickupLocation?: string | null;
  dropLocation?: string | null;
};

const STATUS_TABS = ["all", "confirmed", "on_trip", "completed", "cancelled"];
const STATUS_TAB_LABELS: Record<string, string> = {
  all: "সব", confirmed: "নিশ্চিত", on_trip: "ট্রিপে", completed: "সম্পন্ন", cancelled: "বাতিল"
};

export default function BookingsBoard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionModal, setActionModal] = useState("");
  const [actionData, setActionData] = useState<Record<string, string>>({});

  // Form state
  const [form, setForm] = useState({
    startDateTime: "", endDateTime: "", vehicleId: "", driverId: "", rateType: "daily",
    units: "1", ratePerUnit: "", extraKmCharge: "0", extraHrCharge: "0", totalAmount: "",
    clientName: "", clientPhone: "", clientNID: "", purpose: "",
    pickupLocation: "", dropLocation: "", notes: "",
    advancePaid: "", paymentMethod: "cash",
  });

  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusTab !== "all") params.set("status", statusTab);
    const res = await fetch(`/api/carrental/bookings?${params}`);
    const data = await res.json();
    setBookings(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [statusTab]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  useEffect(() => {
    fetch("/api/carrental/vehicles").then(r => r.json()).then(d => setVehicles(Array.isArray(d) ? d : []));
    fetch("/api/carrental/drivers").then(r => r.json()).then(d => setDrivers(Array.isArray(d) ? d : []));
  }, []);

  // Check availability when dates + rate type chosen
  const checkAvailability = useCallback(async () => {
    if (!form.startDateTime || !form.endDateTime) return;
    setCheckingAvailability(true);
    // All vehicles; then filter out ones with overlapping bookings
    const res = await fetch("/api/carrental/vehicles");
    const all: Vehicle[] = await res.json();
    // We'll just show all and let backend reject. But optimistically filter status=available or on_trip
    setAvailableVehicles(all.filter(v => v.status !== "maintenance" && v.status !== "retired"));
    setCheckingAvailability(false);
  }, [form.startDateTime, form.endDateTime]);

  // Auto-calc total when vehicle/rateType/units change
  useEffect(() => {
    const v = vehicles.find(v => v.id === form.vehicleId);
    if (!v || !form.rateType || !form.units) return;
    let rate = 0;
    if (form.rateType === "daily") rate = v.dailyRate;
    else if (form.rateType === "half_day") rate = v.halfDayRate ?? v.dailyRate * 0.6;
    else if (form.rateType === "hourly") rate = v.hourlyRate ?? Math.round(v.dailyRate / 12);
    else if (form.rateType === "monthly") rate = v.monthlyRate ?? v.dailyRate * 28;
    const total = rate * Number(form.units);
    setForm(p => ({ ...p, ratePerUnit: String(rate), totalAmount: String(total) }));
  }, [form.vehicleId, form.rateType, form.units, vehicles]);

  const resetForm = () => {
    setForm({
      startDateTime: "", endDateTime: "", vehicleId: "", driverId: "", rateType: "daily",
      units: "1", ratePerUnit: "", extraKmCharge: "0", extraHrCharge: "0", totalAmount: "",
      clientName: "", clientPhone: "", clientNID: "", purpose: "",
      pickupLocation: "", dropLocation: "", notes: "",
      advancePaid: "", paymentMethod: "cash",
    });
    setStep(1);
    setAvailableVehicles([]);
    setError("");
  };

  const handleSubmit = async () => {
    setSaving(true); setError("");
    const res = await fetch("/api/carrental/bookings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false); resetForm(); fetchBookings();
    } else {
      const d = await res.json(); setError(d.error ?? "ত্রুটি হয়েছে");
    }
    setSaving(false);
  };

  const handleAction = async () => {
    if (!selectedBooking) return;
    setSaving(true);
    const res = await fetch(`/api/carrental/bookings/${selectedBooking.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: actionModal, ...actionData }),
    });
    if (res.ok) {
      setSelectedBooking(null); setActionModal(""); setActionData({});
      fetchBookings();
    } else {
      const d = await res.json(); setError(d.error ?? "ত্রুটি হয়েছে");
    }
    setSaving(false);
  };

  const filtered = bookings.filter(b =>
    !search ||
    b.bookingNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.clientName.toLowerCase().includes(search.toLowerCase()) ||
    b.clientPhone.includes(search) ||
    b.vehicle.regNumber.toLowerCase().includes(search.toLowerCase())
  );

  const selectedVehicle = vehicles.find(v => v.id === form.vehicleId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border" placeholder="বুকিং নম্বর, গ্রাহক..." value={search} onChange={e => setSearch(e.target.value)} style={{ borderColor: S.border, background: S.surface }} />
          {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={12} /></button>}
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium ml-auto" style={{ background: S.primary }}>
          <Plus size={15} /> নতুন বুকিং
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: S.border }}>
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setStatusTab(t)} className="px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap"
            style={{ borderColor: statusTab === t ? S.primary : "transparent", color: statusTab === t ? S.primary : S.muted }}>
            {STATUS_TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Booking list */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin" size={26} style={{ color: S.primary }} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <Calendar size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">কোনো বুকিং নেই</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => {
            const cfg = BOOKING_STATUS[b.status] ?? BOOKING_STATUS.confirmed;
            return (
              <div key={b.id} className="rounded-xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-sm" style={{ color: S.primary }}>{b.bookingNumber}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                      {b.purpose && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: S.muted }}>
                          {PURPOSE_LABELS[b.purpose] ?? b.purpose}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium" style={{ color: S.text }}>{b.clientName} · {b.clientPhone}</p>
                    <p className="text-xs mt-0.5" style={{ color: S.muted }}>
                      {b.vehicle.brand} {b.vehicle.model} [{b.vehicle.regNumber}]
                      {b.driver ? ` · ড্রাইভার: ${b.driver.name}` : ""}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: S.muted }}>
                      {new Date(b.startDateTime).toLocaleString("bn-BD", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      {" → "}
                      {new Date(b.endDateTime).toLocaleString("bn-BD", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold" style={{ color: S.text }}>{formatBDT(b.totalAmount)}</p>
                    {b.dueAmount > 0 && (
                      <p className="text-xs font-medium" style={{ color: "#EF4444" }}>বাকি: {formatBDT(b.dueAmount)}</p>
                    )}
                    <p className="text-xs" style={{ color: S.muted }}>{RATE_TYPES.find(r => r.key === b.rateType)?.label ?? b.rateType} × {b.units}</p>
                  </div>
                </div>

                {(b.pickupLocation || b.dropLocation) && (
                  <p className="text-xs flex items-center gap-1 mb-2" style={{ color: S.muted }}>
                    <MapPin size={10} />
                    {b.pickupLocation}{b.dropLocation ? ` → ${b.dropLocation}` : ""}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 flex-wrap" style={{ borderTop: `1px solid ${S.border}` }}>
                  {b.status === "confirmed" && (
                    <>
                      <button onClick={() => { setSelectedBooking(b); setActionModal("start_trip"); setActionData({}); }}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium text-white" style={{ background: "#7C3AED" }}>
                        ট্রিপ শুরু
                      </button>
                      <button onClick={() => { setSelectedBooking(b); setActionModal("cancel"); setActionData({}); }}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: "#FEF2F2", color: "#991B1B" }}>
                        বাতিল
                      </button>
                    </>
                  )}
                  {b.status === "on_trip" && (
                    <button onClick={() => { setSelectedBooking(b); setActionModal("end_trip"); setActionData({}); }}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium text-white" style={{ background: "#10B981" }}>
                      ট্রিপ শেষ
                    </button>
                  )}
                  {b.dueAmount > 0 && b.status !== "cancelled" && (
                    <button onClick={() => { setSelectedBooking(b); setActionModal("add_payment"); setActionData({ amount: String(b.dueAmount), method: "cash" }); }}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: "#DCFCE7", color: "#166534" }}>
                      পেমেন্ট নিন
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Booking 3-Step Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[92vh]" style={{ background: S.surface }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: S.border }}>
              <div>
                <h2 className="font-bold text-base" style={{ color: S.text }}>নতুন বুকিং</h2>
                <div className="flex gap-2 mt-1">
                  {[1, 2, 3].map(s => (
                    <div key={s} className="w-6 h-1 rounded-full transition-all" style={{ background: step >= s ? S.primary : S.border }} />
                  ))}
                </div>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }}><X size={18} style={{ color: S.muted }} /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              {/* Step 1: তারিখ ও গাড়ি */}
              {step === 1 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: S.muted }}>ধাপ ১ — তারিখ ও গাড়ি</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs mb-1 font-medium" style={{ color: S.muted }}>শুরুর তারিখ ও সময় *</p>
                      <input type="datetime-local" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.startDateTime} onChange={e => setForm(p => ({ ...p, startDateTime: e.target.value }))} style={{ borderColor: S.border }} />
                    </div>
                    <div>
                      <p className="text-xs mb-1 font-medium" style={{ color: S.muted }}>শেষ তারিখ ও সময় *</p>
                      <input type="datetime-local" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.endDateTime} onChange={e => setForm(p => ({ ...p, endDateTime: e.target.value }))} style={{ borderColor: S.border }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs mb-1 font-medium" style={{ color: S.muted }}>ভাড়ার ধরন *</p>
                      <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.rateType} onChange={e => setForm(p => ({ ...p, rateType: e.target.value }))} style={{ borderColor: S.border }}>
                        {RATE_TYPES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <p className="text-xs mb-1 font-medium" style={{ color: S.muted }}>সংখ্যা *</p>
                      <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="1" value={form.units} onChange={e => setForm(p => ({ ...p, units: e.target.value }))} style={{ borderColor: S.border }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: S.muted }}>গাড়ি নির্বাচন *</p>
                      <button onClick={checkAvailability} disabled={!form.startDateTime || !form.endDateTime || checkingAvailability}
                        className="text-xs px-3 py-1 rounded-lg" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
                        {checkingAvailability ? "চেক হচ্ছে..." : "পাওয়া যাচ্ছে কিনা চেক করুন"}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(availableVehicles.length > 0 ? availableVehicles : vehicles).map(v => {
                        let rate = v.dailyRate;
                        if (form.rateType === "half_day") rate = v.halfDayRate ?? v.dailyRate * 0.6;
                        else if (form.rateType === "hourly") rate = v.hourlyRate ?? Math.round(v.dailyRate / 12);
                        else if (form.rateType === "monthly") rate = v.monthlyRate ?? v.dailyRate * 28;
                        const isBooked = v.status === "on_trip";
                        return (
                          <button key={v.id} onClick={() => !isBooked && setForm(p => ({ ...p, vehicleId: v.id, driverId: v.defaultDriver?.id ?? "" }))}
                            disabled={isBooked}
                            className="w-full rounded-xl p-3 text-left border-2 transition-all"
                            style={{
                              background: isBooked ? "#F9FAFB" : form.vehicleId === v.id ? "#FEF2F2" : S.surface,
                              borderColor: form.vehicleId === v.id ? S.primary : isBooked ? "#E5E7EB" : S.border,
                              opacity: isBooked ? 0.5 : 1,
                            }}>
                            <div className="flex justify-between">
                              <div>
                                <p className="font-semibold text-sm" style={{ color: S.text }}>{v.brand} {v.model} [{v.regNumber}]</p>
                                <p className="text-xs" style={{ color: S.muted }}>{v.seats} আসন{v.acAvailable ? " · AC" : ""} · {v.fuelType}</p>
                                {v.defaultDriver && <p className="text-xs" style={{ color: "#10B981" }}>ড্রাইভার: {v.defaultDriver.name}</p>}
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-sm" style={{ color: S.primary }}>৳{rate}</p>
                                <p className="text-xs" style={{ color: S.muted }}>/{RATE_TYPES.find(r => r.key === form.rateType)?.label}</p>
                                {isBooked && <p className="text-xs font-medium" style={{ color: "#EF4444" }}>বুকড</p>}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {form.vehicleId && (
                    <div>
                      <p className="text-xs mb-1 font-medium" style={{ color: S.muted }}>ড্রাইভার নির্বাচন (ঐচ্ছিক)</p>
                      <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.driverId} onChange={e => setForm(p => ({ ...p, driverId: e.target.value }))} style={{ borderColor: S.border }}>
                        <option value="">ড্রাইভার নেই</option>
                        {drivers.filter(d => d.status !== "terminated").map(d => <option key={d.id} value={d.id}>{d.name} · {d.phone} {d.status === "on_trip" ? "(ট্রিপে)" : ""}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: গ্রাহকের তথ্য */}
              {step === 2 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: S.muted }}>ধাপ ২ — গ্রাহকের তথ্য</p>
                  <div className="grid grid-cols-1 gap-2">
                    <input className="border rounded-lg px-3 py-2 text-sm" placeholder="গ্রাহকের নাম *" value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} style={{ borderColor: S.border }} />
                    <div className="grid grid-cols-2 gap-2">
                      <input className="border rounded-lg px-3 py-2 text-sm" placeholder="ফোন নম্বর *" value={form.clientPhone} onChange={e => setForm(p => ({ ...p, clientPhone: e.target.value }))} style={{ borderColor: S.border }} />
                      <input className="border rounded-lg px-3 py-2 text-sm" placeholder="NID নম্বর" value={form.clientNID} onChange={e => setForm(p => ({ ...p, clientNID: e.target.value }))} style={{ borderColor: S.border }} />
                    </div>
                    <select className="border rounded-lg px-3 py-2 text-sm" value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} style={{ borderColor: S.border }}>
                      <option value="">উদ্দেশ্য নির্বাচন করুন</option>
                      {PURPOSES.map(pu => <option key={pu} value={pu}>{PURPOSE_LABELS[pu]}</option>)}
                    </select>
                    <input className="border rounded-lg px-3 py-2 text-sm" placeholder="পিকআপ লোকেশন" value={form.pickupLocation} onChange={e => setForm(p => ({ ...p, pickupLocation: e.target.value }))} style={{ borderColor: S.border }} />
                    <input className="border rounded-lg px-3 py-2 text-sm" placeholder="ড্রপ লোকেশন" value={form.dropLocation} onChange={e => setForm(p => ({ ...p, dropLocation: e.target.value }))} style={{ borderColor: S.border }} />
                    <textarea className="border rounded-lg px-3 py-2 text-sm resize-none" placeholder="নোট" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} style={{ borderColor: S.border }} />
                  </div>
                </div>
              )}

              {/* Step 3: পেমেন্ট */}
              {step === 3 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: S.muted }}>ধাপ ৩ — পেমেন্ট</p>
                  {selectedVehicle && (
                    <div className="rounded-xl p-3" style={{ background: "#FEF2F2" }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: S.primary }}>রেট হিসাব</p>
                      <p className="text-sm" style={{ color: S.text }}>
                        {form.units} × ৳{form.ratePerUnit} ({RATE_TYPES.find(r => r.key === form.rateType)?.label}) = <strong>৳{form.totalAmount}</strong>
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs mb-1 font-medium" style={{ color: S.muted }}>মোট ভাড়া ৳</p>
                      <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.totalAmount} onChange={e => setForm(p => ({ ...p, totalAmount: e.target.value }))} style={{ borderColor: S.border }} />
                    </div>
                    <div>
                      <p className="text-xs mb-1 font-medium" style={{ color: S.muted }}>অগ্রিম পরিশোধ ৳</p>
                      <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0" value={form.advancePaid} onChange={e => setForm(p => ({ ...p, advancePaid: e.target.value }))} style={{ borderColor: S.border }} />
                    </div>
                    <div>
                      <p className="text-xs mb-1 font-medium" style={{ color: S.muted }}>পেমেন্ট পদ্ধতি</p>
                      <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.paymentMethod} onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))} style={{ borderColor: S.border }}>
                        {["cash", "bkash", "nagad", "bank", "card"].map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="rounded-xl p-3 flex flex-col justify-center" style={{ background: "#F9FAFB" }}>
                      <p className="text-xs font-medium" style={{ color: S.muted }}>বাকি থাকবে</p>
                      <p className="text-lg font-bold" style={{ color: Number(form.totalAmount) - Number(form.advancePaid || 0) > 0 ? "#EF4444" : "#10B981" }}>
                        ৳{Math.max(0, Number(form.totalAmount || 0) - Number(form.advancePaid || 0))}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex gap-3" style={{ borderColor: S.border }}>
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.muted }}>← আগে</button>
              )}
              {step < 3 ? (
                <button
                  onClick={() => {
                    if (step === 1 && (!form.startDateTime || !form.endDateTime || !form.vehicleId)) {
                      setError("তারিখ ও গাড়ি নির্বাচন করুন"); return;
                    }
                    if (step === 2 && (!form.clientName || !form.clientPhone)) {
                      setError("গ্রাহকের নাম ও ফোন আবশ্যক"); return;
                    }
                    setError(""); setStep(s => s + 1);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: S.primary }}>
                  পরবর্তী →
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: S.primary }}>
                  {saving ? <Loader2 size={16} className="animate-spin inline mr-1" /> : <CheckCircle size={16} className="inline mr-1" />}
                  {saving ? "বুকিং হচ্ছে..." : "বুকিং নিশ্চিত করুন"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Modals (start_trip, end_trip, cancel, add_payment) */}
      {actionModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: S.surface }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm" style={{ color: S.text }}>
                {actionModal === "start_trip" && "ট্রিপ শুরু করুন"}
                {actionModal === "end_trip" && "ট্রিপ শেষ করুন"}
                {actionModal === "cancel" && "বুকিং বাতিল করুন"}
                {actionModal === "add_payment" && "পেমেন্ট নিন"}
              </h3>
              <button onClick={() => { setSelectedBooking(null); setActionModal(""); setError(""); }}><X size={16} style={{ color: S.muted }} /></button>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>}

            <p className="text-sm mb-3" style={{ color: S.muted }}>
              {selectedBooking.bookingNumber} · {selectedBooking.vehicle.brand} [{selectedBooking.vehicle.regNumber}]
            </p>

            {actionModal === "start_trip" && (
              <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm mb-3" placeholder="শুরুর KM রিডিং" value={actionData.startKm ?? ""} onChange={e => setActionData(p => ({ ...p, startKm: e.target.value }))} style={{ borderColor: S.border }} />
            )}

            {actionModal === "end_trip" && (
              <div className="space-y-2 mb-3">
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="শেষের KM রিডিং" value={actionData.endKm ?? ""} onChange={e => setActionData(p => ({ ...p, endKm: e.target.value }))} style={{ borderColor: S.border }} />
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="চূড়ান্ত পেমেন্ট ৳" value={actionData.finalPayment ?? String(selectedBooking.dueAmount)} onChange={e => setActionData(p => ({ ...p, finalPayment: e.target.value }))} style={{ borderColor: S.border }} />
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={actionData.paymentMethod ?? "cash"} onChange={e => setActionData(p => ({ ...p, paymentMethod: e.target.value }))} style={{ borderColor: S.border }}>
                  {["cash", "bkash", "nagad", "bank", "card"].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {selectedBooking.dueAmount > 0 && (
                  <p className="text-xs" style={{ color: "#EF4444" }}>বাকি ছিল: {formatBDT(selectedBooking.dueAmount)}</p>
                )}
              </div>
            )}

            {actionModal === "add_payment" && (
              <div className="space-y-2 mb-3">
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="পরিমাণ ৳" value={actionData.amount ?? ""} onChange={e => setActionData(p => ({ ...p, amount: e.target.value }))} style={{ borderColor: S.border }} />
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={actionData.method ?? "cash"} onChange={e => setActionData(p => ({ ...p, method: e.target.value }))} style={{ borderColor: S.border }}>
                  {["cash", "bkash", "nagad", "bank", "card"].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}

            {actionModal === "cancel" && (
              <p className="text-sm mb-4" style={{ color: "#7F1D1D" }}>এই বুকিং বাতিল করলে গাড়িটি আবার পাওয়া যাবে।</p>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setSelectedBooking(null); setActionModal(""); setError(""); }} className="flex-1 py-2.5 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
              <button onClick={handleAction} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium"
                style={{ background: actionModal === "cancel" ? "#EF4444" : S.primary }}>
                {saving ? "..." : actionModal === "cancel" ? "হ্যাঁ, বাতিল করুন" : "নিশ্চিত করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
