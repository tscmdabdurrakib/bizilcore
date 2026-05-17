"use client";

import { useState, useEffect, useCallback } from "react";
import { Fuel, Plus, X, Car, Loader2 } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import DatePicker from "@/components/ui/DatePicker";

const S = {
  surface: "var(--c-surface)",
  border:  "var(--c-border)",
  text:    "var(--c-text)",
  muted:   "var(--c-text-muted)",
  primary: "#DC2626",
};

type FuelLog = {
  id: string;
  liters: number;
  costPerL?: number | null;
  totalCost: number;
  kmAtFill?: number | null;
  station?: string | null;
  fuelDate: string;
  note?: string | null;
  vehicle: { regNumber: string; brand: string; model: string };
};

type Vehicle = { id: string; regNumber: string; brand: string; model: string };

type MonthlyTotal = {
  vehicleId: string;
  _sum: { totalCost: number | null; liters: number | null };
};

export default function FuelBoard() {
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([]);
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    vehicleId: "", liters: "", costPerL: "", totalCost: "",
    kmAtFill: "", station: "", fuelDate: new Date().toISOString().split("T")[0], note: "",
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (vehicleFilter) params.set("vehicleId", vehicleFilter);
    const res = await fetch(`/api/carrental/fuel?${params}`);
    const data = await res.json();
    setLogs(Array.isArray(data.logs) ? data.logs : []);
    setMonthlyTotals(Array.isArray(data.monthlyTotals) ? data.monthlyTotals : []);
    setLoading(false);
  }, [vehicleFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    fetch("/api/carrental/vehicles").then(r => r.json()).then(d => setVehicles(Array.isArray(d) ? d : []));
  }, []);

  // Auto-calculate total cost when liters or costPerL change
  const handleLitersChange = (val: string) => {
    setForm(p => {
      const liters = Number(val);
      const costPerL = Number(p.costPerL);
      const total = liters && costPerL ? String(liters * costPerL) : p.totalCost;
      return { ...p, liters: val, totalCost: total };
    });
  };
  const handleCostPerLChange = (val: string) => {
    setForm(p => {
      const liters = Number(p.liters);
      const costPerL = Number(val);
      const total = liters && costPerL ? String(liters * costPerL) : p.totalCost;
      return { ...p, costPerL: val, totalCost: total };
    });
  };

  const handleSubmit = async () => {
    if (!form.vehicleId || !form.liters || !form.totalCost) { setError("গাড়ি, লিটার ও মোট খরচ আবশ্যক"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/carrental/fuel", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ vehicleId: "", liters: "", costPerL: "", totalCost: "", kmAtFill: "", station: "", fuelDate: new Date().toISOString().split("T")[0], note: "" });
      fetchLogs();
    } else { const d = await res.json(); setError(d.error ?? "ত্রুটি হয়েছে"); }
    setSaving(false);
  };

  const totalThisMonth = monthlyTotals.reduce((s, m) => s + (m._sum.totalCost ?? 0), 0);
  const totalLitersThisMonth = monthlyTotals.reduce((s, m) => s + (m._sum.liters ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: S.border, background: S.surface }}>
          <option value="">সব গাড়ি</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model} [{v.regNumber}]</option>)}
        </select>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium ml-auto" style={{ background: S.primary }}>
          <Plus size={15} /> জ্বালানি লগ করুন
        </button>
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
          <p className="text-xs font-medium mb-1" style={{ color: S.muted }}>এই মাসের জ্বালানি খরচ</p>
          <p className="text-2xl font-bold" style={{ color: S.primary }}>{formatBDT(totalThisMonth)}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
          <p className="text-xs font-medium mb-1" style={{ color: S.muted }}>এই মাসে মোট লিটার</p>
          <p className="text-2xl font-bold" style={{ color: "#3B82F6" }}>{totalLitersThisMonth.toFixed(1)} লি.</p>
        </div>
      </div>

      {/* Log list */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin" size={26} style={{ color: S.primary }} /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <Fuel size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">কোনো জ্বালানি লগ নেই</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="rounded-xl p-4 flex items-start justify-between" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Car size={13} style={{ color: S.muted }} />
                  <p className="text-sm font-medium" style={{ color: S.text }}>{log.vehicle.brand} {log.vehicle.model} [{log.vehicle.regNumber}]</p>
                </div>
                <p className="text-xs" style={{ color: S.muted }}>
                  {log.liters} লিটার
                  {log.costPerL ? ` · ৳${log.costPerL}/লি.` : ""}
                  {log.kmAtFill ? ` · ${log.kmAtFill} km` : ""}
                  {log.station ? ` · ${log.station}` : ""}
                </p>
                <p className="text-xs mt-0.5" style={{ color: S.muted }}>{new Date(log.fuelDate).toLocaleDateString("bn-BD")}</p>
                {log.note && <p className="text-xs mt-0.5 italic" style={{ color: S.muted }}>{log.note}</p>}
              </div>
              <p className="text-sm font-bold flex-shrink-0" style={{ color: S.primary }}>{formatBDT(log.totalCost)}</p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col max-h-[90vh]" style={{ background: S.surface }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: S.border }}>
              <h2 className="font-bold text-base" style={{ color: S.text }}>জ্বালানি লগ করুন</h2>
              <button onClick={() => setShowModal(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.vehicleId} onChange={e => setForm(p => ({ ...p, vehicleId: e.target.value }))} style={{ borderColor: S.border }}>
                <option value="">গাড়ি নির্বাচন করুন *</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model} [{v.regNumber}]</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" className="border rounded-lg px-3 py-2 text-sm" placeholder="লিটার *" value={form.liters} onChange={e => handleLitersChange(e.target.value)} style={{ borderColor: S.border }} />
                <input type="number" className="border rounded-lg px-3 py-2 text-sm" placeholder="প্রতি লিটার ৳" value={form.costPerL} onChange={e => handleCostPerLChange(e.target.value)} style={{ borderColor: S.border }} />
                <input type="number" className="border rounded-lg px-3 py-2 text-sm col-span-2" placeholder="মোট খরচ ৳ *" value={form.totalCost} onChange={e => setForm(p => ({ ...p, totalCost: e.target.value }))} style={{ borderColor: S.border }} />
                <input type="number" className="border rounded-lg px-3 py-2 text-sm" placeholder="KM রিডিং" value={form.kmAtFill} onChange={e => setForm(p => ({ ...p, kmAtFill: e.target.value }))} style={{ borderColor: S.border }} />
                <input className="border rounded-lg px-3 py-2 text-sm" placeholder="পেট্রোল স্টেশন" value={form.station} onChange={e => setForm(p => ({ ...p, station: e.target.value }))} style={{ borderColor: S.border }} />
                <DatePicker value={form.fuelDate} onChange={v => setForm(p => ({ ...p, fuelDate: v }))} className="border rounded-lg px-3 py-2 text-sm col-span-2" style={{ borderColor: S.border }} />
                <textarea className="border rounded-lg px-3 py-2 text-sm col-span-2 resize-none" placeholder="নোট" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} rows={2} style={{ borderColor: S.border }} />
              </div>
            </div>
            <div className="p-4 border-t flex gap-3" style={{ borderColor: S.border }}>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
              <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: S.primary }}>
                {saving ? "সেভ হচ্ছে..." : "লগ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
