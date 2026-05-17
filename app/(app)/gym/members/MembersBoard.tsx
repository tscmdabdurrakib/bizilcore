"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Search, X, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatBDT } from "@/lib/utils";
import DatePicker from "@/components/ui/DatePicker";

interface Plan { name: string; duration: number }
interface Trainer { id: string; name: string }
interface Member {
  id: string; memberId: string; name: string; phone: string;
  status: string; membershipEnd?: string; totalPaid: number;
  plan?: Plan; trainer?: Trainer;
  _count: { attendance: number };
}
interface MembershipPlan { id: string; name: string; duration: number; price: number; admissionFee: number; features: string[] }

const STATUS_TABS = [
  { key: "all",       label: "সব" },
  { key: "active",    label: "সক্রিয়" },
  { key: "expired",   label: "মেয়াদ শেষ" },
  { key: "frozen",    label: "Frozen" },
  { key: "cancelled", label: "বাতিল" },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  active:    { color: "#0F6E56", bg: "#E1F5EE", label: "সক্রিয়" },
  expired:   { color: "#DC2626", bg: "#FEE2E2", label: "মেয়াদ শেষ" },
  frozen:    { color: "#0891B2", bg: "#ECFEFF", label: "Frozen" },
  cancelled: { color: "#6B7280", bg: "#F3F4F6", label: "বাতিল" },
};

const GENDER_OPTIONS = ["পুরুষ", "মহিলা", "অন্যান্য"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GOALS = ["ওজন কমানো", "মাংসপেশি বাড়ানো", "ফিটনেস", "স্পোর্টস"];
const FEATURES_LABELS: Record<string, string> = {
  gym_access: "জিম অ্যাক্সেস", locker: "লকার", personal_trainer: "পার্সোনাল ট্রেইনার",
  diet_plan: "ডায়েট প্ল্যান", group_class: "গ্রুপ ক্লাস", swimming_pool: "সুইমিং পুল",
  steam_sauna: "স্টিম/সনা", cardio_zone: "কার্ডিও জোন",
};

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };
const inputCls = "w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500";
const inputStyle = { borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text)" };
const emptyForm = {
  // Step 1
  name: "", phone: "", gender: "", dateOfBirth: "", emergencyPhone: "",
  bloodGroup: "", medicalCondition: "", goals: "",
  // Step 2
  planId: "", trainerId: "", membershipStart: new Date().toISOString().slice(0, 10),
  // Step 3
  paidAmount: "", paymentMethod: "cash",
};

