"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, X, Pencil, Trash2, Package2, ChevronDown, ChevronUp, AlertTriangle, Check, Pill, FlaskConical, Loader2 } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface MedicineBatch {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  buyPrice: number | null;
}

interface Medicine {
  id: string;
  brandName: string;
  genericName: string | null;
  manufacturer: string | null;
  category: string;
  unit: string;
  sellPrice: number;
  buyPrice: number;
  stockQty: number;
  lowStockAt: number;
  requiresRx: boolean;
  isControlled: boolean;
  isActive: boolean;
  expiryStatus: "none" | "ok" | "warning" | "critical" | "expired";
  nearestExpiry: string | null;
  batches: MedicineBatch[];
}

const CATEGORIES = [
  { value: "tablet", label: "ট্যাবলেট" },
  { value: "syrup", label: "সিরাপ" },
  { value: "injection", label: "ইনজেকশন" },
  { value: "cream", label: "ক্রিম / মলম" },
  { value: "drop", label: "ড্রপ" },
  { value: "inhaler", label: "ইনহেলার" },
  { value: "other", label: "অন্যান্য" },
];

const UNITS = ["পিস", "বোতল", "স্ট্রিপ", "বক্স", "ভায়াল", "স্যাশে", "টিউব"];

const EXPIRY_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  none:     { label: "ব্যাচ নেই",      bg: "#F3F4F6", color: "#6B7280" },
  ok:       { label: "ভালো",            bg: "#DCFCE7", color: "#166534" },
  warning:  { label: "৩ মাসের মধ্যে",  bg: "#FEF9C3", color: "#92400E" },
  critical: { label: "১ মাসের মধ্যে",  bg: "#FEE2E2", color: "#991B1B" },
  expired:  { label: "মেয়াদ শেষ",      bg: "#1F2937", color: "#F9FAFB" },
};

