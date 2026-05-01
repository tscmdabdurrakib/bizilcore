"use client";

import { useEffect, useState, useCallback } from "react";
import { Droplets, Plus, Pencil, Trash2, X, CheckCircle, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface LService {
  id: string; name: string; category: string; itemType: string;
  price: number; expressPrice?: number; isActive: boolean;
}

const CATS = [
  { value: "wash_iron", label: "Wash & Iron" },
  { value: "dry_clean", label: "Dry Clean" },
  { value: "wash_only", label: "Wash Only" },
  { value: "iron_only", label: "Iron Only" },
  { value: "special", label: "Special Service" },
];
const ITEM_TYPES = [
  { value: "shirt", label: "Shirt" }, { value: "pant", label: "Pant/Trouser" },
  { value: "saree", label: "Saree" }, { value: "salwar", label: "Salwar Kameez" },
  { value: "suit", label: "Suit/Blazer" }, { value: "jacket", label: "Jacket/Coat" },
  { value: "blanket", label: "Blanket/Quilt" }, { value: "curtain", label: "Curtain" },
  { value: "bedsheet", label: "Bedsheet" }, { value: "other", label: "অন্যান্য" },
];

const C = "#0284C7";
const CL = "#E0F2FE";
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", bg: "var(--c-bg)" };

const EMPTY_FORM = { name: "", category: "wash_iron", itemType: "shirt", price: "", expressPrice: "" };

export default function LaundryServices() {
  const [services, setServices] = useState<LService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LService | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success"|"error" } | null>(null);
  const [filterCat, setFilterCat] = useState("");

  function showToast(type: "success"|"error", msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetch("/api/laundry/services").then(r => r.json()).catch(() => []);
    setServices(Array.isArray(d) ? d : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openEdit(svc: LService) {
    setEditing(svc);
    setForm({ name: svc.name, category: svc.category, itemType: svc.itemType,
      price: String(svc.price), expressPrice: svc.expressPrice != null ? String(svc.expressPrice) : "" });
    setShowForm(true);
  }

  function openNew() {
    setEditing(null); setForm(EMPTY_FORM); setShowForm(true);
  }

  async function save() {
    if (!form.name.trim() || !form.price) { showToast("error", "নাম ও মূল্য দিন।"); return; }
    setSaving(true);
    const payload: any = { ...form, price: Number(form.price),
      expressPrice: form.expressPrice ? Number(form.expressPrice) : null };
    if (editing) payload.id = editing.id;

    const r = await fetch("/api/laundry/services", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (r.ok) {
      showToast("success", editing ? "আপডেট হয়েছে ✓" : "সার্ভিস যোগ হয়েছে ✓");
      setShowForm(false); load();
    } else {
      const d = await r.json(); showToast("error", d.error ?? "ব্যর্থ।");
    }
  }

  async function toggleActive(svc: LService) {
    await fetch("/api/laundry/services", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: svc.id, name: svc.name, category: svc.category,
        itemType: svc.itemType, price: svc.price, expressPrice: svc.expressPrice,
        isActive: !svc.isActive }),
    });
    load();
  }

  async function del(svc: LService) {
    if (!confirm(`"${svc.name}" মুছবেন?`)) return;
    await fetch("/api/laundry/services", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: svc.id }),
    });
    showToast("success", "মুছে ফেলা হয়েছে।"); load();
  }

  const filtered = filterCat ? services.filter(s => s.category === filterCat) : services;
  const byCat = CATS.map(c => ({
    ...c, items: filtered.filter(s => s.category === c.value),
  })).filter(c => c.items.length > 0 || !filterCat);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl"
          style={{ backgroundColor: toast.type === "success" ? "#10B981" : "#EF4444" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: `linear-gradient(135deg, ${C}, #0369A1)` }}>
            <Droplets size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: S.text }}>সার্ভিস প্রাইসিং</h1>
            <p className="text-xs" style={{ color: S.muted }}>{services.length}টি সার্ভিস</p>
          </div>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-bold shadow-sm"
          style={{ backgroundColor: C }}>
          <Plus size={16} /> নতুন সার্ভিস
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat("")}
          className="px-4 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
          style={!filterCat ? { backgroundColor: C, color: "#fff" } : { backgroundColor: S.surface, color: S.muted, border: `1px solid ${S.border}` }}>
          সব
        </button>
        {CATS.map(c => (
          <button key={c.value} onClick={() => setFilterCat(c.value)}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
            style={filterCat === c.value ? { backgroundColor: C, color: "#fff" } : { backgroundColor: S.surface, color: S.muted, border: `1px solid ${S.border}` }}>
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 size={24} className="animate-spin mx-auto" style={{ color: C }} />
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-2xl border py-16 text-center" style={{ borderColor: S.border, backgroundColor: S.surface }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: CL }}>
            <Droplets size={24} style={{ color: C }} />
          </div>
          <p className="text-sm font-medium mb-3" style={{ color: S.muted }}>কোনো সার্ভিস যোগ করা হয়নি</p>
          <button onClick={openNew} className="text-sm font-bold" style={{ color: C }}>+ প্রথম সার্ভিস যোগ করুন</button>
        </div>
      ) : (
        <div className="space-y-4">
          {byCat.map(cat => (
            cat.items.length === 0 ? null :
            <div key={cat.value} className="rounded-2xl border overflow-hidden shadow-sm"
              style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="px-5 py-3 border-b font-bold text-sm" style={{ borderColor: S.border, backgroundColor: CL, color: C }}>
                {cat.label}
              </div>
              <div className="divide-y" style={{ borderColor: S.border }}>
                {cat.items.map(svc => (
                  <div key={svc.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm" style={{ color: svc.isActive ? S.text : S.muted }}>{svc.name}</p>
                        {!svc.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                            style={{ backgroundColor: "#FEF2F2", color: "#EF4444" }}>Inactive</span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: S.muted }}>
                        {ITEM_TYPES.find(t => t.value === svc.itemType)?.label ?? svc.itemType}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: C }}>{formatBDT(svc.price)}</p>
                        {svc.expressPrice && (
                          <p className="text-xs" style={{ color: "#F59E0B" }}>Express: {formatBDT(svc.expressPrice)}</p>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => toggleActive(svc)} title="Active/Inactive">
                          {svc.isActive
                            ? <ToggleRight size={20} style={{ color: "#10B981" }} />
                            : <ToggleLeft size={20} style={{ color: S.muted }} />}
                        </button>
                        <button onClick={() => openEdit(svc)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: S.bg }}>
                          <Pencil size={13} style={{ color: S.muted }} />
                        </button>
                        <button onClick={() => del(svc)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: "#FEF2F2" }}>
                          <Trash2 size={13} style={{ color: "#EF4444" }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: S.border }}>
              <h3 className="font-bold text-lg" style={{ color: S.text }}>
                {editing ? "সার্ভিস সম্পাদনা" : "নতুন সার্ভিস"}
              </h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100">
                <X size={16} style={{ color: S.muted }} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>সার্ভিসের নাম *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="যেমন: Shirt Wash & Iron"
                  className="w-full h-11 px-4 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>ক্যাটাগরি</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }}>
                    {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>আইটেম টাইপ</label>
                  <select value={form.itemType} onChange={e => setForm(p => ({ ...p, itemType: e.target.value }))}
                    className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }}>
                    {ITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>সাধারণ মূল্য (৳) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    placeholder="0" className="w-full h-11 px-4 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>Express মূল্য (৳)</label>
                  <input type="number" value={form.expressPrice} onChange={e => setForm(p => ({ ...p, expressPrice: e.target.value }))}
                    placeholder="ঐচ্ছিক" className="w-full h-11 px-4 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
                </div>
              </div>
              <button onClick={save} disabled={saving}
                className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: C }}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                {editing ? "আপডেট করুন" : "সার্ভিস যোগ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