export default function MembersBoard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const selectedPlan = plans.find(p => p.id === form.planId);
  const membershipEnd = (() => {
    if (!selectedPlan || !form.membershipStart) return "";
    const d = new Date(form.membershipStart);
    d.setDate(d.getDate() + selectedPlan.duration);
    return d.toISOString().slice(0, 10);
  })();

  const load = async () => {
    setLoading(true);
    const [mRes, pRes, tRes] = await Promise.all([
      fetch(`/api/gym/members?status=${tab}&search=${encodeURIComponent(search)}`),
      fetch("/api/gym/memberships"),
      fetch("/api/gym/trainers"),
    ]);
    if (mRes.ok) setMembers(await mRes.json());
    if (pRes.ok) setPlans(await pRes.json());
    if (tRes.ok) setTrainers(await tRes.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab, search]);

  const handleSubmit = async () => {
    if (!form.name || !form.phone) return;
    setSaving(true);
    const res = await fetch("/api/gym/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, membershipEnd }),
    });
    if (res.ok) { await load(); setShowForm(false); setForm({ ...emptyForm }); setStep(1); }
    setSaving(false);
  };

  const totalDue = selectedPlan
    ? (selectedPlan.price + (selectedPlan.admissionFee ?? 0)) - (Number(form.paidAmount) || 0)
    : 0;

  if (loading && members.length === 0) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#7C3AED" }} /></div>;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>সদস্য ব্যবস্থাপনা</h1>
          <p className="text-sm" style={{ color: S.muted }}>{members.length}জন সদস্য</p>
        </div>
        <button onClick={() => { setShowForm(true); setStep(1); setForm({ ...emptyForm }); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#7C3AED" }}>
          <Plus size={16} /> নতুন সদস্য ভর্তি
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
            style={{ backgroundColor: tab === t.key ? "#7C3AED" : "var(--c-surface)", color: tab === t.key ? "#fff" : S.muted, border: `1px solid ${tab === t.key ? "#7C3AED" : "var(--c-border)"}` }}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
        <input className={inputCls + " pl-9"} style={inputStyle} placeholder="নাম, ফোন বা ID দিয়ে খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Member list */}
      {members.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">কোনো সদস্য নেই</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map(m => {
            const st = STATUS_STYLE[m.status] ?? STATUS_STYLE.expired;
            const daysLeft = m.membershipEnd ? Math.ceil((new Date(m.membershipEnd).getTime() - Date.now()) / 86400000) : null;
            const barColor = daysLeft === null ? "#E5E7EB" : daysLeft > 30 ? "#0F6E56" : daysLeft > 7 ? "#D97706" : "#DC2626";
            return (
              <Link key={m.id} href={`/gym/members/${m.id}`}
                className="flex items-center gap-3 p-3 rounded-2xl border transition-shadow hover:shadow-sm"
                style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0" style={{ backgroundColor: "#7C3AED" }}>
                  {m.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color: S.text }}>{m.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px]" style={{ color: S.muted }}>{m.memberId}</span>
                    <span className="text-[11px]" style={{ color: S.muted }}>{m.phone}</span>
                    {m.plan && <span className="text-[11px] font-medium" style={{ color: "#7C3AED" }}>{m.plan.name}</span>}
                  </div>
                  {daysLeft !== null && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 rounded-full bg-gray-200">
                        <div className="h-full rounded-full" style={{ backgroundColor: barColor, width: `${Math.max(0, Math.min(100, (daysLeft / (selectedPlan?.duration ?? 30)) * 100))}%` }} />
                      </div>
                      <span className="text-[10px]" style={{ color: barColor }}>{daysLeft > 0 ? `${daysLeft} দিন বাকি` : "মেয়াদ শেষ"}</span>
                    </div>
                  )}
                </div>
                <ChevronRight size={16} style={{ color: S.muted }} />
              </Link>
            );
          })}
        </div>
      )}

      {/* Registration Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold" style={{ color: S.text }}>নতুন সদস্য ভর্তি</h3>
                <div className="flex gap-1 mt-1">
                  {[1,2,3].map(s => (
                    <div key={s} className="h-1 w-8 rounded-full" style={{ backgroundColor: step >= s ? "#7C3AED" : "var(--c-border)" }} />
                  ))}
                </div>
              </div>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>

            {step === 1 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#7C3AED" }}>ধাপ ১ — ব্যক্তিগত তথ্য</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পূর্ণ নাম *</label>
                    <input className={inputCls} style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ফোন *</label>
                    <input className={inputCls} style={inputStyle} type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>লিঙ্গ</label>
                    <select className={inputCls} style={inputStyle} value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                      <option value="">-- নির্বাচন করুন --</option>
                      {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>জন্ম তারিখ</label>
                    <DatePicker value={form.dateOfBirth} onChange={v => setForm(f => ({ ...f, dateOfBirth: v }))} className={inputCls} style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>রক্তের গ্রুপ</label>
                    <select className={inputCls} style={inputStyle} value={form.bloodGroup} onChange={e => setForm(f => ({ ...f, bloodGroup: e.target.value }))}>
                      <option value="">--</option>
                      {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>জরুরি যোগাযোগ</label>
                    <input className={inputCls} style={inputStyle} type="tel" value={form.emergencyPhone} onChange={e => setForm(f => ({ ...f, emergencyPhone: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>স্বাস্থ্যগত তথ্য</label>
                    <input className={inputCls} style={inputStyle} placeholder="যেকোনো শারীরিক সমস্যা থাকলে লিখুন" value={form.medicalCondition} onChange={e => setForm(f => ({ ...f, medicalCondition: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>লক্ষ্য</label>
                    <div className="flex flex-wrap gap-2">
                      {GOALS.map(g => (
                        <button key={g} onClick={() => setForm(f => ({ ...f, goals: f.goals === g ? "" : g }))}
                          className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                          style={{ backgroundColor: form.goals === g ? "#7C3AED" : "transparent", color: form.goals === g ? "#fff" : S.muted, borderColor: form.goals === g ? "#7C3AED" : "var(--c-border)" }}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={() => setStep(2)} disabled={!form.name || !form.phone}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: "#7C3AED" }}>
                  পরবর্তী →
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#7C3AED" }}>ধাপ ২ — মেম্বারশিপ</p>
                <div className="space-y-2">
                  {plans.map(p => (
                    <div key={p.id} onClick={() => setForm(f => ({ ...f, planId: p.id }))}
                      className="p-3 rounded-xl border cursor-pointer transition-all"
                      style={{ borderColor: form.planId === p.id ? "#7C3AED" : "var(--c-border)", backgroundColor: form.planId === p.id ? "#F5F3FF" : S.surface }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm" style={{ color: S.text }}>{p.name}</p>
                          <p className="text-xs" style={{ color: S.muted }}>{p.duration} দিন</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold" style={{ color: "#7C3AED" }}>{formatBDT(p.price)}</p>
                          {p.admissionFee > 0 && <p className="text-[11px]" style={{ color: S.muted }}>+ ভর্তি: {formatBDT(p.admissionFee)}</p>}
                        </div>
                      </div>
                      {p.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {p.features.map(f => (
                            <span key={f} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EDE9FE", color: "#7C3AED" }}>
                              {FEATURES_LABELS[f] ?? f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {plans.length === 0 && <p className="text-sm text-center py-4" style={{ color: S.muted }}>কোনো প্ল্যান নেই। আগে প্ল্যান তৈরি করুন।</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ট্রেইনার (ঐচ্ছিক)</label>
                    <select className={inputCls} style={inputStyle} value={form.trainerId} onChange={e => setForm(f => ({ ...f, trainerId: e.target.value }))}>
                      <option value="">-- নেই --</option>
                      {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>শুরুর তারিখ</label>
                    <DatePicker value={form.membershipStart} onChange={v => setForm(f => ({ ...f, membershipStart: v }))} className={inputCls} style={inputStyle} />
                  </div>
                </div>
                {membershipEnd && <p className="text-xs" style={{ color: S.muted }}>মেয়াদ শেষ: <b>{new Date(membershipEnd).toLocaleDateString("bn-BD")}</b></p>}
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: S.border, color: S.text }}>← পিছনে</button>
                  <button onClick={() => setStep(3)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#7C3AED" }}>পরবর্তী →</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#7C3AED" }}>ধাপ ৩ — পেমেন্ট</p>
                {selectedPlan && (
                  <div className="p-3 rounded-xl" style={{ backgroundColor: "#F5F3FF" }}>
                    <p className="text-sm font-medium" style={{ color: S.text }}>{selectedPlan.name}</p>
                    <p className="text-lg font-bold" style={{ color: "#7C3AED" }}>মোট: {formatBDT(selectedPlan.price + (selectedPlan.admissionFee ?? 0))}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পরিশোধিত পরিমাণ</label>
                    <input className={inputCls} style={inputStyle} type="number" placeholder="০" value={form.paidAmount} onChange={e => setForm(f => ({ ...f, paidAmount: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পদ্ধতি</label>
                    <select className={inputCls} style={inputStyle} value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                      {["cash", "bkash", "nagad", "card", "bank"].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                {totalDue > 0 && <p className="text-sm font-semibold" style={{ color: "#DC2626" }}>বাকি: {formatBDT(totalDue)}</p>}
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: S.border, color: S.text }}>← পিছনে</button>
                  <button onClick={handleSubmit} disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#7C3AED" }}>
                    {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "ভর্তি করুন"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
