"use client";

import { useEffect, useState, useCallback } from "react";
import { Stethoscope, Plus, X, Loader2, Edit2, Phone, Calendar } from "lucide-react";

interface Doctor {
  id: string; name: string; title: string; specialization: string;
  qualification?: string | null; bmdc?: string | null; phone?: string | null;
  visitFee: number; followUpFee?: number | null;
  chamberDays?: string | null; chamberStartTime?: string | null; chamberEndTime?: string | null;
  maxPatients?: number | null; isActive: boolean; todayCount: number;
}

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", bg: "var(--c-bg)" };
const ACC = "#378ADD";
const TITLES = ["Dr.", "Prof. Dr.", "Assoc. Prof. Dr."];
const SPECIALIZATIONS = ["Medicine", "Surgery", "Gynecology", "Pediatrics", "Cardiology", "Orthopedics", "Neurology", "ENT", "Ophthalmology", "Dermatology", "Urology", "Psychiatry", "Oncology", "Other"];
const DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

const BLANK_FORM = {
  title: "Dr.", name: "", specialization: "Medicine", qualification: "", bmdc: "",
  phone: "", visitFee: "", followUpFee: "", chamberDays: [] as string[],
  chamberStartTime: "", chamberEndTime: "", maxPatients: "30",
};

export default function DoctorsBoard() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...BLANK_FORM });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/hospital/doctors?active=false");
    if (res.ok) setDoctors(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() { setEditId(null); setForm({ ...BLANK_FORM }); setShowForm(true); }
  function openEdit(d: Doctor) {
    setEditId(d.id);
    setForm({
      title: d.title, name: d.name, specialization: d.specialization,
      qualification: d.qualification ?? "", bmdc: d.bmdc ?? "", phone: d.phone ?? "",
      visitFee: String(d.visitFee), followUpFee: d.followUpFee ? String(d.followUpFee) : "",
      chamberDays: d.chamberDays ? d.chamberDays.split(", ") : [],
      chamberStartTime: d.chamberStartTime ?? "", chamberEndTime: d.chamberEndTime ?? "",
      maxPatients: String(d.maxPatients ?? 30),
    });
    setShowForm(true);
  }

  function toggleDay(day: string) {
    setForm((f) => ({
      ...f,
      chamberDays: f.chamberDays.includes(day)
        ? f.chamberDays.filter((d) => d !== day)
        : [...f.chamberDays, day],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, chamberDays: form.chamberDays.join(", ") };
    const url = editId ? `/api/hospital/doctors/${editId}` : "/api/hospital/doctors";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { setShowForm(false); load(); }
    setSaving(false);
  }

  async function toggleActive(d: Doctor) {
    await fetch(`/api/hospital/doctors/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !d.isActive }),
    });
    load();
  }

  const inp = "w-full px-3 py-2 rounded-xl border text-sm outline-none";
  const sel = `${inp} bg-transparent`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope size={20} style={{ color: ACC }} />
          <h1 className="text-lg font-bold" style={{ color: S.text }}>ডাক্তার তালিকা</h1>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#EFF6FF", color: ACC }}>
            {doctors.filter((d) => d.isActive).length} সক্রিয়
          </span>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: ACC }}>
          <Plus size={15} /> ডাক্তার যোগ করুন
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: ACC }} /></div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <Stethoscope size={28} className="mx-auto mb-3" style={{ color: S.muted }} />
          <p className="text-sm font-medium" style={{ color: S.text }}>কোনো ডাক্তার যোগ করা হয়নি</p>
          <button onClick={openNew} className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: ACC }}>প্রথম ডাক্তার যোগ করুন</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {doctors.map((d) => (
            <div key={d.id} className="rounded-2xl border p-4 space-y-3" style={{ backgroundColor: S.surface, borderColor: S.border, opacity: d.isActive ? 1 : 0.55 }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold" style={{ color: ACC }}>{d.title} {d.name}</p>
                    {!d.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}>নিষ্ক্রিয়</span>}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: S.muted }}>{d.specialization}{d.qualification ? ` · ${d.qualification}` : ""}</p>
                  {d.bmdc && <p className="text-xs" style={{ color: S.muted }}>BMDC: {d.bmdc}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg" style={{ backgroundColor: "#EFF6FF" }}>
                    <Edit2 size={12} style={{ color: ACC }} />
                  </button>
                  <button onClick={() => toggleActive(d)} className="p-1.5 rounded-lg" style={{ backgroundColor: d.isActive ? "#FEE2E2" : "#E1F5EE" }}>
                    <span className="text-[10px] font-medium" style={{ color: d.isActive ? "#991B1B" : "#085041" }}>{d.isActive ? "অফ" : "অন"}</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold" style={{ color: S.text }}>ভিজিট: ৳{d.visitFee}</span>
                  {d.followUpFee ? <span style={{ color: S.muted }}> · ফলো-আপ: ৳{d.followUpFee}</span> : null}
                </div>
                <span className="px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#FAEEDA", color: "#633806" }}>আজ: {d.todayCount}জন</span>
              </div>
              {d.chamberDays && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: S.muted }}>
                  <Calendar size={11} />
                  <span>{d.chamberDays} · {d.chamberStartTime}{d.chamberEndTime ? ` - ${d.chamberEndTime}` : ""}</span>
                </div>
              )}
              {d.phone && (
                <div className="flex items-center gap-1 text-xs" style={{ color: S.muted }}>
                  <Phone size={11} /><span>{d.phone}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ backgroundColor: S.surface, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: S.border }}>
              <h2 className="text-base font-bold" style={{ color: S.text }}>{editId ? "ডাক্তার সম্পাদনা" : "ডাক্তার যোগ করুন"}</h2>
              <button onClick={() => setShowForm(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>উপাধি</label>
                  <select className={sel} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                    {TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>নাম *</label>
                  <input className={inp} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="ডাক্তারের নাম" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>বিশেষত্ব *</label>
                <select className={sel} value={form.specialization} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))} required style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                  {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>যোগ্যতা</label>
                  <input className={inp} value={form.qualification} onChange={(e) => setForm((f) => ({ ...f, qualification: e.target.value }))} placeholder="MBBS, FCPS" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>BMDC নম্বর</label>
                  <input className={inp} value={form.bmdc} onChange={(e) => setForm((f) => ({ ...f, bmdc: e.target.value }))} placeholder="A-12345" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>ফোন</label>
                <input className={inp} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="01XXXXXXXXX" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>ভিজিট ফি (৳) *</label>
                  <input className={inp} type="number" value={form.visitFee} onChange={(e) => setForm((f) => ({ ...f, visitFee: e.target.value }))} required min="0" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>ফলো-আপ ফি (৳)</label>
                  <input className={inp} type="number" value={form.followUpFee} onChange={(e) => setForm((f) => ({ ...f, followUpFee: e.target.value }))} min="0" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: S.muted }}>চেম্বার দিন</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <button key={day} type="button" onClick={() => toggleDay(day)}
                      className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                      style={{
                        backgroundColor: form.chamberDays.includes(day) ? ACC : S.surface,
                        color: form.chamberDays.includes(day) ? "#fff" : S.text,
                        borderColor: form.chamberDays.includes(day) ? ACC : S.border,
                      }}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>শুরুর সময়</label>
                  <input className={inp} value={form.chamberStartTime} onChange={(e) => setForm((f) => ({ ...f, chamberStartTime: e.target.value }))} placeholder="5:00 PM" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>শেষের সময়</label>
                  <input className={inp} value={form.chamberEndTime} onChange={(e) => setForm((f) => ({ ...f, chamberEndTime: e.target.value }))} placeholder="8:00 PM" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>সর্বোচ্চ রোগী/সেশন</label>
                <input className={inp} type="number" value={form.maxPatients} onChange={(e) => setForm((f) => ({ ...f, maxPatients: e.target.value }))} min="1" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
              </div>
              <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2" style={{ backgroundColor: ACC }}>
                {saving ? <><Loader2 size={15} className="animate-spin" /> সেভ হচ্ছে...</> : "সেভ করুন"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
