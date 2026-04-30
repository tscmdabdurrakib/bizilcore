"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatBDT } from "@/lib/utils";
import {
  ArrowLeft, Car, Clock, Wrench, Package, Plus, Trash2,
  CheckCircle, Loader2, AlertCircle, Truck, X,
} from "lucide-react";

const STATUS_STEPS = [
  { key: "received",      label: "গাড়ি এসেছে" },
  { key: "diagnosing",    label: "Diagnosis" },
  { key: "waiting_parts", label: "Parts অপেক্ষা" },
  { key: "repairing",     label: "মেরামত" },
  { key: "quality_check", label: "Quality Check" },
  { key: "ready",         label: "Ready" },
];

const STATUS_ALL = [...STATUS_STEPS.map(s => s.key), "delivered"];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  normal:  { label: "⚪ Normal",  color: "#6B7280", bg: "#F3F4F6" },
  urgent:  { label: "🟡 Urgent", color: "#B45309", bg: "#FEF3C7" },
  express: { label: "🔴 Express", color: "#DC2626", bg: "#FEE2E2" },
};

const VEHICLE_ICONS: Record<string, string> = {
  car: "🚗", motorcycle: "🏍️", cng: "🛺", microbus: "🚐", truck: "🚛", bus: "🚌",
};

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "#B45309",
};

type JobCardData = {
  id: string;
  jobNumber: string;
  status: string;
  priority: string;
  complaint: string;
  diagnosis?: string | null;
  workDescription?: string | null;
  assignedToId?: string | null;
  estimatedAmt?: number | null;
  laborCharge: number;
  partsTotal: number;
  totalAmount: number;
  advancePaid: number;
  dueAmount: number;
  mileageIn?: number | null;
  mileageOut?: number | null;
  estimatedDone?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  vehicle: {
    id: string;
    regNumber: string;
    type: string;
    brand: string;
    model: string;
    year?: number | null;
    color?: string | null;
    customer?: {
      id: string;
      name: string;
      phone?: string | null;
    } | null;
  };
  parts: Array<{
    id: string;
    partName: string;
    partNumber?: string | null;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    isFromStock: boolean;
    product?: { id: string; name: string; stockQty: number } | null;
  }>;
  services: Array<{
    id: string;
    serviceName: string;
    laborCost: number;
    mechanicId?: string | null;
  }>;
};

type Product = { id: string; name: string; sellPrice: number; stockQty: number };

