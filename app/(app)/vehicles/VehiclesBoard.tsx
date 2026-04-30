"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Car, Search, Plus, Loader2, RefreshCw, X, ChevronRight } from "lucide-react";

const VEHICLE_ICONS: Record<string, string> = {
  car: "🚗", motorcycle: "🏍️", cng: "🛺", microbus: "🚐", truck: "🚛", bus: "🚌",
};

const VEHICLE_TYPES = [
  { value: "car", label: "গাড়ি (Car)" },
  { value: "motorcycle", label: "মোটরসাইকেল" },
  { value: "cng", label: "CNG / অটোরিকশা" },
  { value: "microbus", label: "মাইক্রোবাস" },
  { value: "truck", label: "ট্রাক" },
  { value: "bus", label: "বাস" },
];

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "#B45309",
};

type Vehicle = {
  id: string;
  regNumber: string;
  type: string;
  brand: string;
  model: string;
  year?: number | null;
  color?: string | null;
  customer?: { id: string; name: string; phone?: string | null } | null;
  jobCards: { id: string; status: string; createdAt: string }[];
  _count: { jobCards: number };
};

export default function VehiclesBoard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    regNumber: "",
    type: "car",
    brand: "",
    model: "",
    year: "",
    color: "",
    fuelType: "petrol",
    engineCC: "",
    customerName: "",
    customerPhone: "",
  });

  const fetchVehicles = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const url = `/api/vehicles?${search ? `search=${encodeURIComponent(search)}` : ""}`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) setVehicles(await res.json());
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const handleSubmit = async () => {
    if (!form.regNumber || !form.brand || !form.model || !form.customerName || !form.customerPhone) {
      setError("সকল * চিহ্নিত ঘর পূরণ করুন");
      return;
    }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "সমস্যা হয়েছে"); return; }
      setShowModal(false);
      setForm({ regNumber: "", type: "car", brand: "", model: "", year: "", color: "", fuelType: "petrol", engineCC: "", customerName: "", customerPhone: "" });
      await fetchVehicles(true);
    } catch { setError("সমস্যা হয়েছে"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car size={20} style={{ color: S.primary }} />
          <h1 className="text-lg font-bold" style={{ color: S.text }}>গাড়ির তালিকা</h1>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#B45309" }}>
            {vehicles.length}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchVehicles(true)} className="p-2 rounded-lg border" style={{ borderColor: S.border }}>
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} style={{ color: S.muted }} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: S.primary }}
          >
            <Plus size={14} />
            নতুন গাড়ি
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: S.border }}>
        <Search size={14} style={{ color: S.muted }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="রেজিস্ট্রেশন / মালিকের নাম / ফোন..."
          className="flex-1 text-sm bg-transparent outline-none"
          style={{ color: S.text }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" style={{ color: S.primary }} size={28} />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-12" style={{ color: S.muted }}>
          <Car size={40} className="mx-auto mb-2 opacity-30" />
          <p>কোনো গাড়ি নেই</p>
        </div>
      ) : (
        <div className="space-y-2">
          {vehicles.map(v => {
            const icon = VEHICLE_ICONS[v.type] ?? "🚗";
            const lastJob = v.jobCards[0];
            return (
              <Link key={v.id} href={`/vehicles/${v.id}`}>
                <div
                  className="flex items-center gap-3 rounded-xl p-4 hover:opacity-90 transition"
                  style={{ background: S.surface, border: `1px solid ${S.border}` }}
                >
                  <span className="text-3xl">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base" style={{ color: S.text }}>{v.regNumber}</span>
                      {v._count.jobCards > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#E1F5EE", color: "#0F6E56" }}>
                          {v._count.jobCards} বার সার্ভিস
                        </span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: S.muted }}>{v.brand} {v.model} {v.year ? `(${v.year})` : ""}{v.color ? ` · ${v.color}` : ""}</p>
                    {v.customer && (
                      <p className="text-xs" style={{ color: S.muted }}>👤 {v.customer.name} · {v.customer.phone}</p>
                    )}
                    {lastJob && (
                      <p className="text-xs" style={{ color: S.muted }}>
                        শেষ সার্ভিস: {new Date(lastJob.createdAt).toLocaleDateString("bn-BD")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/jobcards?new=1&vehicle=${v.id}`}
                      onClick={e => e.stopPropagation()}
                      className="text-xs px-2 py-1 rounded-lg border"
                      style={{ borderColor: S.primary, color: S.primary }}
                    >
                      নতুন Job Card
                    </Link>
                    <ChevronRight size={16} style={{ color: S.muted }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* New vehicle modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: S.surface }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: S.border }}>
              <h2 className="font-bold" style={{ color: S.text }}>নতুন গাড়ি যোগ করুন</h2>
              <button onClick={() => setShowModal(false)}><X size={20} style={{ color: S.muted }} /></button>
            </div>
            <div className="p-4 space-y-3">
              {error && <div className="text-sm p-3 rounded-lg bg-red-50 text-red-600">{error}</div>}
              <input
                value={form.regNumber}
                onChange={e => setForm(f => ({ ...f, regNumber: e.target.value }))}
                placeholder="রেজিস্ট্রেশন নম্বর * (যেমন: DHA-GA-1234)"
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                style={{ borderColor: S.border, color: S.text, background: S.surface }}
              />
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                style={{ borderColor: S.border, color: S.text, background: S.surface }}>
                {VEHICLE_TYPES.map(t => <option key={t.value} value={t.value}>{VEHICLE_ICONS[t.value]} {t.label}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                  placeholder="ব্র্যান্ড *"
                  className="border rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text, background: S.surface }} />
                <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                  placeholder="মডেল *"
                  className="border rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text, background: S.surface }} />
                <input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                  placeholder="বছর" type="number"
                  className="border rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text, background: S.surface }} />
                <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  placeholder="রং"
                  className="border rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text, background: S.surface }} />
              </div>

              <p className="text-xs font-medium pt-1" style={{ color: S.muted }}>মালিকের তথ্য</p>
              <div className="grid grid-cols-2 gap-2">
                <input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                  placeholder="নাম *"
                  className="border rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text, background: S.surface }} />
                <input value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                  placeholder="ফোন *"
                  className="border rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text, background: S.surface }} />
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-lg border text-sm" style={{ borderColor: S.border, color: S.muted }}>
                  বাতিল
                </button>
                <button onClick={handleSubmit} disabled={saving}
                  className="flex-1 py-2 rounded-lg text-white text-sm font-medium" style={{ background: S.primary }}>
                  {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : "যোগ করুন"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
