"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ClipboardList, LayoutGrid, List, Search, Plus, Loader2,
  RefreshCw, Car, Clock, AlertCircle, CheckCircle, Wrench,
  X, ChevronRight, ChevronLeft,
} from "lucide-react";

const STATUS_COLUMNS = [
  { key: "received",      label: "গাড়ি এসেছে",   color: "#0C447C", bg: "#E6F1FB" },
  { key: "diagnosing",    label: "Diagnosis",     color: "#B45309", bg: "#FEF3C7" },
  { key: "waiting_parts", label: "Parts অপেক্ষা", color: "#7C3AED", bg: "#EDE9FE" },
  { key: "repairing",     label: "মেরামত",        color: "#0F6E56", bg: "#E1F5EE" },
  { key: "quality_check", label: "Quality Check", color: "#0369A1", bg: "#E0F2FE" },
  { key: "ready",         label: "Ready",         color: "#166534", bg: "#DCFCE7" },
];

const ALL_STATUSES = [...STATUS_COLUMNS.map(s => s.key), "delivered"];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; border: string }> = {
  normal:  { label: "⚪ Normal",  color: "#6B7280", border: "#D1D5DB" },
  urgent:  { label: "🟡 Urgent", color: "#B45309", border: "#FCD34D" },
  express: { label: "🔴 Express", color: "#DC2626", border: "#FCA5A5" },
};

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

const FUEL_TYPES = ["petrol", "diesel", "cng", "electric"];

const COMPLAINT_SHORTCUTS = [
  "ইঞ্জিন সমস্যা", "ব্রেক ফেইল", "AC কাজ করছে না", "তেল পরিবর্তন",
  "টায়ার পরিবর্তন", "ইলেকট্রিক সমস্যা", "গিয়ার সমস্যা", "অন্যান্য",
];

const DEFAULT_SERVICES = [
  "Oil & Filter Change", "Brake Service", "AC Service",
  "Tyre Change/Repair", "Engine Repair", "Electrical Work",
  "Washing & Cleaning", "Body Work", "Battery Replace",
];

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "#B45309",
};

type JobCard = {
  id: string;
  jobNumber: string;
  status: string;
  priority: string;
  complaint: string;
  estimatedAmt?: number | null;
  assignedToId?: string | null;
  createdAt: string;
  vehicle: {
    regNumber: string;
    type: string;
    brand: string;
    model: string;
    customer?: { name: string; phone: string } | null;
  };
  parts: { id: string }[];
  services: { id: string; serviceName: string; laborCost: number }[];
};

type Staff = { id: string; user: { name: string }; jobTitle?: string | null };

const FILTER_TABS = [
  { key: "all", label: "সব" },
  { key: "active", label: "চলমান" },
  { key: "ready", label: "Ready" },
  { key: "delivered", label: "Delivered" },
  { key: "today", label: "আজকের" },
];

function timeSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "এইমাত্র";
  if (hours < 24) return `${hours}h আগে`;
  const days = Math.floor(hours / 24);
  return `${days}d আগে`;
}

