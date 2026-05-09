"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Dumbbell, CalendarCheck2, Receipt, Activity, Loader2, X, Save } from "lucide-react";
import Link from "next/link";
import { formatBDT } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Plan { id: string; name: string; duration: number; price: number; maxFreeze: number }
interface Trainer { id: string; name: string; specialization?: string }
interface Attendance { id: string; checkIn: string; checkOut?: string }
interface Payment { id: string; amount: number; type: string; method?: string; note?: string; paidAt: string }
interface BodyStat { id: string; weight?: number; height?: number; bmi?: number; bodyFat?: number; muscle?: number; chest?: number; waist?: number; hip?: number; recordDate: string; notes?: string }
interface Session { id: string; sessionDate: string; sessionType: string; duration: number; fee: number; paid: boolean; trainer: { name: string } }

interface Member {
  id: string; memberId: string; name: string; phone: string; email?: string;
  gender?: string; bloodGroup?: string; medicalCondition?: string; goals?: string;
  status: string; membershipStart?: string; membershipEnd?: string;
  totalPaid: number; frozenDays: number; plan?: Plan; trainer?: Trainer;
  attendance: Attendance[]; payments: Payment[]; bodyStats: BodyStat[]; trainingSessions: Session[];
}

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };
const inputCls = "w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500";
const inputStyle = { borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text)" };

const TABS = [
  { key: "stats",     label: "শারীরিক মাপ",      icon: Activity },
  { key: "attendance", label: "উপস্থিতি",         icon: CalendarCheck2 },
  { key: "payments",  label: "পেমেন্ট",           icon: Receipt },
  { key: "sessions",  label: "ট্রেনিং সেশন",      icon: Dumbbell },
];

function getBmiCategory(bmi: number) {
  if (bmi < 18.5) return { label: "কম ওজন", color: "#0891B2" };
  if (bmi < 25)   return { label: "স্বাভাবিক", color: "#0F6E56" };
  if (bmi < 30)   return { label: "অতিরিক্ত ওজন", color: "#D97706" };
  return { label: "স্থূলতা", color: "#DC2626" };
}