const EMPTY_FORM = {
  brandName: "", genericName: "", manufacturer: "", category: "tablet",
  unit: "পিস", sellPrice: "", buyPrice: "", stockQty: "", lowStockAt: "10",
  requiresRx: false, isControlled: false,
  batchNumber: "", expiryDate: "", batchQty: "", batchBuyPrice: "",
};

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)",
};

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showBatchModal, setShowBatchModal] = useState<Medicine | null>(null);
  const [batchForm, setBatchForm] = useState({ batchNumber: "", expiryDate: "", quantity: "", buyPrice: "" });
  const [batchSaving, setBatchSaving] = useState(false);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (catFilter) params.set("category", catFilter);
    const r = await fetch(`/api/medicines?${params}`);
    const data = await r.json();
    setMedicines(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search, catFilter]);

  useEffect(() => {
    const t = setTimeout(fetchMedicines, 300);
    return () => clearTimeout(t);
  }, [fetchMedicines]);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  }

  function openEdit(m: Medicine) {
    setEditing(m);
    setForm({
      brandName: m.brandName, genericName: m.genericName ?? "", manufacturer: m.manufacturer ?? "",
      category: m.category, unit: m.unit, sellPrice: String(m.sellPrice), buyPrice: String(m.buyPrice),
      stockQty: String(m.stockQty), lowStockAt: String(m.lowStockAt),
      requiresRx: m.requiresRx, isControlled: m.isControlled,
      batchNumber: "", expiryDate: "", batchQty: "", batchBuyPrice: "",
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.brandName.trim() || !form.sellPrice) {
      showToast("error", "ওষুধের নাম ও বিক্রয় মূল্য আবশ্যক।");
      return;
    }
    setSaving(true);
    const payload: Record<string, unknown> = {
      brandName: form.brandName.trim(), genericName: form.genericName || null,
      manufacturer: form.manufacturer || null, category: form.category, unit: form.unit,
      sellPrice: Number(form.sellPrice), buyPrice: Number(form.buyPrice || 0),
      stockQty: Number(form.stockQty || 0), lowStockAt: Number(form.lowStockAt || 10),
      requiresRx: form.requiresRx, isControlled: form.isControlled,
    };
    if (!editing && form.batchNumber && form.expiryDate) {
      payload.batch = {
        batchNumber: form.batchNumber, expiryDate: form.expiryDate,
        quantity: Number(form.batchQty || form.stockQty || 0),
        buyPrice: form.batchBuyPrice ? Number(form.batchBuyPrice) : null,
      };
    }
    const url = editing ? `/api/medicines/${editing.id}` : "/api/medicines";
    const method = editing ? "PATCH" : "POST";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (r.ok) {
      showToast("success", editing ? "আপডেট হয়েছে ✓" : "ওষুধ যোগ হয়েছে ✓");
      setShowModal(false);
      fetchMedicines();
    } else {
      const d = await r.json();
      showToast("error", d.error ?? "সংরক্ষণ ব্যর্থ হয়েছে।");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const r = await fetch(`/api/medicines/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    if (r.ok) { showToast("success", "মুছে ফেলা হয়েছে।"); fetchMedicines(); }
    else showToast("error", "মুছতে ব্যর্থ হয়েছে।");
  }

  async function handleAddBatch() {
    if (!showBatchModal) return;
    if (!batchForm.batchNumber || !batchForm.expiryDate || !batchForm.quantity) {
      showToast("error", "ব্যাচ নম্বর, মেয়াদ ও পরিমাণ আবশ্যক।");
      return;
    }
    setBatchSaving(true);
    const r = await fetch(`/api/medicines/${showBatchModal.id}/batches`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batchNumber: batchForm.batchNumber, expiryDate: batchForm.expiryDate,
        quantity: Number(batchForm.quantity),
        buyPrice: batchForm.buyPrice ? Number(batchForm.buyPrice) : null,
      }),
    });
    setBatchSaving(false);
    if (r.ok) {
      showToast("success", "নতুন ব্যাচ যোগ হয়েছে ✓");
      setShowBatchModal(null);
      setBatchForm({ batchNumber: "", expiryDate: "", quantity: "", buyPrice: "" });
      fetchMedicines();
    } else showToast("error", "ব্যাচ যোগ করা যায়নি।");
  }

  const inp = (label: string, key: keyof typeof form, type = "text", placeholder = "") => (
    <div>
      <label className="text-xs font-medium mb-1 block" style={{ color: S.secondary }}>{label}</label>
      <input type={type} value={String(form[key])} placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        style={{ width: "100%", height: 40, border: `1px solid ${S.border}`, borderRadius: 8, backgroundColor: S.surface, color: S.text, padding: "0 12px", fontSize: 14, outline: "none" }} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="rounded-2xl p-6 w-full max-w-lg my-4" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ color: S.text }}>
                {editing ? "ওষুধ সম্পাদনা করুন" : "নতুন ওষুধ যোগ করুন"}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ color: S.muted }}><X size={20} /></button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inp("ব্র্যান্ড নাম *", "brandName", "text", "যেমন: Napa Extra")}
                {inp("জেনেরিক নাম", "genericName", "text", "যেমন: Paracetamol")}
              </div>
              {inp("উৎপাদনকারী", "manufacturer", "text", "যেমন: Beximco Pharma")}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.secondary }}>ক্যাটাগরি</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    style={{ width: "100%", height: 40, border: `1px solid ${S.border}`, borderRadius: 8, backgroundColor: S.surface, color: S.text, padding: "0 10px", fontSize: 14, outline: "none" }}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.secondary }}>একক</label>
                  <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    style={{ width: "100%", height: 40, border: `1px solid ${S.border}`, borderRadius: 8, backgroundColor: S.surface, color: S.text, padding: "0 10px", fontSize: 14, outline: "none" }}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {inp("বিক্রয় মূল্য (৳) *", "sellPrice", "number", "0")}
                {inp("ক্রয় মূল্য (৳)", "buyPrice", "number", "0")}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {inp("বর্তমান স্টক", "stockQty", "number", "0")}
                {inp("কম স্টক সীমা", "lowStockAt", "number", "10")}
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setForm(f => ({ ...f, requiresRx: !f.requiresRx }))}
                    className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                    style={{ borderColor: form.requiresRx ? S.primary : S.border, backgroundColor: form.requiresRx ? S.primary : "transparent" }}>
                    {form.requiresRx && <Check size={11} color="#fff" />}
                  </div>
                  <span className="text-sm" style={{ color: S.text }}>প্রেসক্রিপশন লাগে</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setForm(f => ({ ...f, isControlled: !f.isControlled }))}
                    className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                    style={{ borderColor: form.isControlled ? "#EF4444" : S.border, backgroundColor: form.isControlled ? "#EF4444" : "transparent" }}>
                    {form.isControlled && <Check size={11} color="#fff" />}
                  </div>
                  <span className="text-sm" style={{ color: S.text }}>নিয়ন্ত্রিত ওষুধ</span>
                </label>
              </div>

              {!editing && (
                <div className="pt-2 border-t" style={{ borderColor: S.border }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: S.muted }}>প্রথম ব্যাচ (ঐচ্ছিক)</p>
                  <div className="grid grid-cols-2 gap-3">
                    {inp("ব্যাচ নম্বর", "batchNumber", "text", "যেমন: B2024-01")}
                    {inp("মেয়াদ শেষের তারিখ", "expiryDate", "date")}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {inp("ব্যাচ পরিমাণ", "batchQty", "number", "0")}
                    {inp("ক্রয় মূল্য", "batchBuyPrice", "number", "0")}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
                style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: S.primary }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Add Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-sm" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base" style={{ color: S.text }}>নতুন ব্যাচ যোগ করুন</h3>
              <button onClick={() => setShowBatchModal(null)} style={{ color: S.muted }}><X size={18} /></button>
            </div>
            <p className="text-xs mb-3 font-medium" style={{ color: S.primary }}>{showBatchModal.brandName}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.secondary }}>ব্যাচ নম্বর *</label>
                <input type="text" value={batchForm.batchNumber} placeholder="যেমন: B2025-03"
                  onChange={e => setBatchForm(f => ({ ...f, batchNumber: e.target.value }))}
                  style={{ width: "100%", height: 40, border: `1px solid ${S.border}`, borderRadius: 8, backgroundColor: S.surface, color: S.text, padding: "0 12px", fontSize: 14, outline: "none" }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.secondary }}>মেয়াদ শেষের তারিখ *</label>
                <input type="date" value={batchForm.expiryDate}
                  onChange={e => setBatchForm(f => ({ ...f, expiryDate: e.target.value }))}
                  style={{ width: "100%", height: 40, border: `1px solid ${S.border}`, borderRadius: 8, backgroundColor: S.surface, color: S.text, padding: "0 12px", fontSize: 14, outline: "none" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.secondary }}>পরিমাণ *</label>
                  <input type="number" value={batchForm.quantity} placeholder="0"
                    onChange={e => setBatchForm(f => ({ ...f, quantity: e.target.value }))}
                    style={{ width: "100%", height: 40, border: `1px solid ${S.border}`, borderRadius: 8, backgroundColor: S.surface, color: S.text, padding: "0 12px", fontSize: 14, outline: "none" }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.secondary }}>ক্রয় মূল্য (৳)</label>
                  <input type="number" value={batchForm.buyPrice} placeholder="0"
                    onChange={e => setBatchForm(f => ({ ...f, buyPrice: e.target.value }))}
                    style={{ width: "100%", height: 40, border: `1px solid ${S.border}`, borderRadius: 8, backgroundColor: S.surface, color: S.text, padding: "0 12px", fontSize: 14, outline: "none" }} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowBatchModal(null)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
                style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={handleAddBatch} disabled={batchSaving}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60"
                style={{ backgroundColor: S.primary }}>
                {batchSaving ? "যোগ হচ্ছে..." : "ব্যাচ যোগ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 max-w-sm w-full" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <h3 className="font-semibold text-lg mb-2" style={{ color: S.text }}>মুছে ফেলবেন?</h3>
            <p className="text-sm mb-6" style={{ color: S.secondary }}>এই ওষুধ ও সমস্ত ব্যাচ মুছে যাবে।</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: "#E24B4A" }}>
                {deleting ? "মুছছে..." : "মুছে দিন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}>
            <Pill size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>ওষুধ স্টক</h1>
            <p className="text-xs" style={{ color: S.muted }}>মোট {medicines.length}টি ওষুধ</p>
          </div>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}>
          <Plus size={16} /> ওষুধ যোগ করুন
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 h-10 rounded-xl border" style={{ borderColor: S.border, backgroundColor: S.surface }}>
          <Search size={15} style={{ color: S.muted }} />
          <input className="flex-1 bg-transparent outline-none text-sm" placeholder="ওষুধ খুঁজুন..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ color: S.text }} />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border text-sm"
          style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text, outline: "none" }}>
          <option value="">সব ক্যাটাগরি</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Medicine List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: S.primary }} />
        </div>
      ) : medicines.length === 0 ? (
        <div className="text-center py-20">
          <Package2 size={40} className="mx-auto mb-3" style={{ color: S.muted }} />
          <p className="font-medium" style={{ color: S.text }}>কোনো ওষুধ পাওয়া যায়নি।</p>
          <p className="text-sm mt-1" style={{ color: S.muted }}>উপরের বোতামে ক্লিক করে ওষুধ যোগ করুন।</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border, backgroundColor: S.surface }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--c-surface-raised)", borderBottom: `1px solid ${S.border}` }}>
                  {["ওষুধ", "ক্যাটাগরি", "স্টক", "মেয়াদ", "বিক্রয় মূল্য", ""].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: S.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {medicines.map(m => {
                  const expBadge = EXPIRY_BADGE[m.expiryStatus];
                  const isExpanded = expandedId === m.id;
                  return (
                    <>
                      <tr key={m.id} className="border-b last:border-0 hover:bg-black/[0.02] transition-colors"
                        style={{ borderColor: S.border }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: "#ECFDF5" }}>
                              <Pill size={14} style={{ color: "#10B981" }} />
                            </div>
                            <div>
                              <p className="font-semibold text-sm" style={{ color: S.text }}>
                                {m.brandName}
                                {m.requiresRx && <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>Rx</span>}
                                {m.isControlled && <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: "#FEF2F2", color: "#EF4444" }}>নিয়ন্ত্রিত</span>}
                              </p>
                              {m.genericName && <p className="text-xs" style={{ color: S.muted }}>{m.genericName}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: "var(--c-surface-raised)", color: S.secondary }}>
                            {CATEGORIES.find(c => c.value === m.category)?.label ?? m.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-bold ${m.stockQty === 0 ? "text-red-500" : m.stockQty <= m.lowStockAt ? "text-amber-500" : ""}`} style={{ color: m.stockQty > m.lowStockAt ? S.text : undefined }}>
                            {m.stockQty} {m.unit}
                          </span>
                          {m.stockQty <= m.lowStockAt && m.stockQty > 0 && <p className="text-[10px]" style={{ color: "#F59E0B" }}>কম স্টক</p>}
                          {m.stockQty === 0 && <p className="text-[10px] text-red-500">শেষ</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded-full font-bold"
                            style={{ backgroundColor: expBadge.bg, color: expBadge.color }}>
                            {expBadge.label}
                          </span>
                          {m.nearestExpiry && (
                            <p className="text-[10px] mt-0.5" style={{ color: S.muted }}>
                              {new Date(m.nearestExpiry).toLocaleDateString("bn-BD")}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold font-mono" style={{ color: "#10B981" }}>{formatBDT(m.sellPrice)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setExpandedId(isExpanded ? null : m.id)}
                              className="p-1.5 rounded-lg hover:bg-black/5 transition-colors" style={{ color: S.muted }}
                              title="ব্যাচ দেখুন">
                              {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>
                            <button onClick={() => setShowBatchModal(m)}
                              className="p-1.5 rounded-lg hover:bg-black/5 transition-colors" style={{ color: "#10B981" }}
                              title="ব্যাচ যোগ করুন">
                              <FlaskConical size={15} />
                            </button>
                            <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors" style={{ color: S.secondary }}><Pencil size={14} /></button>
                            <button onClick={() => setDeleteId(m.id)} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors" style={{ color: "#E24B4A" }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${m.id}-expand`} style={{ backgroundColor: "var(--c-surface-raised)" }}>
                          <td colSpan={6} className="px-4 pb-3 pt-0">
                            <p className="text-xs font-semibold mb-2 pt-2" style={{ color: S.muted }}>ব্যাচ তালিকা</p>
                            {m.batches.length === 0 ? (
                              <p className="text-xs" style={{ color: S.muted }}>কোনো ব্যাচ নেই।</p>
                            ) : (
                              <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                                {m.batches.map(b => {
                                  const daysLeft = Math.floor((new Date(b.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                  const bColor = daysLeft < 0 ? "#1F2937" : daysLeft <= 30 ? "#FEE2E2" : daysLeft <= 90 ? "#FEF9C3" : "#DCFCE7";
                                  const tColor = daysLeft < 0 ? "#F9FAFB" : daysLeft <= 30 ? "#991B1B" : daysLeft <= 90 ? "#92400E" : "#166534";
                                  return (
                                    <div key={b.id} className="flex items-center justify-between px-3 py-2 rounded-lg border"
                                      style={{ borderColor: S.border, backgroundColor: bColor }}>
                                      <div>
                                        <p className="text-xs font-semibold" style={{ color: tColor }}>{b.batchNumber}</p>
                                        <p className="text-[10px]" style={{ color: tColor }}>মেয়াদ: {new Date(b.expiryDate).toLocaleDateString("bn-BD")} · {b.quantity} {m.unit}</p>
                                      </div>
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(0,0,0,0.1)", color: tColor }}>
                                        {daysLeft < 0 ? "শেষ" : `${daysLeft}দিন`}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
