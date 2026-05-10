"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Edit2, ChefHat, X, Check } from "lucide-react";

const S = {
  surface: "var(--c-surface)",
  border:  "var(--c-border)",
  text:    "var(--c-text)",
  muted:   "var(--c-text-muted)",
  primary: "#EA580C",
};

const TYPE_LABELS: Record<string, string> = {
  wedding:   "💍 বিয়ে",
  corporate:  "🏢 Corporate",
  birthday:   "🎂 জন্মদিন",
  aqiqa:     "🐑 আকিকা",
  custom:    "✨ Custom",
};

const CAT_LABELS: Record<string, string> = {
  main:    "মূল খাবার",
  starter: "স্টার্টার",
  drink:   "পানীয়",
  dessert: "ডেজার্ট",
  snack:   "স্ন্যাকস",
  side:    "সাইড",
};

type TemplateItem = {
  id?: string;
  itemName: string;
  category: string;
  perHeadCost: number;
  quantity: string;
};

type Template = {
  id: string;
  name: string;
  type: string;
  perHeadPrice: number;
  isActive: boolean;
  items: TemplateItem[];
  createdAt: string;
};

const emptyItem = (): TemplateItem => ({ itemName: "", category: "main", perHeadCost: 0, quantity: "" });

export default function CateringMenusPage() {
  const [templates, setTemplates]     = useState<Template[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [editing, setEditing]         = useState<Template | null>(null);
  const [saving, setSaving]           = useState(false);
  const [deleteId, setDeleteId]       = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", type: "wedding" });
  const [items, setItems] = useState<TemplateItem[]>([emptyItem()]);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/catering/menus");
    if (r.ok) setTemplates(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", type: "wedding" });
    setItems([emptyItem()]);
    setShowModal(true);
  }

  function openEdit(t: Template) {
    setEditing(t);
    setForm({ name: t.name, type: t.type });
    setItems(t.items.length > 0 ? t.items.map(i => ({ ...i, quantity: i.quantity ?? "" })) : [emptyItem()]);
    setShowModal(true);
  }

  function addItem() { setItems(prev => [...prev, emptyItem()]); }
  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)); }
  function setItem(idx: number, field: keyof TemplateItem, val: string | number) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  }

  const totalPerHead = items.reduce((s, i) => s + (Number(i.perHeadCost) || 0), 0);

  async function save() {
    if (!form.name || items.some(i => !i.itemName)) return;
    setSaving(true);
    const payload = { ...form, items };
    const url     = editing ? `/api/catering/menus/${editing.id}` : "/api/catering/menus";
    const method  = editing ? "PATCH" : "POST";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (r.ok) { setShowModal(false); load(); }
    setSaving(false);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const r = await fetch(`/api/catering/menus/${deleteId}`, { method: "DELETE" });
    if (r.ok) { setDeleteId(null); load(); }
    else { const d = await r.json(); alert(d.error); }
  }

  async function toggleActive(t: Template) {
    await fetch(`/api/catering/menus/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    load();
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: S.primary }} />
    </div>
  );

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFF7ED" }}>
            <ChefHat size={20} style={{ color: S.primary }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: S.text }}>Menu Templates</h1>
            <p className="text-xs" style={{ color: S.muted }}>{templates.length}টি template</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: S.primary }}>
          <Plus size={16} /> নতুন Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed" style={{ borderColor: S.border }}>
          <ChefHat size={40} className="mx-auto mb-3" style={{ color: S.muted }} />
          <p className="font-medium" style={{ color: S.muted }}>কোনো Menu Template নেই</p>
          <button onClick={openCreate} className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: S.primary }}>
            প্রথম Template তৈরি করুন
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {templates.map(t => (
            <div key={t.id} className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold" style={{ color: S.text }}>{t.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#FFF7ED", color: S.primary }}>
                      {TYPE_LABELS[t.type] ?? t.type}
                    </span>
                    {!t.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}>অনিসক্রিয়</span>
                    )}
                  </div>
                  <p className="text-lg font-bold mt-1" style={{ color: S.primary }}>৳{t.perHeadPrice.toLocaleString()}<span className="text-xs font-normal ml-1" style={{ color: S.muted }}>/জন</span></p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(t)} className="p-2 rounded-lg" style={{ color: S.muted }}>
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => setDeleteId(t.id)} className="p-2 rounded-lg" style={{ color: "#EF4444" }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                {t.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span style={{ color: S.text }}>{item.itemName}
                      <span className="ml-1 text-xs" style={{ color: S.muted }}>({CAT_LABELS[item.category] ?? item.category})</span>
                      {item.quantity && <span className="ml-1 text-xs" style={{ color: S.muted }}>— {item.quantity}</span>}
                    </span>
                    <span className="font-medium" style={{ color: S.primary }}>৳{item.perHeadCost}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: S.border }}>
                <span className="text-xs" style={{ color: S.muted }}>{t.items.length}টি আইটেম</span>
                <button onClick={() => toggleActive(t)} className="text-xs px-3 py-1 rounded-lg border font-medium"
                  style={{ borderColor: S.border, color: S.muted }}>
                  {t.isActive ? "অনিসক্রিয় করুন" : "সক্রিয় করুন"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-6 px-4 overflow-y-auto" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-2xl rounded-2xl p-6 space-y-5" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: S.text }}>{editing ? "Template সম্পাদনা" : "নতুন Menu Template"}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} style={{ color: S.muted }} /></button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: S.text }}>Template নাম *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
                  placeholder="যেমন: Standard Wedding" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: S.text }}>ধরন *</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold" style={{ color: S.text }}>আইটেম সমূহ</label>
                <button onClick={addItem} className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg font-medium" style={{ backgroundColor: "#FFF7ED", color: S.primary }}>
                  <Plus size={13} /> আইটেম যোগ
                </button>
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input value={item.itemName} onChange={e => setItem(idx, "itemName", e.target.value)}
                      className="flex-1 border rounded-lg px-2 py-1.5 text-sm" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
                      placeholder="আইটেম নাম" />
                    <select value={item.category} onChange={e => setItem(idx, "category", e.target.value)}
                      className="border rounded-lg px-2 py-1.5 text-sm" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface, minWidth: 90 }}>
                      {Object.entries(CAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <input type="number" value={item.perHeadCost || ""} onChange={e => setItem(idx, "perHeadCost", e.target.value)}
                      className="w-20 border rounded-lg px-2 py-1.5 text-sm" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
                      placeholder="৳/জন" />
                    <input value={item.quantity} onChange={e => setItem(idx, "quantity", e.target.value)}
                      className="w-24 border rounded-lg px-2 py-1.5 text-sm" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
                      placeholder="পরিমাণ" />
                    {items.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="p-1.5 rounded-lg" style={{ color: "#EF4444" }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-end gap-1 text-sm font-semibold" style={{ color: S.primary }}>
                মোট: ৳{totalPerHead.toLocaleString()}/জন
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setShowModal(false)} className="px-5 py-2 rounded-xl text-sm border font-medium" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
              <button onClick={save} disabled={saving || !form.name || items.some(i => !i.itemName)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm text-white font-semibold disabled:opacity-50"
                style={{ backgroundColor: S.primary }}>
                <Check size={15} /> {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ backgroundColor: S.surface }}>
            <h3 className="text-base font-bold" style={{ color: S.text }}>Template মুছবেন?</h3>
            <p className="text-sm" style={{ color: S.muted }}>এই কাজটি ফেরানো যাবে না।</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-xl text-sm border" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-xl text-sm text-white font-semibold" style={{ backgroundColor: "#EF4444" }}>মুছুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