export default function MemberDetail({ id }: { id: string }) {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("stats");
  const [showStatForm, setShowStatForm] = useState(false);
  const [showRenewForm, setShowRenewForm] = useState(false);
  const [showFreezeForm, setShowFreezeForm] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [statForm, setStatForm] = useState({ weight: "", height: "", bodyFat: "", muscle: "", chest: "", waist: "", hip: "", notes: "" });
  const [renewForm, setRenewForm] = useState({ planId: "", paidAmount: "", paymentMethod: "cash", fromExpiry: true });
  const [freezeDays, setFreezeDays] = useState("7");
  const [payForm, setPayForm] = useState({ amount: "", method: "cash", note: "", type: "membership" });
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);

  const load = async () => {
    setLoading(true);
    const [mRes, pRes] = await Promise.all([fetch(`/api/gym/members/${id}`), fetch("/api/gym/memberships")]);
    if (mRes.ok) setMember(await mRes.json());
    if (pRes.ok) setPlans(await pRes.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const callApi = async (body: Record<string, unknown>) => {
    setSaving(true);
    const res = await fetch(`/api/gym/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) await load();
    setSaving(false);
    return res.ok;
  };

  if (loading || !member) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#7C3AED" }} /></div>;

  const now = new Date();
  const endDate = member.membershipEnd ? new Date(member.membershipEnd) : null;
  const daysLeft = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / 86400000) : null;
  const planDuration = member.plan?.duration ?? 30;
  const barPct = daysLeft !== null ? Math.max(0, Math.min(100, (daysLeft / planDuration) * 100)) : 0;
  const barColor = daysLeft === null ? "#E5E7EB" : daysLeft > 30 ? "#0F6E56" : daysLeft > 7 ? "#D97706" : "#DC2626";

  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthAttendance = member.attendance.filter(a => a.checkIn.startsWith(thisMonth)).length;

  const latestStat = member.bodyStats[0];
  const weightHistory = member.bodyStats.slice(0, 10).reverse().map(s => ({
    date: new Date(s.recordDate).toLocaleDateString("bn-BD", { month: "short", day: "numeric" }),
    weight: s.weight,
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Back */}
      <Link href="/gym/members" className="inline-flex items-center gap-1 text-sm" style={{ color: S.muted }}>
        <ArrowLeft size={16} /> সব সদস্য
      </Link>

      {/* Info card */}
      <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-xl flex-shrink-0" style={{ backgroundColor: "#7C3AED" }}>
            {member.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold" style={{ color: S.text }}>{member.name}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: "#F5F3FF", color: "#7C3AED" }}>{member.memberId}</span>
            </div>
            <p className="text-sm" style={{ color: S.muted }}>{member.phone}</p>
            <div className="flex gap-3 mt-1 flex-wrap">
              {member.gender && <span className="text-xs" style={{ color: S.muted }}>{member.gender}</span>}
              {member.bloodGroup && <span className="text-xs font-bold" style={{ color: "#DC2626" }}>{member.bloodGroup}</span>}
              {member.goals && <span className="text-xs" style={{ color: S.muted }}>🎯 {member.goals}</span>}
            </div>
          </div>
        </div>

        {/* Membership bar */}
        <div className="mt-3 p-3 rounded-xl" style={{ backgroundColor: barColor + "15", border: `1px solid ${barColor}30` }}>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: S.muted }}>{member.plan?.name ?? "কোনো প্ল্যান নেই"}</span>
            <span style={{ color: barColor, fontWeight: 600 }}>{daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} দিন বাকি` : "মেয়াদ শেষ") : "—"}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-200">
            <div className="h-full rounded-full transition-all" style={{ backgroundColor: barColor, width: `${barPct}%` }} />
          </div>
          {endDate && <p className="text-[11px] mt-1" style={{ color: S.muted }}>মেয়াদ শেষ: {endDate.toLocaleDateString("bn-BD")}</p>}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: "মোট পরিশোধ", value: formatBDT(member.totalPaid), color: "#0F6E56" },
            { label: "এই মাসে উপস্থিত", value: `${monthAttendance} দিন`, color: "#7C3AED" },
            { label: "Frozen দিন", value: `${member.frozenDays}`, color: "#0891B2" },
          ].map(q => (
            <div key={q.label} className="text-center p-2 rounded-xl" style={{ backgroundColor: "var(--c-bg, #F9FAFB)" }}>
              <p className="text-sm font-bold" style={{ color: q.color }}>{q.value}</p>
              <p className="text-[10px]" style={{ color: S.muted }}>{q.label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {(daysLeft !== null && daysLeft <= 7) || member.status === "expired" ? (
            <button onClick={() => setShowRenewForm(true)} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: "#7C3AED" }}>
              🔄 Renew করুন
            </button>
          ) : null}
          <button onClick={() => setShowFreezeForm(true)} className="px-3 py-1.5 rounded-xl text-xs font-semibold border" style={{ borderColor: "#0891B2", color: "#0891B2" }}>
            ❄️ Freeze করুন
          </button>
          <button onClick={() => setShowPayForm(true)} className="px-3 py-1.5 rounded-xl text-xs font-semibold border" style={{ borderColor: "#0F6E56", color: "#0F6E56" }}>
            ৳ পেমেন্ট নিন
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={{ backgroundColor: tab === t.key ? "#7C3AED" : S.surface, color: tab === t.key ? "#fff" : S.muted, border: `1px solid ${tab === t.key ? "#7C3AED" : "var(--c-border)"}` }}>
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Body Stats */}
      {tab === "stats" && (
        <div className="space-y-3">
          <button onClick={() => setShowStatForm(true)} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#7C3AED" }}>
            + নতুন মাপ নিন
          </button>
          {latestStat && (
            <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <p className="text-xs font-bold mb-2" style={{ color: S.muted }}>সর্বশেষ মাপ — {new Date(latestStat.recordDate).toLocaleDateString("bn-BD")}</p>
              <div className="grid grid-cols-2 gap-2">
                {latestStat.weight && <div className="text-center p-2 rounded-xl" style={{ backgroundColor: "#F5F3FF" }}>
                  <p className="font-bold" style={{ color: "#7C3AED" }}>{latestStat.weight} কেজি</p>
                  <p className="text-xs" style={{ color: S.muted }}>ওজন</p>
                </div>}
                {latestStat.bmi && <div className="text-center p-2 rounded-xl" style={{ backgroundColor: "#F5F3FF" }}>
                  <p className="font-bold" style={{ color: getBmiCategory(latestStat.bmi).color }}>{latestStat.bmi}</p>
                  <p className="text-xs" style={{ color: S.muted }}>BMI — {getBmiCategory(latestStat.bmi).label}</p>
                </div>}
                {latestStat.bodyFat && <div className="text-center p-2 rounded-xl" style={{ backgroundColor: "#F5F3FF" }}>
                  <p className="font-bold" style={{ color: "#7C3AED" }}>{latestStat.bodyFat}%</p>
                  <p className="text-xs" style={{ color: S.muted }}>শরীরের চর্বি</p>
                </div>}
                {latestStat.muscle && <div className="text-center p-2 rounded-xl" style={{ backgroundColor: "#F5F3FF" }}>
                  <p className="font-bold" style={{ color: "#7C3AED" }}>{latestStat.muscle}%</p>
                  <p className="text-xs" style={{ color: S.muted }}>পেশী</p>
                </div>}
              </div>
            </div>
          )}
          {weightHistory.length > 1 && (
            <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <p className="text-xs font-bold mb-3" style={{ color: S.muted }}>ওজনের পরিবর্তন</p>
              <div style={{ height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightHistory}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="weight" stroke="#7C3AED" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Attendance */}
      {tab === "attendance" && (
        <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <p className="text-sm font-bold mb-3" style={{ color: S.text }}>সাম্প্রতিক উপস্থিতি ({member.attendance.length} বার মোট)</p>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {member.attendance.slice(0, 30).map(a => (
              <div key={a.id} className="flex justify-between text-xs py-1.5 border-b" style={{ borderColor: S.border }}>
                <span style={{ color: S.text }}>{new Date(a.checkIn).toLocaleDateString("bn-BD", { weekday: "short", day: "numeric", month: "short" })}</span>
                <span style={{ color: S.muted }}>{new Date(a.checkIn).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}{a.checkOut ? ` → ${new Date(a.checkOut).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}` : " (এখনো আছেন)"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Payments */}
      {tab === "payments" && (
        <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <p className="text-sm font-bold mb-3" style={{ color: S.text }}>পেমেন্ট ইতিহাস</p>
          <div className="space-y-2">
            {member.payments.map(p => (
              <div key={p.id} className="flex justify-between items-center py-2 border-b" style={{ borderColor: S.border }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: S.text }}>{formatBDT(p.amount)}</p>
                  <p className="text-xs" style={{ color: S.muted }}>{p.note ?? p.type} — {p.method}</p>
                </div>
                <p className="text-xs" style={{ color: S.muted }}>{new Date(p.paidAt).toLocaleDateString("bn-BD")}</p>
              </div>
            ))}
            {member.payments.length === 0 && <p className="text-sm text-center py-4" style={{ color: S.muted }}>কোনো পেমেন্ট নেই</p>}
          </div>
        </div>
      )}

      {/* Tab: Training Sessions */}
      {tab === "sessions" && (
        <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <p className="text-sm font-bold mb-3" style={{ color: S.text }}>ট্রেনিং সেশন</p>
          <div className="space-y-2">
            {member.trainingSessions.map(s => (
              <div key={s.id} className="flex justify-between items-center py-2 border-b" style={{ borderColor: S.border }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: S.text }}>{s.trainer.name}</p>
                  <p className="text-xs" style={{ color: S.muted }}>{s.sessionType} — {s.duration} মিনিট</p>
                </div>
                <div className="text-right">
                  <p className="text-sm" style={{ color: S.text }}>{formatBDT(s.fee)}</p>
                  <p className="text-xs" style={{ color: s.paid ? "#0F6E56" : "#DC2626" }}>{s.paid ? "পরিশোধিত" : "বাকি"}</p>
                </div>
              </div>
            ))}
            {member.trainingSessions.length === 0 && <p className="text-sm text-center py-4" style={{ color: S.muted }}>কোনো সেশন নেই</p>}
          </div>
        </div>
      )}

      {/* Body Stat Form Modal */}
      {showStatForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-3" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ color: S.text }}>নতুন শারীরিক মাপ</h3>
              <button onClick={() => setShowStatForm(false)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "weight", label: "ওজন (কেজি)" }, { key: "height", label: "উচ্চতা (সেমি)" },
                { key: "bodyFat", label: "চর্বি %" }, { key: "muscle", label: "পেশী %" },
                { key: "chest", label: "বুক (সেমি)" }, { key: "waist", label: "কোমর (সেমি)" },
                { key: "hip", label: "হিপ (সেমি)" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>{f.label}</label>
                  <input className={inputCls} style={inputStyle} type="number" step="0.1"
                    value={(statForm as Record<string, string>)[f.key]}
                    onChange={e => setStatForm(s => ({ ...s, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>নোট</label>
                <input className={inputCls} style={inputStyle} value={statForm.notes} onChange={e => setStatForm(s => ({ ...s, notes: e.target.value }))} />
              </div>
            </div>
            {statForm.weight && statForm.height && (
              <p className="text-sm" style={{ color: S.muted }}>
                BMI: <b>{(Number(statForm.weight) / Math.pow(Number(statForm.height) / 100, 2)).toFixed(1)}</b>
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowStatForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={async () => { const ok = await callApi({ action: "body_stat", ...statForm }); if (ok) setShowStatForm(false); }} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#7C3AED" }}>
                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : <><Save size={14} className="inline mr-1" />সেভ</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renew Modal */}
      {showRenewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-3" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ color: S.text }}>মেম্বারশিপ Renew</h3>
              <button onClick={() => setShowRenewForm(false)}><X size={18} /></button>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>প্ল্যান নির্বাচন</label>
              <div className="space-y-1">
                {plans.map(p => (
                  <div key={p.id} onClick={() => setRenewForm(f => ({ ...f, planId: p.id }))}
                    className="p-2 rounded-xl border cursor-pointer text-sm flex justify-between"
                    style={{ borderColor: renewForm.planId === p.id ? "#7C3AED" : "var(--c-border)", backgroundColor: renewForm.planId === p.id ? "#F5F3FF" : S.surface }}>
                    <span style={{ color: S.text }}>{p.name} ({p.duration} দিন)</span>
                    <span style={{ color: "#7C3AED", fontWeight: 600 }}>{formatBDT(p.price)}</span>
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: S.text }}>
                <input type="checkbox" checked={renewForm.fromExpiry} onChange={e => setRenewForm(f => ({ ...f, fromExpiry: e.target.checked }))} />
                মেয়াদ শেষ তারিখ থেকে শুরু করুন
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পরিশোধ</label>
                  <input className={inputCls} style={inputStyle} type="number" value={renewForm.paidAmount} onChange={e => setRenewForm(f => ({ ...f, paidAmount: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পদ্ধতি</label>
                  <select className={inputCls} style={inputStyle} value={renewForm.paymentMethod} onChange={e => setRenewForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                    {["cash", "bkash", "nagad", "card", "bank"].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRenewForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={async () => { const ok = await callApi({ action: "renew", ...renewForm }); if (ok) setShowRenewForm(false); }} disabled={saving || !renewForm.planId}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#7C3AED" }}>
                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Renew করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Freeze Modal */}
      {showFreezeForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-xs rounded-2xl p-5 space-y-3" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ color: S.text }}>Freeze মেম্বারশিপ</h3>
              <button onClick={() => setShowFreezeForm(false)}><X size={18} /></button>
            </div>
            <p className="text-xs" style={{ color: S.muted }}>সর্বোচ্চ {member.plan?.maxFreeze ?? 7} দিন freeze করতে পারবেন</p>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>কতদিন? *</label>
              <input className={inputCls} style={inputStyle} type="number" min={1} max={member.plan?.maxFreeze ?? 7} value={freezeDays} onChange={e => setFreezeDays(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowFreezeForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={async () => { const ok = await callApi({ action: "freeze", days: freezeDays }); if (ok) setShowFreezeForm(false); }} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#0891B2" }}>
                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Freeze করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-xs rounded-2xl p-5 space-y-3" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ color: S.text }}>পেমেন্ট নিন</h3>
              <button onClick={() => setShowPayForm(false)}><X size={18} /></button>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পরিমাণ *</label>
                <input className={inputCls} style={inputStyle} type="number" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ধরন</label>
                <select className={inputCls} style={inputStyle} value={payForm.type} onChange={e => setPayForm(f => ({ ...f, type: e.target.value }))}>
                  {["membership", "personal_training", "locker", "other"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পদ্ধতি</label>
                <select className={inputCls} style={inputStyle} value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}>
                  {["cash", "bkash", "nagad", "card", "bank"].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>নোট</label>
                <input className={inputCls} style={inputStyle} value={payForm.note} onChange={e => setPayForm(f => ({ ...f, note: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPayForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={async () => { const ok = await callApi({ action: "payment", ...payForm }); if (ok) setShowPayForm(false); }} disabled={saving || !payForm.amount}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#0F6E56" }}>
                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "সেভ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
