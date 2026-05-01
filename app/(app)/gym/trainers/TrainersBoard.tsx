"use client";

import { useEffect, useState } from "react";
import { UserCog, Plus, X, Loader2, Edit2, Users } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface Trainer {
  id: string; name: string; phone?: string; specialization?: string;
  certification?: string; salary?: number; commission?: number; isActive: boolean;
  _count: { members: number; sessions: number };
}

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };
const inputCls = "w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500";
const inputStyle = { borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text)" };
const emptyForm = { name: "", phone: "", specialization: "", certification: "", salary: "", commission: "" };

const SPECIALIZATIONS = ["Weight Training", "Yoga", "Cardio", "Boxing", "Crossfit", "Pilates", "Swimming", "General Fitness"];

export default function TrainersBoard() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Trainer | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/gym/trainers");
    if (res.ok) setTrainers(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ ...emptyForm }); setShowForm(true); };
  const openEdit = (t: Trainer) => {
    setEditing(t);
    setForm({ name: t.name, phone: t.phone ?? "", specialization: t.specialization ?? "", certification: t.certification ?? "", salary: String(t.salary ?? ""), commission: String(t.commission ?? "") });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    const method = editing ? "PUT" : "POST";
    const body = editing ? { ...form, id: editing.id } : form;
    const res = await fetch("/api/gym/trainers", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { await load(); setShowForm(false); }
    setSaving(false);
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("এই ট্রেইনারকে নিষ্ক্রিয় করবেন?")) return;
    await fetch(`/api/gym/trainers?id=${id}`, { method: "DELETE" });
    await load();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#7C3AED" }} /></div>;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>ট্রেইনার ম্যানেজমেন্ট</h1>
          <p className="text-sm" style={{ color: S.muted }}>{trainers.filter(t => t.isActive).length}জন সক্রিয় ট্রেইনার</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#7C3AED" }}>
          <Plus size={16} /> ট্রেইনার যোগ
        </button>
      </div>

      {trainers.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <UserCog size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">কোনো ট্রেইনার নেই</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {trainers.map(t => (
            <div key={t.id} className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border, opacity: t.isActive ? 1 : 0.6 }}>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style={{ backgroundColor: "#7C3AED" }}>
                  {t.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: S.text }}>{t.name}</p>
                  {t.specialization && <p className="text-xs font-medium" style={{ color: "#7C3AED" }}>{t.specialization}</p>}
                  {t.phone && <p className="text-xs" style={{ color: S.muted }}>{t.phone}</p>}
                  {t.certification && <p className="text-xs" style={{ color: S.muted }}>সার্টিফিকেট: {t.certification}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t" style={{ borderColor: S.border }}>
                <div className="text-center">
                  <p className="font-bold text-sm" style={{ color: "#7C3AED" }}>{t._count.members}</p>
                  <p className="text-[10px]" style={{ color: S.muted }}>সদস্য</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm" style={{ color: "#7C3AED" }}>{t._count.sessions}</p>
                  <p className="text-[10px]" style={{ color: S.muted }}>সেশন</p>
                </div>
                <div className="text-center">
                  {t.salary ? <><p className="font-bold text-sm" style={{ color: "#0F6E56" }}>{formatBDT(t.salary)}</p><p className="text-[10px]" style={{ color: S.muted }}>বেতন</p></> : 
                    t.commission ? <><p className="font-bold text-sm" style={{ color: "#0F6E56" }}>{t.commission}%</p><p className="text-[10px]" style={{ color: S.muted }}>কমিশন</p></> : <><p className="text-[10px]" style={{ color: S.muted }}>—</p></>}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(t)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border flex-1 justify-center" style={{ borderColor: S.border, color: S.text }}>
                  <Edit2 size={12} /> সম্পাদনা
                </button>
                {t.isActive && (
                  <button onClick={() => handleDeactivate(t.id)} className="px-3 py-1.5 rounded-xl text-xs font-semibold border" style={{ borderColor: "#FCA5A5", color: "#EF4444" }}>
                    নিষ্ক্রিয়
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl p-5 space-y-3" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ color: S.text }}>{editing ? "ট্রেইনার সম্পাদনা" : "নতুন ট্রেইনার"}</h3>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>নাম *</label>
                <input className={inputCls} style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ফোন</label>
                <input className={inputCls} style={inputStyle} type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>স্পেশালাইজেশন</label>
                <select className={inputCls} style={inputStyle} value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}>
                  <option value="">-- নির্বাচন করুন --</option>
                  {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>সার্টিফিকেট</label>
                <input className={inputCls} style={inputStyle} value={form.certification} onChange={e => setForm(f => ({ ...f, certification: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>বেতন (৳/মাস)</label>
                <input className={inputCls} style={inputStyle} type="number" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>কমিশন (% প্রতি সেশন)</label>
                <input className={inputCls} style={inputStyle} type="number" step="0.1" value={form.commission} onChange={e => setForm(f => ({ ...f, commission: e.target.value }))} />
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
