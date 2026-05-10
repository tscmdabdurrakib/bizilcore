"use client";

import { useState, useEffect, useCallback } from "react";
import { Car, Plus, Search, X, Wrench, CheckCircle, AlertTriangle } from "lucide-react";

const S = {
  surface: "var(--c-surface)",
  border:  "var(--c-border)",
  text:    "var(--c-text)",
  muted:   "var(--c-text-muted)",
  primary: "#DC2626",
};

const VEHICLE_TYPES = ["car", "microbus", "bus", "motorcycle", "cng", "pickup"];
const VEHICLE_TYPE_LABELS: Record<string, string> = {
  car: "🚗 কার", microbus: "🚐 মাইক্রোবাস", bus: "🚌 বাস",
  motorcycle: "🏍️ মোটরসাইকেল", cng: "🛺 সিএনজি", pickup: "🛻 পিকআপ",
};
const FUEL_TYPES = ["petrol", "diesel", "cng", "hybrid"];
const FUEL_LABELS: Record<string, string> = { petrol: "পেট্রোল", diesel: "ডিজেল", cng: "সিএনজি", hybrid: "হাইব্রিড" };

const STATUS_CONFIG = {
  available:   { label: "পাওয়া যাচ্ছে",  bg: "#DCFCE7", color: "#166534", dot: "#10B981" },
  on_trip:     { label: "ট্রিপে আছে",   bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6" },
  maintenance: { label: "সার্ভিসিং",     bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
  retired:     { label: "অবসর",          bg: "#F3F4F6", color: "#374151", dot: "#9CA3AF" },
};

type Vehicle = {
  id: string;
  regNumber: string;
  type: string;
  brand: string;
  model: string;
  year?: number | null;
  color: string;
  seats: number;
  fuelType: string;
  acAvailable: boolean;
  dailyRate: number;
  halfDayRate?: number | null;
  hourlyRate?: number | null;
  monthlyRate?: number | null;
  status: string;
  nextService?: string | null;
  notes?: string | null;
  defaultDriver?: { id: string; name: string; phone: string } | null;
  _count?: { bookings: number };
};

type Driver = { id: string; name: string; phone: string };

export default function FleetBoard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);

  const [form, setForm] = useState({
    regNumber: "", type: "car", brand: "", model: "", year: "", color: "",
    seats: "4", fuelType: "petrol", acAvailable: false,
    dailyRate: "", halfDayRate: "", hourlyRate: "", monthlyRate: "",
    defaultDriverId: "", nextService: "", imageUrl: "", notes: "", status: "available",
  });

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/carrental/vehicles?${params}`);
    const data = await res.json();
    setVehicles(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  useEffect(() => {
    fetch("/api/carrental/drivers").then(r => r.json()).then(d => setDrivers(Array.isArray(d) ? d : []));
  }, []);

  const resetForm = () => setForm({
    regNumber: "", type: "car", brand: "", model: "", year: "", color: "",
    seats: "4", fuelType: "petrol", acAvailable: false,
    dailyRate: "", halfDayRate: "", hourlyRate: "", monthlyRate: "",
    defaultDriverId: "", nextService: "", imageUrl: "", notes: "", status: "available",
  });

  const openEdit = (v: Vehicle) => {
    setEditVehicle(v);
    setForm({
      regNumber: v.regNumber, type: v.type, brand: v.brand, model: v.model,
      year: v.year ? String(v.year) : "", color: v.color, seats: String(v.seats),
      fuelType: v.fuelType, acAvailable: v.acAvailable,
      dailyRate: String(v.dailyRate), halfDayRate: v.halfDayRate ? String(v.halfDayRate) : "",
      hourlyRate: v.hourlyRate ? String(v.hourlyRate) : "", monthlyRate: v.monthlyRate ? String(v.monthlyRate) : "",
      defaultDriverId: v.defaultDriver?.id ?? "", nextService: v.nextService ? v.nextService.split("T")[0] : "",
      imageUrl: "", notes: v.notes ?? "", status: v.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.regNumber || !form.brand || !form.model || !form.color || !form.dailyRate) {
      setError("রেজিস্ট্রেশন নম্বর, ব্র্যান্ড, মডেল, রঙ ও দৈনিক রেট আবশ্যক");
      return;
    }
    setSaving(true); setError("");

    const url = editVehicle ? `/api/carrental/vehicles/${editVehicle.id}` : "/api/carrental/vehicles";
    const method = editVehicle ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setShowModal(false);
      resetForm();
      setEditVehicle(null);
      fetchVehicles();
    } else {
      const d = await res.json();
      setError(d.error ?? "ত্রুটি হয়েছে");
    }
    setSaving(false);
  };

  const filtered = vehicles.filter(v =>
    !search || v.regNumber.toLowerCase().includes(search.toLowerCase()) ||
    v.brand.toLowerCase().includes(search.toLowerCase()) ||
    v.model.toLowerCase().includes(search.toLowerCase())
  );

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/carrental/vehicles/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchVehicles();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border" placeholder="রেজি নম্বর, ব্র্যান্ড..." value={search} onChange={e => setSearch(e.target.value)} style={{ borderColor: S.border, background: S.surface }} />
          {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={12} style={{ color: S.muted }} /></button>}
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: S.border, background: S.surface }}>
          <option value="">সব স্ট্যাটাস</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={() => { resetForm(); setEditVehicle(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium ml-auto" style={{ background: S.primary }}>
          <Plus size={15} /> গাড়ি যোগ করুন
        </button>
      </div>

      {/* Vehicle grid */}
      {loading ? (
        <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <Car size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">কোনো গাড়ি নেই</p>
          <p className="text-sm mt-1">নতুন গাড়ি যোগ করুন</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(v => {
            const cfg = STATUS_CONFIG[v.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.available;
            const serviceDate = v.nextService ? new Date(v.nextService) : null;
            const serviceDays = serviceDate ? Math.ceil((serviceDate.getTime() - Date.now()) / (1000*60*60*24)) : null;
            return (
              <div key={v.id} className="rounded-xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm" style={{ color: S.text }}>{v.regNumber}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: cfg.bg, color: cfg.color }}>● {cfg.label}</span>
                      {v.acAvailable && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">AC</span>}
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: S.text }}>{v.brand} {v.model} {v.year ? `(${v.year})` : ""}</p>
                    <p className="text-xs mt-0.5" style={{ color: S.muted }}>{VEHICLE_TYPE_LABELS[v.type] ?? v.type} · {v.seats} আসন · {FUEL_LABELS[v.fuelType] ?? v.fuelType} · {v.color}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: S.primary }}>৳{v.dailyRate}/দিন</p>
                    {v.hourlyRate && <p className="text-xs" style={{ color: S.muted }}>৳{v.hourlyRate}/ঘণ্টা</p>}
                  </div>
                </div>

                {v.defaultDriver && (
                  <p className="text-xs mb-2" style={{ color: S.muted }}>ড্রাইভার: {v.defaultDriver.name} · {v.defaultDriver.phone}</p>
                )}

                {serviceDays !== null && serviceDays <= 7 && (
                  <div className="flex items-center gap-1 text-xs mb-2" style={{ color: "#92400E" }}>
                    <Wrench size={11} />
                    <span>সার্ভিস {serviceDays <= 0 ? "পেরিয়ে গেছে!" : `${serviceDays} দিনে`}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2" style={{ borderTop: `1px solid ${S.border}` }}>
                  <span className="text-xs" style={{ color: S.muted }}>বুকিং: {v._count?.bookings ?? 0}টি</span>
                  <div className="ml-auto flex gap-2">
                    {v.status === "available" && (
                      <button onClick={() => updateStatus(v.id, "maintenance")} className="text-xs px-2 py-1 rounded-lg" style={{ background: "#FEF3C7", color: "#92400E" }}>
                        <Wrench size={11} className="inline mr-1" />সার্ভিসে দিন
                      </button>
                    )}
                    {v.status === "maintenance" && (
                      <button onClick={() => updateStatus(v.id, "available")} className="text-xs px-2 py-1 rounded-lg" style={{ background: "#DCFCE7", color: "#166534" }}>
                        <CheckCircle size={11} className="inline mr-1" />পাওয়া যাচ্ছে
                      </button>
                    )}
                    <button onClick={() => openEdit(v)} className="text-xs px-3 py-1 rounded-lg border" style={{ borderColor: S.border, color: S.muted }}>এডিট</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[90vh]" style={{ background: S.surface }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: S.border }}>
              <h2 className="font-bold text-base" style={{ color: S.text }}>{editVehicle ? "গাড়ি এডিট" : "নতুন গাড়ি যোগ করুন"}</h2>
              <button onClick={() => { setShowModal(false); setError(""); }}><X size={18} style={{ color: S.muted }} /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <div className="grid grid-cols-2 gap-2">
                <input className="border rounded-lg px-3 py-2 text-sm col-span-2" placeholder="রেজিস্ট্রেশন নম্বর * (যেমন: ঢাকা মেট্রো-গ ১১-১২৩৪)" value={form.regNumber} onChange={e => setForm(p => ({ ...p, regNumber: e.target.value }))} style={{ borderColor: S.border }} />
                <select className="border rounded-lg px-3 py-2 text-sm" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={{ borderColor: S.border }}>
                  {VEHICLE_TYPES.map(t => <option key={t} value={t}>{VEHICLE_TYPE_LABELS[t]}</option>)}
                </select>
                <select className="border rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={{ borderColor: S.border }}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <input className="border rounded-lg px-3 py-2 text-sm" placeholder="ব্র্যান্ড * (Toyota, Hiace...)" value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} style={{ borderColor: S.border }} />
                <input className="border rounded-lg px-3 py-2 text-sm" placeholder="মডেল * (Corolla, Land Cruiser...)" value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} style={{ borderColor: S.border }} />
                <input className="border rounded-lg px-3 py-2 text-sm" placeholder="রঙ *" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} style={{ borderColor: S.border }} />
                <input type="number" className="border rounded-lg px-3 py-2 text-sm" placeholder="বছর (2020)" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} style={{ borderColor: S.border }} />
                <input type="number" className="border rounded-lg px-3 py-2 text-sm" placeholder="আসন সংখ্যা *" value={form.seats} onChange={e => setForm(p => ({ ...p, seats: e.target.value }))} style={{ borderColor: S.border }} />
                <select className="border rounded-lg px-3 py-2 text-sm" value={form.fuelType} onChange={e => setForm(p => ({ ...p, fuelType: e.target.value }))} style={{ borderColor: S.border }}>
                  {FUEL_TYPES.map(f => <option key={f} value={f}>{FUEL_LABELS[f]}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm col-span-2 cursor-pointer" style={{ color: S.text }}>
                  <input type="checkbox" checked={form.acAvailable} onChange={e => setForm(p => ({ ...p, acAvailable: e.target.checked }))} />
                  AC আছে
                </label>
              </div>

              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: S.muted }}>ভাড়ার হার</p>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" className="border rounded-lg px-3 py-2 text-sm" placeholder="দৈনিক রেট ৳ *" value={form.dailyRate} onChange={e => setForm(p => ({ ...p, dailyRate: e.target.value }))} style={{ borderColor: S.border }} />
                <input type="number" className="border rounded-lg px-3 py-2 text-sm" placeholder="হাফ ডে ৳" value={form.halfDayRate} onChange={e => setForm(p => ({ ...p, halfDayRate: e.target.value }))} style={{ borderColor: S.border }} />
                <input type="number" className="border rounded-lg px-3 py-2 text-sm" placeholder="ঘণ্টা প্রতি ৳" value={form.hourlyRate} onChange={e => setForm(p => ({ ...p, hourlyRate: e.target.value }))} style={{ borderColor: S.border }} />
                <input type="number" className="border rounded-lg px-3 py-2 text-sm" placeholder="মাসিক ৳" value={form.monthlyRate} onChange={e => setForm(p => ({ ...p, monthlyRate: e.target.value }))} style={{ borderColor: S.border }} />
              </div>

              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: S.muted }}>অতিরিক্ত তথ্য</p>
              <div className="grid grid-cols-1 gap-2">
                <select className="border rounded-lg px-3 py-2 text-sm" value={form.defaultDriverId} onChange={e => setForm(p => ({ ...p, defaultDriverId: e.target.value }))} style={{ borderColor: S.border }}>
                  <option value="">ডিফল্ট ড্রাইভার (ঐচ্ছিক)</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name} · {d.phone}</option>)}
                </select>
                <input type="date" className="border rounded-lg px-3 py-2 text-sm" placeholder="পরবর্তী সার্ভিসের তারিখ" value={form.nextService} onChange={e => setForm(p => ({ ...p, nextService: e.target.value }))} style={{ borderColor: S.border }} />
                <textarea className="border rounded-lg px-3 py-2 text-sm resize-none" placeholder="নোট" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} style={{ borderColor: S.border }} />
              </div>
            </div>

            <div className="p-4 border-t flex gap-3" style={{ borderColor: S.border }}>
              <button onClick={() => { setShowModal(false); setError(""); }} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
              <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: S.primary }}>
                {saving ? "সেভ হচ্ছে..." : editVehicle ? "আপডেট করুন" : "সেভ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
