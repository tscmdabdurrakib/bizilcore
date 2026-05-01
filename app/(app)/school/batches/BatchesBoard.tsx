"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Plus, X, Loader2, Pencil, Trash2 } from "lucide-react";

interface StaffOption { id: string; user: { name: string | null }; jobTitle: string | null }
interface Batch {
  id: string; name: string; class?: string | null; subject?: string | null;
  schedule?: string | null; room?: string | null; monthlyFee: number;
  admissionFee: number; maxStudents?: number | null; isActive: boolean;
  teacher?: { id: string; user: { name: string | null }; jobTitle: string | null } | null;
  _count: { students: number };
}

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", bg: "var(--c-bg)" };

const EMPTY_FORM = { name: "", class: "", subject: "", schedule: "", teacherId: "", room: "", monthlyFee: "", admissionFee: "0", maxStudents: "" };

export default function BatchesBoard() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Batch | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [batchRes, staffRes] = await Promise.all([
      fetch("/api/school/batches"),
      fetch("/api/staff"),
    ]);
    if (batchRes.ok) setBatches(await batchRes.json());
    if (staffRes.ok) {
      const data = await staffRes.json();
      setStaff(data.staff ?? data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openEdit(b: Batch) {
    setEditing(b);
    setForm({ name: b.name, class: b.class ?? "", subject: b.subject ?? "", schedule: b.schedule ?? "", teacherId: b.teacher?.id ?? "", room: b.room ?? "", monthlyFee: String(b.monthlyFee), admissionFee: String(b.admissionFee), maxStudents: b.maxStudents ? String(b.maxStudents) : "" });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = editing ? `/api/school/batches/${editing.id}` : "/api/school/batches";
    const method = editing ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    load();
  }

  async function deleteBatch(id: string) {
    if (!confirm("এই ব্যাচ মুছে ফেলবেন?")) return;
    await fetch(`/api/school/batches/${id}`, { method: "DELETE" });
    load();
  }

  const inputCls = "w-full px-3 py-2 rounded-xl border text-sm outline-none";
  const inputStyle = { backgroundColor: S.surface, borderColor: S.border, color: S.text };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: S.text }}>ব্যাচ ম্যানেজমেন্ট</h1>
          <p className="text-xs" style={{ color: S.muted }}>{batches.length}টি ব্যাচ</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: "#2563EB" }}>
          <Plus size={16} /> নতুন ব্যাচ
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: "#2563EB" }} /></div>
      ) : batches.length === 0 ? (
        <div className="rounded-2xl p-10 border text-center" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <Users size={36} className="mx-auto mb-3" style={{ color: "#2563EB" }} />
          <p className="font-semibold" style={{ color: S.text }}>কোনো ব্যাচ নেই</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {batches.map((b) => (
            <div key={b.id} className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold" style={{ color: S.text }}>{b.name}</p>
                    {!b.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">নিষ্ক্রিয়</span>}
                  </div>
                  {(b.class || b.subject) && (
                    <p className="text-xs mt-0.5" style={{ color: S.muted }}>
                      {[b.class, b.subject].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg" style={{ backgroundColor: S.bg }}><Pencil size={13} style={{ color: S.muted }} /></button>
                  <button onClick={() => deleteBatch(b.id)} className="p-1.5 rounded-lg" style={{ backgroundColor: "#FEE2E2" }}><Trash2 size={13} style={{ color: "#EF4444" }} /></button>
                </div>
              </div>

              <div className="mt-3 space-y-1.5">
                {b.schedule && <p className="text-xs" style={{ color: S.muted }}>📅 {b.schedule}</p>}
                {b.teacher && <p className="text-xs" style={{ color: S.muted }}>👨‍🏫 {b.teacher.user.name ?? b.teacher.jobTitle ?? "শিক্ষক"}</p>}
                {b.room && <p className="text-xs" style={{ color: S.muted }}>🚪 {b.room}</p>}
              </div>

              <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: S.border }}>
                <div>
                  <p className="text-xs" style={{ color: S.muted }}>মাসিক ফি</p>
                  <p className="text-sm font-bold" style={{ color: "#2563EB" }}>৳{b.monthlyFee}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: S.muted }}>শিক্ষার্থী</p>
                  <p className="text-sm font-bold" style={{ color: S.text }}>
                    {b._count.students}{b.maxStudents ? `/${b.maxStudents}` : ""}জন
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border shadow-xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center justify-between p-5 border-b sticky top-0" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <h2 className="text-base font-bold" style={{ color: S.text }}>{editing ? "ব্যাচ এডিট" : "নতুন ব্যাচ তৈরি"}</h2>
              <button onClick={() => setShowForm(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ব্যাচের নাম *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} style={inputStyle} placeholder="Class 8 - Morning" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ক্লাস</label>
                  <input value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} className={inputCls} style={inputStyle} placeholder="Class 8, HSC..." />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>বিষয়</label>
                  <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputCls} style={inputStyle} placeholder="Math, All Subjects..." />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>সময়সূচি</label>
                <input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} className={inputCls} style={inputStyle} placeholder="Sat, Mon, Wed | 8:00 AM - 10:00 AM" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>রুম</label>
                  <input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} className={inputCls} style={inputStyle} placeholder="Room 101" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>সর্বোচ্চ শিক্ষার্থী</label>
                  <input type="number" value={form.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: e.target.value })} className={inputCls} style={inputStyle} placeholder="30" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>শিক্ষক</label>
                <select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className={inputCls} style={inputStyle}>
                  <option value="">নির্বাচন করুন</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.user.name ?? s.jobTitle ?? "Staff"}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>মাসিক ফি (৳) *</label>
                  <input required type="number" value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} className={inputCls} style={inputStyle} placeholder="1500" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ভর্তি ফি (৳)</label>
                  <input type="number" value={form.admissionFee} onChange={(e) => setForm({ ...form, admissionFee: e.target.value })} className={inputCls} style={inputStyle} placeholder="0" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2" style={{ backgroundColor: "#2563EB" }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                  {editing ? "আপডেট করুন" : "তৈরি করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
