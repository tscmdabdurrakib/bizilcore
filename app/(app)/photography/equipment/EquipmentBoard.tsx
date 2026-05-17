"use client";

import { useEffect, useState, useCallback } from "react";
import { formatBDT } from "@/lib/utils";
import {
import DatePicker from "@/components/ui/DatePicker";
  Camera, Plus, Loader2, X, Check, Edit2, Trash2, AlertTriangle,
} from "lucide-react";

interface PhotoEquipment {
  id: string;
  name: string;
  category: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  condition: string;
  insuranceExp?: string;
  notes?: string;
  bookings: Array<{ booking: { id: string; eventDate: string; status: string; clientName: string } }>;
}

const PHOTO_COLOR = "#DB2777";
const PHOTO_BG = "#FDF2F8";
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };

const CATEGORIES = [
  { value: "camera",    label: "ক্যামেরা",   color: "#DB2777" },
  { value: "lens",      label: "লেন্স",      color: "#7C3AED" },
  { value: "drone",     label: "ড্রোন",      color: "#0891B2" },
  { value: "lighting",  label: "আলো",        color: "#D97706" },
  { value: "audio",     label: "অডিও",       color: "#0F6E56" },
  { value: "accessory", label: "এক্সেসরি",   color: "#6B7280" },
];

const CONDITIONS = [
  { value: "excellent", label: "চমৎকার",  color: "#0F6E56", bg: "#E1F5EE" },
  { value: "good",      label: "ভালো",    color: "#0891B2", bg: "#ECFEFF" },
  { value: "fair",      label: "ঠিকঠাক",  color: "#D97706", bg: "#FEF3C7" },
  { value: "poor",      label: "খারাপ",   color: "#DC2626", bg: "#FEE2E2" },
];

const blank = {
  name: "", category: "camera", serialNumber: "", purchaseDate: "",
  purchaseCost: "", condition: "good", insuranceExp: "", notes: "",
};