export default function JobCardsBoard() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState(searchParams.get("filter") || "all");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");

  const [showModal, setShowModal] = useState(searchParams.get("new") === "1");
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [staff, setStaff] = useState<Staff[]>([]);

  const [vehicleSearch, setVehicleSearch] = useState("");
  const [foundVehicle, setFoundVehicle] = useState<{ id: string; regNumber: string; brand: string; model: string; customer?: { name: string; phone: string } | null } | null>(null);
  const [searchingVehicle, setSearchingVehicle] = useState(false);
  const [showNewVehicle, setShowNewVehicle] = useState(false);

  const [form, setForm] = useState({
    vehicleId: "",
    regNumber: "",
    vehicleType: "car",
    brand: "",
    model: "",
    year: "",
    color: "",
    fuelType: "petrol",
    engineCC: "",
    mileageIn: "",
    customerId: "",
    customerName: "",
    customerPhone: "",
    complaint: "",
    selectedServices: [] as string[],
    priority: "normal",
    assignedToId: "",
    estimatedDone: "",
    estimatedAmt: "",
    advancePaid: "",
  });

  const fetchJobs = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      let url = "/api/jobcards?";
      if (statusFilter) url += `status=${statusFilter}&`;
      if (filterTab === "today") url += "today=1&";
      if (search) url += `search=${encodeURIComponent(search)}&`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) setJobs(await res.json());
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, filterTab]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    fetch("/api/hr/staff").then(r => r.json()).then(setStaff).catch(() => {});
  }, []);

  const searchVehicle = async () => {
    if (!vehicleSearch.trim()) return;
    setSearchingVehicle(true);
    setFoundVehicle(null);
    try {
      const res = await fetch(`/api/vehicles?search=${encodeURIComponent(vehicleSearch)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const v = data[0];
          setFoundVehicle(v);
          setForm(f => ({
            ...f,
            vehicleId: v.id,
            regNumber: v.regNumber,
            vehicleType: v.type,
            brand: v.brand,
            model: v.model,
            customerId: v.customer?.id || "",
            customerName: v.customer?.name || "",
            customerPhone: v.customer?.phone || "",
          }));
          setShowNewVehicle(false);
        } else {
          setShowNewVehicle(true);
          setForm(f => ({ ...f, regNumber: vehicleSearch, vehicleId: "" }));
        }
      }
    } catch {}
    finally { setSearchingVehicle(false); }
  };

  const next = () => {
    setError("");
    if (step === 1) {
      if (!form.vehicleId && (!form.regNumber || !form.brand || !form.model)) {
        setError("রেজিস্ট্রেশন নম্বর, ব্র্যান্ড ও মডেল আবশ্যক");
        return;
      }
      if (!form.vehicleId && !form.customerId && (!form.customerName || !form.customerPhone)) {
        setError("মালিকের নাম ও ফোন নম্বর আবশ্যক");
        return;
      }
    }
    if (step === 2) {
      if (!form.complaint.trim()) {
        setError("অভিযোগ লিখুন");
        return;
      }
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const services = form.selectedServices.map(name => ({ serviceName: name, laborCost: 0 }));
      const res = await fetch("/api/jobcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, services }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "সমস্যা হয়েছে"); return; }
      setShowModal(false);
      router.push(`/jobcards/${data.id}`);
    } catch { setError("সমস্যা হয়েছে"); }
    finally { setSaving(false); }
  };

  const filteredJobs = jobs.filter(j => {
    if (filterTab === "active") return ["received", "diagnosing", "waiting_parts", "repairing", "quality_check"].includes(j.status);
    if (filterTab === "ready") return j.status === "ready";
    if (filterTab === "delivered") return j.status === "delivered";
    if (statusFilter) return j.status === statusFilter;
    return true;
  });

  const getStatusLabel = (status: string) => STATUS_COLUMNS.find(s => s.key === status) ?? STATUS_COLUMNS[0];

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList size={20} style={{ color: S.primary }} />
          <h1 className="text-lg font-bold" style={{ color: S.text }}>জব কার্ড</h1>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#B45309" }}>
            {filteredJobs.length}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchJobs(true)} className="p-2 rounded-lg border" style={{ borderColor: S.border }}>
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} style={{ color: S.muted }} />
          </button>
          <button
            onClick={() => setView(v => v === "kanban" ? "list" : "kanban")}
            className="p-2 rounded-lg border"
            style={{ borderColor: S.border }}
          >
            {view === "kanban" ? <List size={14} style={{ color: S.muted }} /> : <LayoutGrid size={14} style={{ color: S.muted }} />}
          </button>
          <button
            onClick={() => { setShowModal(true); setStep(1); setFoundVehicle(null); setShowNewVehicle(false); setVehicleSearch(""); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: S.primary }}
          >
            <Plus size={14} />
            নতুন Job Card
          </button>
        </div>
      </div>

      {/* Filter tabs + search */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--c-surface-hover, #F3F4F6)" }}>
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setFilterTab(tab.key); setStatusFilter(""); }}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition"
              style={{
                background: filterTab === tab.key ? S.primary : "transparent",
                color: filterTab === tab.key ? "#fff" : S.muted,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={14} style={{ color: S.muted }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="রেজিস্ট্রেশন / নাম খুঁজুন..."
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: S.text }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" style={{ color: S.primary }} size={28} />
        </div>
      ) : view === "kanban" ? (
        /* ── Kanban View ── */
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-3 min-w-max pb-4">
            {STATUS_COLUMNS.map(col => {
              const colJobs = filteredJobs.filter(j => j.status === col.key);
              return (
                <div key={col.key} className="w-64 shrink-0">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-xs font-semibold" style={{ color: col.color }}>{col.label}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: col.bg, color: col.color }}>{colJobs.length}</span>
                  </div>
                  <div className="space-y-2">
                    {colJobs.map(job => {
                      const prio = PRIORITY_CONFIG[job.priority] ?? PRIORITY_CONFIG.normal;
                      const icon = VEHICLE_ICONS[job.vehicle.type] ?? "🚗";
                      return (
                        <Link key={job.id} href={`/jobcards/${job.id}`}>
                          <div
                            className="rounded-lg p-3 cursor-pointer hover:opacity-90 transition"
                            style={{
                              background: S.surface,
                              border: `1.5px solid ${prio.border}`,
                            }}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <span className="text-xs" style={{ color: S.muted }}>{job.jobNumber}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: col.bg, color: col.color }}>
                                {prio.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-sm">{icon}</span>
                              <span className="font-bold text-sm" style={{ color: S.text }}>{job.vehicle.regNumber}</span>
                            </div>
                            <p className="text-xs mb-1.5 line-clamp-2" style={{ color: S.muted }}>
                              {job.complaint.slice(0, 50)}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs" style={{ color: S.muted }}>{job.vehicle.customer?.name}</span>
                              <span className="text-xs" style={{ color: S.muted }}>{timeSince(job.createdAt)}</span>
                            </div>
                            {job.estimatedAmt && (
                              <p className="text-xs font-medium mt-1" style={{ color: "#0F6E56" }}>
                                ৳{job.estimatedAmt.toLocaleString("bn-BD")}
                              </p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                    {colJobs.length === 0 && (
                      <div className="text-xs text-center py-4" style={{ color: S.muted }}>কোনো কাজ নেই</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── List View ── */
        <div className="space-y-2">
          {filteredJobs.length === 0 && (
            <div className="text-center py-12" style={{ color: S.muted }}>
              <ClipboardList size={40} className="mx-auto mb-2 opacity-30" />
              <p>কোনো জব কার্ড নেই</p>
            </div>
          )}
          {filteredJobs.map(job => {
            const prio = PRIORITY_CONFIG[job.priority] ?? PRIORITY_CONFIG.normal;
            const stCol = getStatusLabel(job.status);
            const icon = VEHICLE_ICONS[job.vehicle.type] ?? "🚗";
            return (
              <Link key={job.id} href={`/jobcards/${job.id}`}>
                <div
                  className="flex items-center gap-3 rounded-xl p-3 hover:opacity-90 transition"
                  style={{ background: S.surface, border: `1px solid ${S.border}` }}
                >
                  <span className="text-xl">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: S.text }}>{job.vehicle.regNumber}</span>
                      <span className="text-xs" style={{ color: S.muted }}>{job.jobNumber}</span>
                    </div>
                    <p className="text-xs truncate" style={{ color: S.muted }}>{job.complaint}</p>
                    <p className="text-xs" style={{ color: S.muted }}>{job.vehicle.customer?.name} · {job.vehicle.brand} {job.vehicle.model}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: stCol.bg, color: stCol.color }}>
                      {stCol.label}
                    </span>
                    <span className="text-xs" style={{ color: prio.color }}>{prio.label}</span>
                    <span className="text-xs" style={{ color: S.muted }}>{timeSince(job.createdAt)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── New Job Card Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: S.surface }}>
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: S.border }}>
              <div>
                <h2 className="font-bold" style={{ color: S.text }}>নতুন Job Card</h2>
                <p className="text-xs" style={{ color: S.muted }}>ধাপ {step} / 3</p>
              </div>
              <button onClick={() => setShowModal(false)}><X size={20} style={{ color: S.muted }} /></button>
            </div>

            {/* Step indicators */}
            <div className="flex gap-1 px-4 pt-3">
              {[1, 2, 3].map(n => (
                <div key={n} className="flex-1 h-1 rounded-full" style={{ background: step >= n ? S.primary : S.border }} />
              ))}
            </div>

            <div className="p-4 space-y-4">
              {error && <div className="text-sm p-3 rounded-lg bg-red-50 text-red-600">{error}</div>}

              {/* Step 1: Vehicle */}
              {step === 1 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm" style={{ color: S.text }}>গাড়ির তথ্য</h3>

                  <div className="flex gap-2">
                    <input
                      value={vehicleSearch}
                      onChange={e => setVehicleSearch(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && searchVehicle()}
                      placeholder="রেজিস্ট্রেশন নম্বর দিন (যেমন: DHA-GA-1234)"
                      className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ borderColor: S.border, color: S.text, background: S.surface }}
                    />
                    <button
                      onClick={searchVehicle}
                      disabled={searchingVehicle}
                      className="px-3 py-2 rounded-lg text-white text-sm"
                      style={{ background: S.primary }}
                    >
                      {searchingVehicle ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    </button>
                  </div>

                  {foundVehicle && (
                    <div className="p-3 rounded-lg" style={{ background: "#E1F5EE", border: "1px solid #86EFAC" }}>
                      <p className="text-sm font-semibold text-green-800">✓ গাড়ি পাওয়া গেছে</p>
                      <p className="text-xs text-green-700">{foundVehicle.brand} {foundVehicle.model} · {foundVehicle.customer?.name} · {foundVehicle.customer?.phone}</p>
                    </div>
                  )}

                  {showNewVehicle && (
                    <div className="space-y-2 p-3 rounded-lg" style={{ border: `1px dashed ${S.border}` }}>
                      <p className="text-xs font-medium" style={{ color: S.muted }}>নতুন গাড়ির তথ্য</p>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={form.vehicleType}
                          onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}
                          className="col-span-2 border rounded-lg px-3 py-2 text-sm outline-none"
                          style={{ borderColor: S.border, color: S.text, background: S.surface }}
                        >
                          {VEHICLE_TYPES.map(t => <option key={t.value} value={t.value}>{t.value} {t.label}</option>)}
                        </select>
                        <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="ব্র্যান্ড *" className="border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: S.border, color: S.text, background: S.surface }} />
                        <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="মডেল *" className="border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: S.border, color: S.text, background: S.surface }} />
                        <input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="বছর" type="number" className="border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: S.border, color: S.text, background: S.surface }} />
                        <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="রং" className="border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: S.border, color: S.text, background: S.surface }} />
                        <select value={form.fuelType} onChange={e => setForm(f => ({ ...f, fuelType: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: S.border, color: S.text, background: S.surface }}>
                          {FUEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input value={form.mileageIn} onChange={e => setForm(f => ({ ...f, mileageIn: e.target.value }))} placeholder="বর্তমান মাইলেজ" type="number" className="border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: S.border, color: S.text, background: S.surface }} />
                      </div>
                      <p className="text-xs font-medium mt-2" style={{ color: S.muted }}>মালিকের তথ্য</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="নাম *" className="border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: S.border, color: S.text, background: S.surface }} />
                        <input value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} placeholder="ফোন *" className="border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: S.border, color: S.text, background: S.surface }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Work info */}
              {step === 2 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm" style={{ color: S.text }}>কাজের বিবরণ</h3>

                  <div>
                    <label className="text-xs mb-1 block" style={{ color: S.muted }}>অভিযোগ (Customer Complaint) *</label>
                    <textarea
                      value={form.complaint}
                      onChange={e => setForm(f => ({ ...f, complaint: e.target.value }))}
                      rows={3}
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none"
                      style={{ borderColor: S.border, color: S.text, background: S.surface }}
                      placeholder="কাস্টমার কী সমস্যার কথা বলেছেন..."
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {COMPLAINT_SHORTCUTS.map(s => (
                        <button
                          key={s}
                          onClick={() => setForm(f => ({ ...f, complaint: f.complaint ? f.complaint + ", " + s : s }))}
                          className="text-xs px-2 py-1 rounded-full border"
                          style={{ borderColor: S.border, color: S.muted }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs mb-1 block" style={{ color: S.muted }}>সার্ভিস চেকলিস্ট</label>
                    <div className="grid grid-cols-2 gap-1">
                      {DEFAULT_SERVICES.map(svc => (
                        <label key={svc} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.selectedServices.includes(svc)}
                            onChange={e => setForm(f => ({
                              ...f,
                              selectedServices: e.target.checked
                                ? [...f.selectedServices, svc]
                                : f.selectedServices.filter(s => s !== svc),
                            }))}
                          />
                          <span style={{ color: S.text }}>{svc}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: S.muted }}>Priority</label>
                      <div className="flex gap-2">
                        {Object.entries(PRIORITY_CONFIG).map(([key, p]) => (
                          <button
                            key={key}
                            onClick={() => setForm(f => ({ ...f, priority: key }))}
                            className="flex-1 text-xs py-1.5 rounded-lg border font-medium"
                            style={{
                              borderColor: form.priority === key ? p.border : S.border,
                              background: form.priority === key ? p.border + "40" : "transparent",
                              color: form.priority === key ? p.color : S.muted,
                            }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: S.muted }}>মেকানিক</label>
                      <select
                        value={form.assignedToId}
                        onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ borderColor: S.border, color: S.text, background: S.surface }}
                      >
                        <option value="">বাছাই করুন</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.user.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs mb-1 block" style={{ color: S.muted }}>অনুমানিত ডেলিভারি</label>
                    <input
                      type="datetime-local"
                      value={form.estimatedDone}
                      onChange={e => setForm(f => ({ ...f, estimatedDone: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ borderColor: S.border, color: S.text, background: S.surface }}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {step === 3 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm" style={{ color: S.text }}>অগ্রিম পেমেন্ট</h3>

                  <div>
                    <label className="text-xs mb-1 block" style={{ color: S.muted }}>অনুমানিত মোট (ঐচ্ছিক)</label>
                    <input
                      type="number"
                      value={form.estimatedAmt}
                      onChange={e => setForm(f => ({ ...f, estimatedAmt: e.target.value }))}
                      placeholder="৳ 0"
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ borderColor: S.border, color: S.text, background: S.surface }}
                    />
                  </div>

                  <div>
                    <label className="text-xs mb-1 block" style={{ color: S.muted }}>অগ্রিম নেওয়া হয়েছে</label>
                    <input
                      type="number"
                      value={form.advancePaid}
                      onChange={e => setForm(f => ({ ...f, advancePaid: e.target.value }))}
                      placeholder="৳ 0"
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ borderColor: S.border, color: S.text, background: S.surface }}
                    />
                  </div>

                  {form.estimatedAmt && form.advancePaid && (
                    <div className="p-3 rounded-lg" style={{ background: "#F9FAFB", border: `1px solid ${S.border}` }}>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: S.muted }}>অনুমানিত</span>
                        <span style={{ color: S.text }}>৳{Number(form.estimatedAmt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: S.muted }}>অগ্রিম</span>
                        <span style={{ color: S.text }}>৳{Number(form.advancePaid).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold border-t mt-1 pt-1" style={{ borderColor: S.border }}>
                        <span style={{ color: S.text }}>বাকি</span>
                        <span style={{ color: "#DC2626" }}>৳{Math.max(0, Number(form.estimatedAmt) - Number(form.advancePaid)).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                {step > 1 && (
                  <button
                    onClick={() => setStep(s => s - 1)}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg border text-sm"
                    style={{ borderColor: S.border, color: S.muted }}
                  >
                    <ChevronLeft size={14} /> আগে
                  </button>
                )}
                {step < 3 ? (
                  <button
                    onClick={next}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ background: S.primary }}
                  >
                    পরবর্তী <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ background: S.primary }}
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                    Job Card তৈরি করুন
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
