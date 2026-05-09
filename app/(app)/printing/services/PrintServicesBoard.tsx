"use client";

import { useEffect, useState } from "react";
import { Printer, Plus, X, Loader2, Edit2, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface Service {
  id: string; name: string; category: string; unit: string;
  pricePerUnit: number; minQuantity: number; description?: string; isActive: boolean;
}

const CATEGORIES = [
  { key: "all",        label: "সব" },
  { key: "card",       label: "Card" },
  { key: "banner",     label: "Banner" },
  { key: "brochure",   label: "Brochure" },
  { key: "poster",     label: "Poster" },
  { key: "sticker",    label: "Sticker" },
  { key: "envelope",   label: "Envelope" },
  { key: "letterhead", label: "Letterhead" },
  { key: "book",       label: "Book" },
  { key: "calendar",   label: "Calendar" },
  { key: "other",      label: "Other" },
];

const UNITS = ["pcs", "sqft", "page", "sheet", "roll", "set"];

const PRINT_COLOR = "#7C3AED";
const PRINT_LIGHT = "#F5F3FF";
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };

const blank = { name: "", category: "card", unit: "pcs", pricePerUnit: "", minQuantity: "100", description: "" };

export default function PrintServicesBoard() {
  const [services, setServices] = useState<Service[]>([]);
  const [catTab, setCatTab]     = useState("all");
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Service | null>(null);
  const [form, setForm]         = useState({ ...blank });
  const [saving, setSaving]     = useState(false);

  const fetch_ = async (cat = catTab) => {
    setLoading(true);
    const res = await fetch(`/api/printing/services?category=${cat}`);
    const data = await res.json();
    setServices(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetch_(catTab); }, [catTab]);

  const openNew = () => { setEditing(null); setForm({ ...blank }); setShowForm(true); };
  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({ name: s.name, category: s.category, unit: s.unit, pricePerUnit: String(s.pricePerUnit), minQuantity: String(s.minQuantity), description: s.description ?? "" });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.pricePerUnit) return;
    setSaving(true);
    try {
      const url = editing ? `/api/printing/services/${editing.id}` : "/api/printing/services";
      await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, pricePerUnit: Number(form.pricePerUnit), minQuantity: Number(form.minQuantity) }),
      });
      setShowForm(false);
      fetch_(catTab);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই service মুছে ফেলবেন?")) return;
    await fetch(`/api/printing/services/${id}`, { method: "DELETE" });
    fetch_(catTab);
  };

  const handleToggle = async (s: Service) => {
    await fetch(`/api/printing/services/${s.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    fetch_(catTab);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Printer size={20} style={{ color: PRINT_COLOR }} />
          <h1 className="text-lg font-black" style={{ color: S.text }}>সার্ভিস প্রাইসিং</h1>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: PRINT_COLOR }}>
          <Plus size={15} /> নতুন Service
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setCatTab(c.key)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border"
            style={catTab === c.key
              ? { backgroundColor: PRINT_COLOR, color: "#fff", borderColor: PRINT_COLOR }
              : { backgroundColor: S.surface, color: S.muted, borderColor: S.border }}>
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: PRINT_COLOR }} /></div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: PRINT_LIGHT }}>
            <Printer size={22} style={{ color: PRINT_COLOR }} />
          </div>
          <p className="text-sm" style={{ color: S.muted }}>এই ক্যাটাগরিতে কোনো service নেই</p>
          <button onClick={openNew} className="text-sm font-bold" style={{ color: PRINT_COLOR }}>+ নতুন যোগ করুন</button>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: S.border, backgroundColor: S.surface }}>
                <th className="text-left px-4 py-3 text-xs font-bold" style={{ color: S.muted }}>Service</th>
                <th className="text-left px-4 py-3 text-xs font-bold" style={{ color: S.muted }}>ক্যাটাগরি</th>
                <th className="text-right px-4 py-3 text-xs font-bold" style={{ color: S.muted }}>মূল্য / ইউনিট</th>
                <th className="text-right px-4 py-3 text-xs font-bold" style={{ color: S.muted }}>নূন্যতম</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id} className="border-b hover:bg-gray-50/50" style={{ borderColor: S.border }}>
                  <td className="px-4 py-3">
                    <p className="font-semibold" style={{ color: S.text, opacity: s.isActive ? 1 : 0.5 }}>{s.name}</p>
                    {s.description && <p className="text-xs" style={{ color: S.muted }}>{s.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: PRINT_LIGHT, color: PRINT_COLOR }}>
                      {CATEGORIES.find(c => c.key === s.category)?.label ?? s.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold" style={{ color: S.text }}>
                    {formatBDT(s.pricePerUnit)}<span className="text-xs font-normal ml-1" style={{ color: S.muted }}>/{s.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs" style={{ color: S.muted }}>{s.minQuantity} {s.unit}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => handleToggle(s)} title={s.isActive ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}>
                        {s.isActive
                          ? <ToggleRight size={20} style={{ color: "#10B981" }} />
                          : <ToggleLeft size={20} style={{ color: S.muted }} />}
                      </button>
                      <button onClick={() => openEdit(s)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: PRINT_LIGHT }}>
                        <Edit2 size={13} style={{ color: PRINT_COLOR }} />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FEE2E2" }}>
                        <Trash2 size={13} style={{ color: "#EF4444" }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl p-5 space-y-4" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <h2 className="font-black text-base" style={{ color: S.text }}>{editing ? "Service সম্পাদনা" : "নতুন Service"}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: S.border }}>
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>Service এর নাম *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }}
                  placeholder="Business Card, Flex Banner..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>ক্যাটাগরি</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full h-11 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }}>
                    {CATEGORIES.filter(c => c.key !== "all").map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>ইউনিট</label>
                  <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                    className="w-full h-11 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>মূল্য / ইউনিট (৳) *</label>
                  <input type="number" value={form.pricePerUnit} onChange={e => setForm(p => ({ ...p, pricePerUnit: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>ন্যূনতম পরিমাণ</label>
                  <input type="number" value={form.minQuantity} onChange={e => setForm(p => ({ ...p, minQuantity: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>বিবরণ (ঐচ্ছিক)</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border text-sm resize-none" rows={2}
                  style={{ borderColor: S.border, color: S.text }} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border font-semibold text-sm" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: PRINT_COLOR }}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : "✓ সংরক্ষণ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
