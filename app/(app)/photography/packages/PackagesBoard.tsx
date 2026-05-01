"use client";

import { useEffect, useState, useCallback } from "react";
import { formatBDT } from "@/lib/utils";
import {
  Package, Plus, Loader2, X, Check, Edit2, Trash2,
  Clock, Tag,
} from "lucide-react";

interface PhotoPackage {
  id: string;
  name: string;
  type: string;
  duration: string;
  price: number;
  includes: string[];
  deliverables: string[];
  editingDays: number;
  description?: string;
  isActive: boolean;
  _count?: { bookings: number };
}

const PHOTO_COLOR = "#DB2777";
const PHOTO_BG = "#FDF2F8";
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };

const PACKAGE_TYPES = [
  { value: "wedding",   label: "বিবাহ",      color: "#DB2777", bg: "#FDF2F8" },
  { value: "portrait",  label: "পোর্ট্রেট",  color: "#7C3AED", bg: "#F5F3FF" },
  { value: "product",   label: "প্রোডাক্ট",  color: "#D97706", bg: "#FEF3C7" },
  { value: "corporate", label: "কর্পোরেট",   color: "#0891B2", bg: "#ECFEFF" },
  { value: "event",     label: "ইভেন্ট",     color: "#0F6E56", bg: "#E1F5EE" },
  { value: "video",     label: "ভিডিও",      color: "#6B7280", bg: "#F3F4F6" },
  { value: "other",     label: "অন্যান্য",   color: "#6B7280", bg: "#F3F4F6" },
];

const blank = {
  name: "", type: "wedding", duration: "", price: "",
  includes: [] as string[], deliverables: [] as string[],
  editingDays: "7", description: "",
};

