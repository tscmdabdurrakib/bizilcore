"use client";

import { useEffect, useState } from "react";
import { Wrench, Plus, X, Loader2, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import DatePicker from "@/components/ui/DatePicker";

interface Equipment {
  id: string; name: string; category: string; quantity: number;
  purchaseDate?: string; purchaseCost?: number; condition: string;
  lastService?: string; nextService?: string; notes?: string;
}

const CATEGORIES = [
  { key: "cardio",      label: "কার্ডিও" },
  { key: "strength",    label: "স্ট্রেন্থ" },
  { key: "flexibility", label: "ফ্লেক্সিবিলিটি" },
  { key: "other",       label: "অন্যান্য" },
];

const CONDITIONS = [
  { key: "good",        label: "ভালো",        color: "#0F6E56", bg: "#E1F5EE" },
  { key: "fair",        label: "মোটামুটি",    color: "#D97706", bg: "#FEF3C7" },
  { key: "maintenance", label: "মেরামত দরকার", color: "#DC2626", bg: "#FEE2E2" },
  { key: "retired",     label: "অবসর",        color: "#6B7280", bg: "#F3F4F6" },
];

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };
const inputCls = "w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500";
const inputStyle = { borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text)" };
const emptyForm = { name: "", category: "cardio", quantity: "1", purchaseDate: "", purchaseCost: "", condition: "good", lastService: "", nextService: "", notes: "" };

export default function EquipmentBoard() {
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/gym/equipment");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ ...emptyForm }); setShowForm(true); };
  const openEdit = (e: Equipment) => {
    setEditing(e);
    setForm({
      name: e.name, category: e.category, quantity: String(e.quantity),
      purchaseDate: e.purchaseDate?.slice(0, 10) ?? "", purchaseCost: String(e.purchaseCost ?? ""),
      condition: e.condition, lastService: e.lastService?.slice(0, 10) ?? "",
      nextService: e.nextService?.slice(0, 10) ?? "", notes: e.notes ?? "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    const method = editing ? "PUT" : "POST";
    const body = editing ? { ...form, id: editing.id } : form;
    const res = await fetch("/api/gym/equipment", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { await load(); setShowForm(false); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই সরঞ্জাম মুছে ফেলবেন?")) return;
    await fetch(`/api/gym/equipment?id=${id}`, { method: "DELETE" });
    await load();
  };

  const now = new Date();
  const alertItems = items.filter(e => e.nextService && new Date(e.nextService) <= new Date(now.getTime() + 7 * 86400000));

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#7C3AED" }} /></div>;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>সরঞ্জাম ট্র্যাকার</h1>
          <p className="text-sm" style={{ color: S.muted }}>{items.length}টি সরঞ্জাম</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#7C3AED" }}>
          <Plus size={16} /> সরঞ্জাম যোগ
        </button>
      </div>

      {alertItems.length > 0 && (
        <div className="rounded-2xl border p-3 flex items-start gap-2" style={{ backgroundColor: "#FEF3C7", borderColor: "#FDE68A" }}>
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#D97706" }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "#B45309" }}>{alertItems.length}টি সরঞ্জামের সার্ভিস দরকার</p>
            <p className="text-xs" style={{ color: "#D97706" }}>{alertItems.map(e => e.name).join(", ")}</p>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <Wrench size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">কোনো সরঞ্জাম নেই</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(eq => {
            const cond = CONDITIONS.find(c => c.key === eq.condition) ?? CONDITIONS[0];
            const cat = CATEGORIES.find(c => c.key === eq.category)?.label ?? eq.category;
            const serviceAlert = eq.nextService && new Date(eq.nextService) <= new Date(now.getTime() + 7 * 86400000);
            return (
              <div key={eq.id} className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: serviceAlert ? "#FCA5A5" : S.border }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F5F3FF" }}>
                      <Wrench size={18} style={{ color: "#7C3AED" }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm" style={{ color: S.text }}>{eq.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EDE9FE", color: "#7C3AED" }}>{cat}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: cond.bg, color: cond.color }}>{cond.label}</span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: S.muted }}>সংখ্যা: {eq.quantity}টি {eq.purchaseCost ? `— ক্রয়মূল্য: ${formatBDT(eq.purchaseCost)}` : ""}</p>
                      {eq.nextService && (
                        <p className="text-xs mt-0.5" style={{ color: serviceAlert ? "#DC2626" : S.muted }}>
                          {serviceAlert ? "⚠️ " : ""}পরবর্তী সার্ভিস: {new Date(eq.nextService).toLocaleDateString("bn-BD")}
                        </p>
                      )}
                      {eq.notes && <p className="text-xs mt-0.5 italic" style={{ color: S.muted }}>{eq.notes}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(eq)} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{ borderColor: S.border }}>
                      <Edit2 size={13} style={{ color: S.muted }} />
                    </button>
                    <button onClick={() => handleDelete(eq.id)} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{ borderColor: "#FCA5A5" }}>
                      <Trash2 size={13} style={{ color: "#EF4444" }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl p-5 space-y-3 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ color: S.text }}>{editing ? "সম্পাদনা" : "নতুন সরঞ্জাম"}</h3>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>নাম *</label>
                <input className={inputCls} style={inputStyle} placeholder="Treadmill" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>বিভাগ</label>
                <select className={inputCls} style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>সংখ্যা</label>
                <input className={inputCls} style={inputStyle} type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ক্রয়ের তারিখ</label>
                <DatePicker value={form.purchaseDate} onChange={v => setForm(f => ({ ...f, purchaseDate: v }))} className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ক্রয়মূল্য (৳)</label>
                <input className={inputCls} style={inputStyle} type="number" value={form.purchaseCost} onChange={e => setForm(f => ({ ...f, purchaseCost: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>অবস্থা</label>
                <div className="flex gap-2">
                  {CONDITIONS.map(c => (
                    <button key={c.key} onClick={() => setForm(f => ({ ...f, condition: c.key }))}
                      className="flex-1 py-1.5 rounded-xl text-xs font-semibold border"
                      style={{ backgroundColor: form.condition === c.key ? c.bg : "transparent", color: c.color, borderColor: form.condition === c.key ? c.color : "var(--c-border)" }}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>শেষ সার্ভিস</label>
                <DatePicker value={form.lastService} onChange={v => setForm(f => ({ ...f, lastService: v }))} className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পরবর্তী সার্ভিস</label>
                <DatePicker value={form.nextService} onChange={v => setForm(f => ({ ...f, nextService: v }))} className={inputCls} style={inputStyle} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>নোট</label>
                <input className={inputCls} style={inputStyle} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={handleSave} disabled={saving || !form.name}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#7C3AED" }}>
                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "সেভ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