export default function JobCardDetail({ id }: { id: string }) {
  const [job, setJob] = useState<JobCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showAddPart, setShowAddPart] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showDeliver, setShowDeliver] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [partForm, setPartForm] = useState({ partName: "", partNumber: "", quantity: "1", unitPrice: "", productId: "", isFromStock: false });
  const [serviceForm, setServiceForm] = useState({ serviceName: "", laborCost: "" });
  const [paymentAmt, setPaymentAmt] = useState("");
  const [deliverForm, setDeliverForm] = useState({ mileageOut: "", finalPayment: "" });

  const [diagText, setDiagText] = useState("");
  const [workText, setWorkText] = useState("");
  const [editingDiag, setEditingDiag] = useState(false);

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobcards/${id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setJob(data);
        setDiagText(data.diagnosis || "");
        setWorkText(data.workDescription || "");
      }
    } catch {}
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchJob(); }, [fetchJob]);

  useEffect(() => {
    if (showAddPart) {
      fetch("/api/inventory?limit=500").then(r => r.json()).then(d => setProducts(Array.isArray(d) ? d : d.products || [])).catch(() => {});
    }
  }, [showAddPart]);

  const updateStatus = async (status: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/jobcards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) { setJob(await res.json()); setShowStatusMenu(false); }
    } catch {}
    finally { setSaving(false); }
  };

  const saveDiagnostics = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/jobcards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnosis: diagText, workDescription: workText }),
      });
      if (res.ok) { setJob(await res.json()); setEditingDiag(false); }
    } catch {}
    finally { setSaving(false); }
  };

  const addPart = async () => {
    if (!partForm.partName || !partForm.unitPrice) { setError("পার্টসের নাম ও দাম আবশ্যক"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/jobcards/${id}/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partForm),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "সমস্যা হয়েছে"); return; }
      setShowAddPart(false);
      setPartForm({ partName: "", partNumber: "", quantity: "1", unitPrice: "", productId: "", isFromStock: false });
      await fetchJob();
    } catch { setError("সমস্যা হয়েছে"); }
    finally { setSaving(false); }
  };

  const deletePart = async (partId: string) => {
    try {
      await fetch(`/api/jobcards/${id}/parts?partId=${partId}`, { method: "DELETE" });
      await fetchJob();
    } catch {}
  };

  const addService = async () => {
    if (!serviceForm.serviceName || !serviceForm.laborCost) { setError("সার্ভিসের তথ্য আবশ্যক"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/jobcards/${id}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceForm),
      });
      if (!res.ok) { setError((await res.json()).error); return; }
      setShowAddService(false);
      setServiceForm({ serviceName: "", laborCost: "" });
      await fetchJob();
    } catch { setError("সমস্যা হয়েছে"); }
    finally { setSaving(false); }
  };

  const deleteService = async (serviceId: string) => {
    try {
      await fetch(`/api/jobcards/${id}/services?serviceId=${serviceId}`, { method: "DELETE" });
      await fetchJob();
    } catch {}
  };

  const makePayment = async () => {
    if (!paymentAmt || Number(paymentAmt) <= 0) { setError("পরিমাণ দিন"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/jobcards/${id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(paymentAmt) }),
      });
      if (res.ok) { setJob(await res.json()); setShowPayment(false); setPaymentAmt(""); }
    } catch {}
    finally { setSaving(false); }
  };

  const deliverCar = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/jobcards/${id}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deliverForm),
      });
      if (res.ok) { setJob(await res.json()); setShowDeliver(false); }
    } catch {}
    finally { setSaving(false); }
  };

  const selectProduct = (p: Product) => {
    setPartForm(f => ({
      ...f,
      partName: p.name,
      unitPrice: String(p.sellPrice),
      productId: p.id,
      isFromStock: true,
    }));
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: S.primary }} size={32} /></div>;
  }
  if (!job) {
    return <div className="p-6 text-center" style={{ color: S.muted }}>জব কার্ড পাওয়া যায়নি</div>;
  }

  const prio = PRIORITY_CONFIG[job.priority] ?? PRIORITY_CONFIG.normal;
  const stepIndex = STATUS_STEPS.findIndex(s => s.key === job.status);
  const icon = VEHICLE_ICONS[job.vehicle.type] ?? "🚗";
  const isDelivered = job.status === "delivered";

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Link href="/jobcards" className="p-2 rounded-lg border" style={{ borderColor: S.border }}>
          <ArrowLeft size={16} style={{ color: S.muted }} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg" style={{ color: S.text }}>{job.jobNumber}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: prio.bg, color: prio.color }}>{prio.label}</span>
          </div>
          <p className="text-xs" style={{ color: S.muted }}>{new Date(job.createdAt).toLocaleDateString("bn-BD")}</p>
        </div>
        {!isDelivered && (
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(s => !s)}
              className="px-3 py-2 rounded-lg text-sm border font-medium"
              style={{ borderColor: S.border, color: S.primary }}
            >
              স্ট্যাটাস আপডেট
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 top-10 z-10 rounded-xl shadow-lg border py-1 min-w-[180px]"
                style={{ background: S.surface, borderColor: S.border }}>
                {STATUS_ALL.map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    className="w-full text-left px-4 py-2 text-sm hover:opacity-70"
                    style={{ color: job.status === s ? S.primary : S.text, fontWeight: job.status === s ? 600 : 400 }}
                  >
                    {STATUS_STEPS.find(st => st.key === s)?.label ?? "Delivered"}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vehicle + customer info */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
        <div className="flex items-start gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <p className="font-bold text-lg" style={{ color: S.text }}>{job.vehicle.regNumber}</p>
            <p className="text-sm" style={{ color: S.muted }}>{job.vehicle.brand} {job.vehicle.model} {job.vehicle.year ? `(${job.vehicle.year})` : ""} · {job.vehicle.color || ""}</p>
          </div>
        </div>
        {job.vehicle.customer && (
          <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "#F9FAFB" }}>
            <span className="text-sm">👤</span>
            <div>
              <p className="text-sm font-medium" style={{ color: S.text }}>{job.vehicle.customer.name}</p>
              <p className="text-xs" style={{ color: S.muted }}>{job.vehicle.customer.phone}</p>
            </div>
          </div>
        )}
        <div className="text-sm" style={{ color: S.text }}>
          <span className="font-medium">অভিযোগ: </span>
          <span style={{ color: S.muted }}>{job.complaint}</span>
        </div>
        {job.mileageIn && <p className="text-xs" style={{ color: S.muted }}>মাইলেজ (ইন): {job.mileageIn} km</p>}
        {job.estimatedDone && <p className="text-xs" style={{ color: S.muted }}>অনুমানিত ডেলিভারি: {new Date(job.estimatedDone).toLocaleDateString("bn-BD")}</p>}
      </div>

      {/* Progress bar */}
      <div className="rounded-xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
        <p className="text-xs font-medium mb-3" style={{ color: S.muted }}>প্রগতি</p>
        <div className="flex gap-1">
          {STATUS_STEPS.map((s, i) => (
            <div key={s.key} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full h-1.5 rounded-full"
                style={{ background: i <= stepIndex ? S.primary : S.border }}
              />
              <span className="text-[9px] text-center leading-tight" style={{ color: i <= stepIndex ? S.primary : S.muted }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
        {isDelivered && (
          <div className="flex items-center gap-1 mt-2">
            <CheckCircle size={14} style={{ color: "#166534" }} />
            <span className="text-xs font-medium" style={{ color: "#166534" }}>
              ডেলিভার হয়েছে {job.deliveredAt ? `· ${new Date(job.deliveredAt).toLocaleDateString("bn-BD")}` : ""}
            </span>
          </div>
        )}
      </div>

      {/* Diagnosis & Work Description */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm" style={{ color: S.text }}>Diagnosis & কাজের বিবরণ</h3>
          {!isDelivered && !editingDiag && (
            <button onClick={() => setEditingDiag(true)} className="text-xs" style={{ color: S.primary }}>সম্পাদনা</button>
          )}
        </div>
        {editingDiag ? (
          <div className="space-y-2">
            <div>
              <label className="text-xs mb-1 block" style={{ color: S.muted }}>Diagnosis</label>
              <textarea value={diagText} onChange={e => setDiagText(e.target.value)} rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none"
                style={{ borderColor: S.border, color: S.text, background: S.surface }}
                placeholder="মেকানিকের পর্যবেক্ষণ..." />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: S.muted }}>কাজের বিবরণ</label>
              <textarea value={workText} onChange={e => setWorkText(e.target.value)} rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none"
                style={{ borderColor: S.border, color: S.text, background: S.surface }}
                placeholder="কী কী কাজ করা হয়েছে..." />
            </div>
            <div className="flex gap-2">
              <button onClick={saveDiagnostics} disabled={saving}
                className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: S.primary }}>
                {saving ? <Loader2 size={12} className="animate-spin" /> : "সংরক্ষণ"}
              </button>
              <button onClick={() => setEditingDiag(false)} className="px-4 py-2 rounded-lg border text-sm"
                style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {job.diagnosis ? <p className="text-sm" style={{ color: S.text }}><strong>Diagnosis:</strong> {job.diagnosis}</p>
              : <p className="text-xs" style={{ color: S.muted }}>Diagnosis লেখা হয়নি</p>}
            {job.workDescription ? <p className="text-sm" style={{ color: S.text }}><strong>কাজ:</strong> {job.workDescription}</p>
              : <p className="text-xs" style={{ color: S.muted }}>কাজের বিবরণ নেই</p>}
          </div>
        )}
      </div>

      {/* Services */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm" style={{ color: S.text }}>
            <Wrench size={14} className="inline mr-1" style={{ color: S.primary }} />
            সার্ভিস ({job.services.length})
          </h3>
          {!isDelivered && (
            <button onClick={() => setShowAddService(true)} className="flex items-center gap-1 text-xs" style={{ color: S.primary }}>
              <Plus size={12} /> যোগ করুন
            </button>
          )}
        </div>
        {job.services.length === 0 ? (
          <p className="text-xs" style={{ color: S.muted }}>কোনো সার্ভিস নেই</p>
        ) : (
          <div className="space-y-1">
            {job.services.map(svc => (
              <div key={svc.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "#F9FAFB" }}>
                <span className="text-sm" style={{ color: S.text }}>{svc.serviceName}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium" style={{ color: S.primary }}>{formatBDT(svc.laborCost)}</span>
                  {!isDelivered && (
                    <button onClick={() => deleteService(svc.id)}><Trash2 size={14} style={{ color: "#DC2626" }} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {showAddService && (
          <div className="p-3 rounded-lg space-y-2" style={{ border: `1px dashed ${S.border}` }}>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <input value={serviceForm.serviceName} onChange={e => setServiceForm(f => ({ ...f, serviceName: e.target.value }))}
              placeholder="সার্ভিসের নাম"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
              style={{ borderColor: S.border, color: S.text, background: S.surface }} />
            <input value={serviceForm.laborCost} onChange={e => setServiceForm(f => ({ ...f, laborCost: e.target.value }))}
              placeholder="লেবার চার্জ (৳)" type="number"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
              style={{ borderColor: S.border, color: S.text, background: S.surface }} />
            <div className="flex gap-2">
              <button onClick={addService} disabled={saving} className="flex-1 py-2 rounded-lg text-white text-sm" style={{ background: S.primary }}>
                {saving ? <Loader2 size={12} className="animate-spin mx-auto" /> : "যোগ করুন"}
              </button>
              <button onClick={() => setShowAddService(false)} className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
            </div>
          </div>
        )}
      </div>

      {/* Parts */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm" style={{ color: S.text }}>
            <Package size={14} className="inline mr-1" style={{ color: "#0C447C" }} />
            পার্টস ({job.parts.length})
          </h3>
          {!isDelivered && (
            <button onClick={() => setShowAddPart(true)} className="flex items-center gap-1 text-xs" style={{ color: S.primary }}>
              <Plus size={12} /> যোগ করুন
            </button>
          )}
        </div>
        {job.parts.length === 0 ? (
          <p className="text-xs" style={{ color: S.muted }}>কোনো পার্টস নেই</p>
        ) : (
          <div className="space-y-1">
            {job.parts.map(part => (
              <div key={part.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "#F9FAFB" }}>
                <div>
                  <p className="text-sm" style={{ color: S.text }}>{part.partName} {part.isFromStock && <span className="text-xs text-blue-600">(স্টক)</span>}</p>
                  {part.partNumber && <p className="text-xs" style={{ color: S.muted }}>P/N: {part.partNumber}</p>}
                  <p className="text-xs" style={{ color: S.muted }}>{part.quantity} × {formatBDT(part.unitPrice)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium" style={{ color: "#0C447C" }}>{formatBDT(part.subtotal)}</span>
                  {!isDelivered && (
                    <button onClick={() => deletePart(part.id)}><Trash2 size={14} style={{ color: "#DC2626" }} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {showAddPart && (
          <div className="p-3 rounded-lg space-y-2" style={{ border: `1px dashed ${S.border}` }}>
            {error && <p className="text-xs text-red-600">{error}</p>}
            {products.length > 0 && (
              <div>
                <p className="text-xs mb-1" style={{ color: S.muted }}>স্টক থেকে বেছে নিন:</p>
                <div className="max-h-28 overflow-y-auto space-y-1">
                  {products.slice(0, 20).map(p => (
                    <button key={p.id} onClick={() => selectProduct(p)}
                      className="w-full text-left text-xs p-2 rounded-lg hover:opacity-80"
                      style={{ background: partForm.productId === p.id ? "#E1F5EE" : "#F9FAFB", color: S.text }}>
                      {p.name} · স্টক: {p.stockQty} · {formatBDT(p.sellPrice)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <input value={partForm.partName} onChange={e => setPartForm(f => ({ ...f, partName: e.target.value }))}
              placeholder="পার্টসের নাম *"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
              style={{ borderColor: S.border, color: S.text, background: S.surface }} />
            <div className="grid grid-cols-2 gap-2">
              <input value={partForm.partNumber} onChange={e => setPartForm(f => ({ ...f, partNumber: e.target.value }))}
                placeholder="Part Number"
                className="border rounded-lg px-3 py-2 text-sm outline-none"
                style={{ borderColor: S.border, color: S.text, background: S.surface }} />
              <input value={partForm.quantity} onChange={e => setPartForm(f => ({ ...f, quantity: e.target.value }))}
                placeholder="পরিমাণ" type="number"
                className="border rounded-lg px-3 py-2 text-sm outline-none"
                style={{ borderColor: S.border, color: S.text, background: S.surface }} />
              <input value={partForm.unitPrice} onChange={e => setPartForm(f => ({ ...f, unitPrice: e.target.value }))}
                placeholder="দাম (৳)" type="number"
                className="col-span-2 border rounded-lg px-3 py-2 text-sm outline-none"
                style={{ borderColor: S.border, color: S.text, background: S.surface }} />
            </div>
            <div className="flex gap-2">
              <button onClick={addPart} disabled={saving} className="flex-1 py-2 rounded-lg text-white text-sm" style={{ background: S.primary }}>
                {saving ? <Loader2 size={12} className="animate-spin mx-auto" /> : "যোগ করুন"}
              </button>
              <button onClick={() => { setShowAddPart(false); setError(""); }} className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
            </div>
          </div>
        )}
      </div>

      {/* Bill Summary */}
      <div className="rounded-xl p-4 space-y-2" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
        <h3 className="font-semibold text-sm mb-3" style={{ color: S.text }}>বিল সারসংক্ষেপ</h3>
        {[
          { label: "লেবার চার্জ", value: job.laborCharge },
          { label: "পার্টস", value: job.partsTotal },
        ].map(row => (
          <div key={row.label} className="flex justify-between text-sm">
            <span style={{ color: S.muted }}>{row.label}</span>
            <span style={{ color: S.text }}>{formatBDT(row.value)}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-bold border-t pt-2" style={{ borderColor: S.border }}>
          <span style={{ color: S.text }}>মোট</span>
          <span style={{ color: S.text }}>{formatBDT(job.totalAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: S.muted }}>অগ্রিম পেয়েছি</span>
          <span style={{ color: "#0F6E56" }}>- {formatBDT(job.advancePaid)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold">
          <span style={{ color: S.text }}>বাকি</span>
          <span style={{ color: job.dueAmount > 0 ? "#DC2626" : "#0F6E56" }}>{formatBDT(job.dueAmount)}</span>
        </div>

        {!isDelivered && job.dueAmount > 0 && (
          <button
            onClick={() => setShowPayment(true)}
            className="w-full mt-2 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: "#0F6E56" }}
          >
            পেমেন্ট নিন
          </button>
        )}
      </div>

      {/* Delivery action */}
      {!isDelivered && job.status === "ready" && (
        <button
          onClick={() => setShowDeliver(true)}
          className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
          style={{ background: "#0F6E56" }}
        >
          <Truck size={18} />
          গাড়ি দিয়ে দিন
        </button>
      )}

      {isDelivered && (
        <div className="rounded-xl p-4 text-center" style={{ background: "#DCFCE7", border: "1px solid #86EFAC" }}>
          <CheckCircle size={24} className="mx-auto mb-1" style={{ color: "#166534" }} />
          <p className="font-semibold text-sm" style={{ color: "#166534" }}>গাড়ি ডেলিভার হয়েছে</p>
          {job.deliveredAt && <p className="text-xs" style={{ color: "#166534" }}>{new Date(job.deliveredAt).toLocaleString("bn-BD")}</p>}
        </div>
      )}

      {/* Payment modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-4" style={{ background: S.surface }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ color: S.text }}>পেমেন্ট নিন</h3>
              <button onClick={() => setShowPayment(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <p className="text-sm" style={{ color: S.muted }}>বাকি: {formatBDT(job.dueAmount)}</p>
            <input
              type="number"
              value={paymentAmt}
              onChange={e => setPaymentAmt(e.target.value)}
              placeholder="পরিমাণ"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
              style={{ borderColor: S.border, color: S.text, background: S.surface }}
            />
            <button onClick={makePayment} disabled={saving}
              className="w-full py-2 rounded-lg text-white font-medium" style={{ background: "#0F6E56" }}>
              {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : "নিশ্চিত করুন"}
            </button>
          </div>
        </div>
      )}

      {/* Deliver modal */}
      {showDeliver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-4" style={{ background: S.surface }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ color: S.text }}>গাড়ি দিয়ে দিন</h3>
              <button onClick={() => setShowDeliver(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            {job.dueAmount > 0 && (
              <div>
                <label className="text-xs mb-1 block" style={{ color: S.muted }}>শেষ পেমেন্ট (বাকি: {formatBDT(job.dueAmount)})</label>
                <input type="number" value={deliverForm.finalPayment}
                  onChange={e => setDeliverForm(f => ({ ...f, finalPayment: e.target.value }))}
                  placeholder="৳ 0"
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text, background: S.surface }} />
              </div>
            )}
            <div>
              <label className="text-xs mb-1 block" style={{ color: S.muted }}>বর্তমান মাইলেজ (km)</label>
              <input type="number" value={deliverForm.mileageOut}
                onChange={e => setDeliverForm(f => ({ ...f, mileageOut: e.target.value }))}
                placeholder="মাইলেজ"
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                style={{ borderColor: S.border, color: S.text, background: S.surface }} />
            </div>
            <button onClick={deliverCar} disabled={saving}
              className="w-full py-2 rounded-lg text-white font-medium" style={{ background: "#0F6E56" }}>
              {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Deliver নিশ্চিত করুন ✓"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