export default function PackagesBoard() {
  const [packages, setPackages] = useState<PhotoPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [saving, setSaving] = useState(false);
  const [includeInput, setIncludeInput] = useState("");
  const [deliverableInput, setDeliverableInput] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/photography/packages", { cache: "no-store" });
      if (res.ok) setPackages(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (pkg: PhotoPackage) => {
    setEditId(pkg.id);
    setForm({
      name: pkg.name, type: pkg.type, duration: pkg.duration,
      price: String(pkg.price), includes: [...pkg.includes],
      deliverables: [...pkg.deliverables], editingDays: String(pkg.editingDays),
      description: pkg.description ?? "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.duration) return;
    setSaving(true);
    try {
      const url = editId ? `/api/photography/packages/${editId}` : "/api/photography/packages";
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
    if (!confirm("এই প্যাকেজ মুছে দেবেন?")) return;
    await fetch(`/api/photography/packages/${id}`, { method: "DELETE" });
    load();
  };

  const toggleActive = async (pkg: PhotoPackage) => {
    await fetch(`/api/photography/packages/${pkg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !pkg.isActive }),
    });
    load();
  };

  const typeInfo = (type: string) => PACKAGE_TYPES.find(t => t.value === type) ?? PACKAGE_TYPES[6];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>প্যাকেজ ম্যানেজমেন্ট</h1>
          <p className="text-sm" style={{ color: S.muted }}>{packages.length}টি প্যাকেজ</p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ ...blank }); setShowForm(true); }} className="px-4 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-1.5" style={{ backgroundColor: PHOTO_COLOR }}>
          <Plus size={15} /> নতুন Package
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: PHOTO_COLOR }} /></div>
      ) : packages.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ borderColor: S.border, backgroundColor: S.surface }}>
          <Package size={36} className="mx-auto mb-3" style={{ color: S.muted }} />
          <p className="font-semibold" style={{ color: S.text }}>কোনো প্যাকেজ নেই</p>
          <p className="text-sm mt-1" style={{ color: S.muted }}>নতুন প্যাকেজ তৈরি করুন</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map(pkg => {
            const ti = typeInfo(pkg.type);
            return (
              <div key={pkg.id} className="rounded-2xl border p-4 space-y-3" style={{ backgroundColor: S.surface, borderColor: S.border, opacity: pkg.isActive ? 1 : 0.6 }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: ti.bg, color: ti.color }}>{ti.label}</span>
                    <h3 className="font-bold text-sm mt-1.5" style={{ color: S.text }}>{pkg.name}</h3>
                    <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: S.muted }}><Clock size={11} />{pkg.duration}</p>
                  </div>
                  <p className="text-lg font-bold flex-shrink-0" style={{ color: PHOTO_COLOR }}>{formatBDT(pkg.price)}</p>
                </div>

                {pkg.includes.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: S.muted }}>অন্তর্ভুক্ত:</p>
                    <div className="flex flex-wrap gap-1">
                      {pkg.includes.slice(0, 4).map((item, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: ti.bg, color: ti.color }}>{item}</span>
                      ))}
                      {pkg.includes.length > 4 && <span className="text-xs" style={{ color: S.muted }}>+{pkg.includes.length - 4}</span>}
                    </div>
                  </div>
                )}

                {pkg.deliverables.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: S.muted }}>ডেলিভারেবল:</p>
                    <div className="flex flex-wrap gap-1">
                      {pkg.deliverables.map((item, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gray-100" style={{ color: S.muted }}>{item}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: S.border }}>
                  <p className="text-xs" style={{ color: S.muted }}>
                    এডিটিং: {pkg.editingDays} দিন · {pkg._count?.bookings ?? 0} বুকিং
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleActive(pkg)} className="w-9 h-5 rounded-full relative transition-colors" style={{ backgroundColor: pkg.isActive ? PHOTO_COLOR : S.border }}>
                      <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: pkg.isActive ? "19px" : "2px" }} />
                    </button>
                    <button onClick={() => openEdit(pkg)} className="p-1.5 rounded-lg" style={{ backgroundColor: "#F3F4F6" }}>
                      <Edit2 size={13} style={{ color: S.muted }} />
                    </button>
                    <button onClick={() => handleDelete(pkg.id)} className="p-1.5 rounded-lg bg-red-50">
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: S.border }}>
              <h2 className="font-bold" style={{ color: S.text }}>{editId ? "প্যাকেজ এডিট" : "নতুন Package"}</h2>
              <button onClick={() => { setShowForm(false); setEditId(null); }}><X size={20} style={{ color: S.muted }} /></button>
            </div>
            <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: S.muted }}>প্যাকেজ নাম *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Wedding Full Day" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: S.muted }}>ধরন *</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                    {PACKAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: S.muted }}>মূল্য (৳) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="25000" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: S.muted }}>সময়কাল *</label>
                  <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="Full Day (10 hrs)" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: S.muted }}>এডিটিং সময় (দিন) *</label>
                  <input type="number" value={form.editingDays} onChange={e => setForm(f => ({ ...f, editingDays: e.target.value }))} placeholder="7" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                </div>
              </div>

              {/* Includes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold" style={{ color: S.muted }}>অন্তর্ভুক্ত (Chip)</label>
                <div className="flex gap-2">
                  <input value={includeInput} onChange={e => setIncludeInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && includeInput.trim()) { setForm(f => ({ ...f, includes: [...f.includes, includeInput.trim()] })); setIncludeInput(""); } }} placeholder="লিখুন ও Enter চাপুন" className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                  <button onClick={() => { if (includeInput.trim()) { setForm(f => ({ ...f, includes: [...f.includes, includeInput.trim()] })); setIncludeInput(""); } }} className="px-3 py-2 rounded-xl text-white text-sm font-bold" style={{ backgroundColor: PHOTO_COLOR }}>+</button>
                </div>
                {form.includes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.includes.map((item, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: PHOTO_BG, color: PHOTO_COLOR }}>
                        {item}
                        <button onClick={() => setForm(f => ({ ...f, includes: f.includes.filter((_, ii) => ii !== i) }))}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Deliverables */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold" style={{ color: S.muted }}>ডেলিভারেবল (Chip)</label>
                <div className="flex gap-2">
                  <input value={deliverableInput} onChange={e => setDeliverableInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && deliverableInput.trim()) { setForm(f => ({ ...f, deliverables: [...f.deliverables, deliverableInput.trim()] })); setDeliverableInput(""); } }} placeholder="লিখুন ও Enter চাপুন" className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                  <button onClick={() => { if (deliverableInput.trim()) { setForm(f => ({ ...f, deliverables: [...f.deliverables, deliverableInput.trim()] })); setDeliverableInput(""); } }} className="px-3 py-2 rounded-xl text-white text-sm font-bold" style={{ backgroundColor: PHOTO_COLOR }}>+</button>
                </div>
                {form.deliverables.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.deliverables.map((item, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100" style={{ color: S.muted }}>
                        {item}
                        <button onClick={() => setForm(f => ({ ...f, deliverables: f.deliverables.filter((_, ii) => ii !== i) }))}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold" style={{ color: S.muted }}>বিবরণ</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
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
