"use client";

import { useEffect, useState } from "react";
import { Dumbbell, Plus, X, Loader2, Edit2, Trash2, Check } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface Plan {
  id: string; name: string; duration: number; price: number; admissionFee: number;
  features: string[]; maxFreeze: number; isActive: boolean;
  _count: { members: number };
}

const ALL_FEATURES = [
  { key: "gym_access", label: "জিম অ্যাক্সেস" },
  { key: "locker", label: "লকার" },
  { key: "personal_trainer", label: "পার্সোনাল ট্রেইনার" },
  { key: "diet_plan", label: "ডায়েট প্ল্যান" },
  { key: "group_class", label: "গ্রুপ ক্লাস" },
  { key: "swimming_pool", label: "সুইমিং পুল" },
  { key: "steam_sauna", label: "স্টিম/সনা" },
  { key: "cardio_zone", label: "কার্ডিও জোন" },
];

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };
const inputCls = "w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500";
const inputStyle = { borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text)" };

const emptyForm = { name: "", duration: "30", price: "", admissionFee: "0", features: [] as string[], maxFreeze: "7" };

export default function MembershipsBoard() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/gym/memberships");
    if (res.ok) setPlans(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ ...emptyForm }); setShowForm(true); };
  const openEdit = (p: Plan) => {
    setEditing(p);
    setForm({ name: p.name, duration: String(p.duration), price: String(p.price), admissionFee: String(p.admissionFee), features: [...p.features], maxFreeze: String(p.maxFreeze) });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.duration) return;
    setSaving(true);
    const method = editing ? "PUT" : "POST";
    const body = editing ? { ...form, id: editing.id } : form;
    const res = await fetch("/api/gym/memberships", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { await load(); setShowForm(false); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই প্ল্যান মুছে ফেলবেন?")) return;
    await fetch(`/api/gym/memberships?id=${id}`, { method: "DELETE" });
    await load();
  };

  const toggleFeature = (key: string) => {
    setForm(f => ({ ...f, features: f.features.includes(key) ? f.features.filter(x => x !== key) : [...f.features, key] }));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#7C3AED" }} /></div>;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>মেম্বারশিপ প্ল্যান</h1>
          <p className="text-sm" style={{ color: S.muted }}>{plans.length}টি প্ল্যান</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#7C3AED" }}>
          <Plus size={16} /> নতুন প্ল্যান
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <Dumbbell size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">কোনো প্ল্যান নেই</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plans.map(p => (
            <div key={p.id} className="rounded-2xl border p-4 relative" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold" style={{ color: S.text }}>{p.name}</h3>
                  <p className="text-xs" style={{ color: S.muted }}>{p.duration} দিন — {p._count.members}জন সদস্য</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold" style={{ color: "#7C3AED" }}>{formatBDT(p.price)}</p>
                  {p.admissionFee > 0 && <p className="text-xs" style={{ color: S.muted }}>ভর্তি: +{formatBDT(p.admissionFee)}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {p.features.map(f => {
                  const fl = ALL_FEATURES.find(x => x.key === f);
                  return fl ? (
                    <span key={f} className="flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EDE9FE", color: "#7C3AED" }}>
                      <Check size={9} />{fl.label}
                    </span>
                  ) : null;
                })}
              </div>
              <p className="text-[11px]" style={{ color: S.muted }}>সর্বোচ্চ freeze: {p.maxFreeze} দিন</p>
              <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: S.border }}>
                <button onClick={() => openEdit(p)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border flex-1 justify-center" style={{ borderColor: S.border, color: S.text }}>
                  <Edit2 size={12} /> সম্পাদনা
                </button>
                <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{ borderColor: "#FCA5A5" }}>
                  <Trash2 size={13} style={{ color: "#EF4444" }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl p-5 space-y-3 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ color: S.text }}>{editing ? "প্ল্যান সম্পাদনা" : "নতুন প্ল্যান"}</h3>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>প্ল্যানের নাম *</label>
                <input className={inputCls} style={inputStyle} placeholder="Monthly Basic" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>মেয়াদ (দিন) *</label>
                <input className={inputCls} style={inputStyle} type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>মূল্য (৳) *</label>
                <input className={inputCls} style={inputStyle} type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ভর্তি ফি (৳)</label>
                <input className={inputCls} style={inputStyle} type="number" value={form.admissionFee} onChange={e => setForm(f => ({ ...f, admissionFee: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>Freeze সীমা (দিন)</label>
                <input className={inputCls} style={inputStyle} type="number" value={form.maxFreeze} onChange={e => setForm(f => ({ ...f, maxFreeze: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium mb-2 block" style={{ color: S.muted }}>সুবিধাসমূহ</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_FEATURES.map(ft => (
                    <label key={ft.key} className="flex items-center gap-2 cursor-pointer">
                      <div onClick={() => toggleFeature(ft.key)}
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors"
                        style={{ backgroundColor: form.features.includes(ft.key) ? "#7C3AED" : "transparent", borderColor: form.features.includes(ft.key) ? "#7C3AED" : "var(--c-border)" }}>
                        {form.features.includes(ft.key) && <Check size={10} color="white" />}
                      </div>
                      <span className="text-xs" style={{ color: S.text }}>{ft.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.price}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#7C3AED" }}>
                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "সেভ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