export default function EquipmentBoard() {
  const [equipment, setEquipment] = useState<PhotoEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/photography/equipment", { cache: "no-store" });
      if (res.ok) setEquipment(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (eq: PhotoEquipment) => {
    setEditId(eq.id);
    setForm({
      name: eq.name, category: eq.category,
      serialNumber: eq.serialNumber ?? "", purchaseDate: eq.purchaseDate ? eq.purchaseDate.split("T")[0] : "",
      purchaseCost: eq.purchaseCost ? String(eq.purchaseCost) : "",
      condition: eq.condition,
      insuranceExp: eq.insuranceExp ? eq.insuranceExp.split("T")[0] : "",
      notes: eq.notes ?? "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.category) return;
    setSaving(true);
    try {
      const url = editId ? `/api/photography/equipment/${editId}` : "/api/photography/equipment";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setEditId(null);
        setForm({ ...blank });
        load();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই সরঞ্জাম মুছে দেবেন?")) return;
    await fetch(`/api/photography/equipment/${id}`, { method: "DELETE" });
    load();
  };

  const catInfo = (cat: string) => CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[5];
  const condInfo = (cond: string) => CONDITIONS.find(c => c.value === cond) ?? CONDITIONS[1];

  const isInsuranceExpiringSoon = (exp?: string) => {
    if (!exp) return false;
    const d = new Date(exp);
    const diff = d.getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  const isCurrentlyBooked = (eq: PhotoEquipment) => {
    const now = new Date();
    const soon = new Date();
    soon.setDate(soon.getDate() + 14);
    return eq.bookings.some(b => {
      const d = new Date(b.booking.eventDate);
      return d >= now && d <= soon && !["delivered", "cancelled"].includes(b.booking.status);
    });
  };

  const filtered = catFilter === "all" ? equipment : equipment.filter(e => e.category === catFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>সরঞ্জাম ট্র্যাকার</h1>
          <p className="text-sm" style={{ color: S.muted }}>{equipment.length}টি সরঞ্জাম</p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ ...blank }); setShowForm(true); }} className="px-4 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-1.5" style={{ backgroundColor: PHOTO_COLOR }}>
          <Plus size={15} /> সরঞ্জাম যোগ করুন
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setCatFilter("all")} className="px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap border transition-colors" style={{ backgroundColor: catFilter === "all" ? PHOTO_COLOR : S.surface, color: catFilter === "all" ? "#fff" : S.muted, borderColor: catFilter === "all" ? PHOTO_COLOR : S.border }}>সব</button>
        {CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => setCatFilter(cat.value)} className="px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap border transition-colors" style={{ backgroundColor: catFilter === cat.value ? PHOTO_COLOR : S.surface, color: catFilter === cat.value ? "#fff" : S.muted, borderColor: catFilter === cat.value ? PHOTO_COLOR : S.border }}>
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: PHOTO_COLOR }} /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ borderColor: S.border, backgroundColor: S.surface }}>
          <Camera size={36} className="mx-auto mb-3" style={{ color: S.muted }} />
          <p className="font-semibold" style={{ color: S.text }}>কোনো সরঞ্জাম নেই</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
          {filtered.map((eq, idx) => {
            const ci = catInfo(eq.category);
            const cond = condInfo(eq.condition);
            const booked = isCurrentlyBooked(eq);
            const insAlert = isInsuranceExpiringSoon(eq.insuranceExp);
            return (
              <div key={eq.id} className={`p-4 flex items-center gap-4 ${idx < filtered.length - 1 ? "border-b" : ""}`} style={{ borderColor: S.border }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: ci.color + "15" }}>
                  <Camera size={18} style={{ color: ci.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm" style={{ color: S.text }}>{eq.name}</p>
                    {booked && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: PHOTO_BG, color: PHOTO_COLOR }}>বুকড</span>
                    )}
                    {insAlert && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1" style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}>
                        <AlertTriangle size={10} /> বীমা শেষ হচ্ছে
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs flex-wrap" style={{ color: S.muted }}>
                    <span style={{ color: ci.color }}>{ci.label}</span>
                    {eq.serialNumber && <span>S/N: {eq.serialNumber}</span>}
                    {eq.purchaseCost && <span>{formatBDT(eq.purchaseCost)}</span>}
                    <span className="px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: cond.bg, color: cond.color }}>{cond.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(eq)} className="p-1.5 rounded-lg" style={{ backgroundColor: "#F3F4F6" }}>
                    <Edit2 size={13} style={{ color: S.muted }} />
                  </button>
                  <button onClick={() => handleDelete(eq.id)} className="p-1.5 rounded-lg bg-red-50">
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: S.border }}>
              <h2 className="font-bold" style={{ color: S.text }}>{editId ? "সরঞ্জাম এডিট" : "সরঞ্জাম যোগ করুন"}</h2>
              <button onClick={() => { setShowForm(false); setEditId(null); }}><X size={20} style={{ color: S.muted }} /></button>
            </div>
            <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold" style={{ color: S.muted }}>নাম *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Canon 5D Mark IV" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: S.muted }}>ক্যাটাগরি *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: S.muted }}>অবস্থা</label>
                  <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                    {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: S.muted }}>সিরিয়াল নম্বর</label>
                  <input value={form.serialNumber} onChange={e => setForm(f => ({ ...f, serialNumber: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: S.muted }}>ক্রয় মূল্য (৳)</label>
                  <input type="number" value={form.purchaseCost} onChange={e => setForm(f => ({ ...f, purchaseCost: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: S.muted }}>ক্রয় তারিখ</label>
                  <DatePicker value={form.purchaseDate} onChange={v => setForm(f => ({ ...f, purchaseDate: v }))} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: S.muted }}>বীমার মেয়াদ</label>
                  <DatePicker value={form.insuranceExp} onChange={v => setForm(f => ({ ...f, insuranceExp: v }))} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold" style={{ color: S.muted }}>নোট</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t" style={{ borderColor: S.border }}>
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="flex-1 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-1.5" style={{ backgroundColor: PHOTO_COLOR }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                সেভ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
