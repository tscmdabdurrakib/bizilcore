"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Search, X, Phone, CreditCard } from "lucide-react";

const S = {
  surface: "var(--c-surface)",
  border:  "var(--c-border)",
  text:    "var(--c-text)",
  muted:   "var(--c-text-muted)",
  primary: "#DC2626",
};

const DRIVER_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  available:  { label: "পাওয়া যাচ্ছে", bg: "#DCFCE7", color: "#166534" },
  on_trip:    { label: "ট্রিপে আছে",  bg: "#DBEAFE", color: "#1E40AF" },
  off:        { label: "ছুটিতে",      bg: "#FEF3C7", color: "#92400E" },
  terminated: { label: "অবসর",        bg: "#F3F4F6", color: "#374151" },
};

const LICENSE_TYPES = ["Light", "Heavy", "Professional"];

type Driver = {
  id: string;
  name: string;
  phone: string;
  licenseNo?: string | null;
  licenseType?: string | null;
  licenseExp?: string | null;
  nid?: string | null;
  address?: string | null;
  salary?: number | null;
  salaryType?: string | null;
  perTripRate?: number | null;
  status: string;
  vehicles: { id: string; regNumber: string; brand: string; model: string }[];
  _count: { bookings: number };
};

export default function DriversBoard() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", phone: "", licenseNo: "", licenseType: "Light",
    licenseExp: "", nid: "", address: "", salary: "",
    salaryType: "monthly", perTripRate: "", photoUrl: "",
  });

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/carrental/drivers");
    const data = await res.json();
    setDrivers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const resetForm = () => setForm({
    name: "", phone: "", licenseNo: "", licenseType: "Light",
    licenseExp: "", nid: "", address: "", salary: "",
    salaryType: "monthly", perTripRate: "", photoUrl: "",
  });

  const handleSubmit = async () => {
    if (!form.name || !form.phone) { setError("নাম ও ফোন আবশ্যক"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/carrental/drivers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setShowModal(false); resetForm(); fetchDrivers(); }
    else { const d = await res.json(); setError(d.error ?? "ত্রুটি হয়েছে"); }
    setSaving(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/carrental/drivers/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchDrivers();
  };

  const filtered = drivers.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.phone.includes(search) || (d.licenseNo ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const isLicenseExpiring = (exp?: string | null) => {
    if (!exp) return false;
    return (new Date(exp).getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border" placeholder="নাম বা ফোন..." value={search} onChange={e => setSearch(e.target.value)} style={{ borderColor: S.border, background: S.surface }} />
          {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={12} /></button>}
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium ml-auto" style={{ background: S.primary }}>
          <Plus size={15} /> ড্রাইভার যোগ
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <Users size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">কোনো ড্রাইভার নেই</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(d => {
            const cfg = DRIVER_STATUS[d.status] ?? DRIVER_STATUS.available;
            const licExpiring = isLicenseExpiring(d.licenseExp);
            return (
              <div key={d.id} className="rounded-xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0" style={{ background: "#FEF2F2", color: S.primary }}>
                      {d.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: S.text }}>{d.name}</p>
                      <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: S.muted }}>
                        <Phone size={10} /> {d.phone}
                      </div>
                      {d.licenseType && (
                        <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: licExpiring ? "#DC2626" : S.muted }}>
                          <CreditCard size={10} /> {d.licenseType} License {d.licenseNo ? `· ${d.licenseNo}` : ""}
                          {licExpiring && " ⚠️ মেয়াদ শেষ হচ্ছে"}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                </div>

                {d.vehicles.length > 0 && (
                  <p className="text-xs mb-2" style={{ color: S.muted }}>গাড়ি: {d.vehicles.map(v => `${v.brand} [${v.regNumber}]`).join(", ")}</p>
                )}

                <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${S.border}` }}>
                  <div className="flex gap-2 text-xs" style={{ color: S.muted }}>
                    {d.salary && <span>{d.salaryType === "monthly" ? `মাসিক ৳${d.salary}` : ""}</span>}
                    {d.perTripRate && <span>ট্রিপ প্রতি ৳{d.perTripRate}</span>}
                    <span>মোট ট্রিপ: {d._count.bookings}</span>
                  </div>
                  <div className="flex gap-2">
                    {d.status === "available" && (
                      <button onClick={() => updateStatus(d.id, "off")} className="text-xs px-2 py-1 rounded-lg" style={{ background: "#FEF3C7", color: "#92400E" }}>ছুটি</button>
                    )}
                    {d.status === "off" && (
                      <button onClick={() => updateStatus(d.id, "available")} className="text-xs px-2 py-1 rounded-lg" style={{ background: "#DCFCE7", color: "#166534" }}>কাজে ফেরান</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[90vh]" style={{ background: S.surface }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: S.border }}>
              <h2 className="font-bold text-base" style={{ color: S.text }}>নতুন ড্রাইভার যোগ</h2>
              <button onClick={() => setShowModal(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="grid grid-cols-2 gap-2">
                <input className="border rounded-lg px-3 py-2 text-sm col-span-2" placeholder="নাম *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ borderColor: S.border }} />
                <input className="border rounded-lg px-3 py-2 text-sm" placeholder="ফোন নম্বর *" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={{ borderColor: S.border }} />
                <input className="border rounded-lg px-3 py-2 text-sm" placeholder="NID নম্বর" value={form.nid} onChange={e => setForm(p => ({ ...p, nid: e.target.value }))} style={{ borderColor: S.border }} />
                <input className="border rounded-lg px-3 py-2 text-sm" placeholder="License নম্বর" value={form.licenseNo} onChange={e => setForm(p => ({ ...p, licenseNo: e.target.value }))} style={{ borderColor: S.border }} />
                <select className="border rounded-lg px-3 py-2 text-sm" value={form.licenseType} onChange={e => setForm(p => ({ ...p, licenseType: e.target.value }))} style={{ borderColor: S.border }}>
                  {LICENSE_TYPES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <input type="date" className="border rounded-lg px-3 py-2 text-sm col-span-2" placeholder="License মেয়াদ শেষ" value={form.licenseExp} onChange={e => setForm(p => ({ ...p, licenseExp: e.target.value }))} style={{ borderColor: S.border }} />
                <input className="border rounded-lg px-3 py-2 text-sm col-span-2" placeholder="ঠিকানা" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} style={{ borderColor: S.border }} />
                <select className="border rounded-lg px-3 py-2 text-sm" value={form.salaryType} onChange={e => setForm(p => ({ ...p, salaryType: e.target.value }))} style={{ borderColor: S.border }}>
                  <option value="monthly">মাসিক বেতন</option>
                  <option value="per_trip">ট্রিপ প্রতি</option>
                </select>
                {form.salaryType === "monthly" ? (
                  <input type="number" className="border rounded-lg px-3 py-2 text-sm" placeholder="মাসিক বেতন ৳" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} style={{ borderColor: S.border }} />
                ) : (
                  <input type="number" className="border rounded-lg px-3 py-2 text-sm" placeholder="ট্রিপ প্রতি ৳" value={form.perTripRate} onChange={e => setForm(p => ({ ...p, perTripRate: e.target.value }))} style={{ borderColor: S.border }} />
                )}
              </div>
            </div>
            <div className="p-4 border-t flex gap-3" style={{ borderColor: S.border }}>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
              <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: S.primary }}>
                {saving ? "সেভ হচ্ছে..." : "যোগ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
