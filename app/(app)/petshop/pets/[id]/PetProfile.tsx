"use client";

import { useEffect, useState } from "react";
import { PawPrint, Plus, X, Loader2, Phone, Calendar } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface HealthLog { id: string; logType: string; description: string; medicineName?: string | null; dosage?: string | null; vetName?: string | null; cost: number; nextDueDate?: string | null; logDate: string; notes?: string | null; }
interface Appointment { id: string; type: string; date: string; status: string; fee: number; paidAmount: number; note?: string | null; }
interface Pet {
  id: string; name: string; type: string; breed?: string | null; gender?: string | null;
  dateOfBirth?: string | null; weight?: number | null; color?: string | null;
  microchipId?: string | null; allergies?: string | null; chronicIllness?: string | null; isActive: boolean;
  customer: { id: string; name: string; phone?: string | null; address?: string | null };
  healthLogs: HealthLog[];
  appointments: Appointment[];
}

const PET_COLOR = "#EA580C";
const PET_LIGHT = "#FFF7ED";
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };

const PET_ICONS: Record<string, string> = { dog: "🐕", cat: "🐈", bird: "🐦", fish: "🐟", rabbit: "🐇", turtle: "🐢", other: "🐾" };
const LOG_TYPES = [
  { key: "vaccination", label: "টিকা" }, { key: "deworming", label: "Deworming" },
  { key: "flea_treatment", label: "Flea Treatment" }, { key: "surgery", label: "অপারেশন" },
  { key: "medicine", label: "ওষুধ" }, { key: "checkup", label: "Checkup" }, { key: "observation", label: "পর্যবেক্ষণ" },
];
const APPT_TYPES = [
  { key: "checkup", label: "Checkup" }, { key: "grooming", label: "Grooming" },
  { key: "vaccination", label: "টিকা" }, { key: "surgery", label: "অপারেশন" }, { key: "boarding", label: "Boarding" },
];
const STATUS_COLORS: Record<string, string> = { scheduled: "#6B7280", confirmed: "#3B82F6", done: "#10B981", cancelled: "#EF4444" };

export default function PetProfile({ id }: { id: string }) {
  const [pet, setPet]       = useState<Pet | null>(null);
  const [tab, setTab]       = useState<"logs" | "appointments">("logs");
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [showAppt, setShowAppt] = useState(false);
  const [logForm, setLogForm] = useState({ logType: "vaccination", description: "", medicineName: "", dosage: "", vetName: "", cost: "", nextDueDate: "", notes: "" });
  const [apptForm, setApptForm] = useState({ type: "checkup", date: "", duration: "30", fee: "", paidAmount: "", note: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/petshop/pets/${id}`);
    setPet(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const saveLog = async () => {
    if (!logForm.description) return;
    setSaving(true);
    await fetch("/api/petshop/health-logs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...logForm, petId: id, cost: Number(logForm.cost || 0) }),
    });
    setShowLog(false); setLogForm({ logType: "vaccination", description: "", medicineName: "", dosage: "", vetName: "", cost: "", nextDueDate: "", notes: "" });
    setSaving(false); load();
  };

  const saveAppt = async () => {
    if (!apptForm.date) return;
    setSaving(true);
    await fetch("/api/petshop/appointments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...apptForm, petId: id, fee: Number(apptForm.fee || 0), paidAmount: Number(apptForm.paidAmount || 0), duration: Number(apptForm.duration || 30) }),
    });
    setShowAppt(false); setApptForm({ type: "checkup", date: "", duration: "30", fee: "", paidAmount: "", note: "" });
    setSaving(false); load();
  };

  const updateApptStatus = async (apptId: string, status: string) => {
    await fetch(`/api/petshop/appointments/${apptId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    load();
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 size={26} className="animate-spin" style={{ color: PET_COLOR }} /></div>;
  if (!pet) return <div className="text-center py-16" style={{ color: S.muted }}>পাওয়া যায়নি</div>;

  function daysUntil(d: string | null) {
    if (!d) return null;
    return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-6">
      {/* Pet Header */}
      <div className="rounded-2xl p-5 flex items-start gap-4"
        style={{ background: `linear-gradient(135deg, ${PET_COLOR} 0%, #C2410C 100%)` }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl bg-white/20">
          {PET_ICONS[pet.type] ?? "🐾"}
        </div>
        <div className="flex-1">
          <h1 className="text-white text-2xl font-black">{pet.name}</h1>
          <p className="text-white/80 text-sm">{pet.breed ?? pet.type}{pet.gender ? ` · ${pet.gender === "male" ? "নর" : pet.gender === "female" ? "মাদি" : pet.gender}` : ""}{pet.weight ? ` · ${pet.weight}kg` : ""}</p>
          <p className="text-white/70 text-xs mt-0.5">{pet.customer.name}</p>
        </div>
        {pet.customer.phone && (
          <a href={`tel:${pet.customer.phone}`} className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20">
            <Phone size={16} style={{ color: "#fff" }} />
          </a>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "মালিক", value: pet.customer.name },
          { label: "ফোন", value: pet.customer.phone ?? "—" },
          { label: "রঙ", value: pet.color ?? "—" },
          { label: "Microchip", value: pet.microchipId ?? "—" },
        ].map(i => (
          <div key={i.label} className="rounded-xl p-3" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
            <p className="text-[10px] font-bold" style={{ color: S.muted }}>{i.label}</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: S.text }}>{i.value}</p>
          </div>
        ))}
      </div>

      {(pet.allergies || pet.chronicIllness) && (
        <div className="rounded-xl p-3 border-2" style={{ backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" }}>
          {pet.allergies && <p className="text-xs font-bold text-red-700">⚠ Allergies: {pet.allergies}</p>}
          {pet.chronicIllness && <p className="text-xs font-bold text-red-700 mt-1">💊 দীর্ঘস্থায়ী: {pet.chronicIllness}</p>}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ key: "logs", label: "Health Log" }, { key: "appointments", label: "Appointments" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as "logs" | "appointments")}
            className="px-4 py-2 rounded-xl text-sm font-bold border"
            style={tab === t.key ? { backgroundColor: PET_COLOR, color: "#fff", borderColor: PET_COLOR } : { backgroundColor: S.surface, color: S.muted, borderColor: S.border }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "logs" && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm" style={{ color: S.text }}>Health Log ({pet.healthLogs.length})</h3>
            <button onClick={() => setShowLog(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: PET_COLOR }}>
              <Plus size={13} /> Log যোগ করুন
            </button>
          </div>
          <div className="space-y-2">
            {pet.healthLogs.length === 0 ? (
              <div className="text-center py-10 rounded-2xl border" style={{ borderColor: S.border }}>
                <p className="text-sm" style={{ color: S.muted }}>কোনো log নেই</p>
              </div>
            ) : pet.healthLogs.map(log => {
              const due = daysUntil(log.nextDueDate ?? null);
              return (
                <div key={log.id} className="rounded-xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: PET_LIGHT, color: PET_COLOR }}>
                        {LOG_TYPES.find(l => l.key === log.logType)?.label ?? log.logType}
                      </span>
                      <p className="font-semibold text-sm mt-1" style={{ color: S.text }}>{log.description}</p>
                      {log.medicineName && <p className="text-xs mt-0.5" style={{ color: S.muted }}>💊 {log.medicineName}{log.dosage ? ` — ${log.dosage}` : ""}</p>}
                      {log.vetName && <p className="text-xs" style={{ color: S.muted }}>👨‍⚕️ {log.vetName}</p>}
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      {log.cost > 0 && <p className="text-sm font-bold" style={{ color: PET_COLOR }}>{formatBDT(log.cost)}</p>}
                      <p className="text-[10px]" style={{ color: S.muted }}>{new Date(log.logDate).toLocaleDateString("bn-BD")}</p>
                    </div>
                  </div>
                  {log.nextDueDate && (
                    <p className="text-xs font-bold mt-2" style={{ color: due !== null && due < 0 ? "#EF4444" : due !== null && due <= 7 ? "#F59E0B" : "#6B7280" }}>
                      📅 Next due: {new Date(log.nextDueDate).toLocaleDateString("bn-BD")}{due !== null ? ` (${due < 0 ? `${Math.abs(due)}d overdue` : `${due}d left`})` : ""}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "appointments" && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm" style={{ color: S.text }}>Appointments ({pet.appointments.length})</h3>
            <button onClick={() => setShowAppt(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: PET_COLOR }}>
              <Plus size={13} /> নতুন Appointment
            </button>
          </div>
          <div className="space-y-2">
            {pet.appointments.length === 0 ? (
              <div className="text-center py-10 rounded-2xl border" style={{ borderColor: S.border }}>
                <p className="text-sm" style={{ color: S.muted }}>কোনো appointment নেই</p>
              </div>
            ) : pet.appointments.map(a => {
              const sc = STATUS_COLORS[a.status] ?? "#6B7280";
              return (
                <div key={a.id} className="rounded-xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Calendar size={13} style={{ color: PET_COLOR }} />
                        <span className="text-sm font-bold" style={{ color: S.text }}>{APPT_TYPES.find(t => t.key === a.type)?.label ?? a.type}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${sc}15`, color: sc }}>{a.status}</span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: S.muted }}>{new Date(a.date).toLocaleString("bn-BD")}</p>
                      {a.note && <p className="text-xs mt-0.5" style={{ color: S.muted }}>{a.note}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: S.text }}>{formatBDT(a.fee)}</p>
                      {a.fee > a.paidAmount && <p className="text-xs" style={{ color: "#EF4444" }}>বাকি {formatBDT(a.fee - a.paidAmount)}</p>}
                    </div>
                  </div>
                  {a.status !== "done" && a.status !== "cancelled" && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => updateApptStatus(a.id, "done")}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ backgroundColor: "#ECFDF5", color: "#10B981" }}>
                        ✓ Done
                      </button>
                      <button onClick={() => updateApptStatus(a.id, "cancelled")}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }}>
                        ✗ Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Health Log Modal */}
      {showLog && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl" style={{ backgroundColor: S.surface }}>
            <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b z-10" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <h2 className="font-black text-base" style={{ color: S.text }}>Health Log যোগ করুন</h2>
              <button onClick={() => setShowLog(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: S.border }}><X size={15} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: S.muted }}>Log Type</p>
                <div className="flex flex-wrap gap-2">
                  {LOG_TYPES.map(lt => (
                    <button key={lt.key} onClick={() => setLogForm(f => ({ ...f, logType: lt.key }))}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold border"
                      style={logForm.logType === lt.key ? { backgroundColor: PET_COLOR, color: "#fff", borderColor: PET_COLOR } : { backgroundColor: S.surface, color: S.muted, borderColor: S.border }}>
                      {lt.label}
                    </button>
                  ))}
                </div>
              </div>
              <input value={logForm.description} onChange={e => setLogForm(f => ({ ...f, description: e.target.value }))}
                placeholder="বিবরণ *" className="w-full h-11 px-4 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
              <div className="grid grid-cols-2 gap-2">
                <input value={logForm.medicineName} onChange={e => setLogForm(f => ({ ...f, medicineName: e.target.value }))}
                  placeholder="ওষুধের নাম" className="h-10 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                <input value={logForm.dosage} onChange={e => setLogForm(f => ({ ...f, dosage: e.target.value }))}
                  placeholder="Dosage" className="h-10 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                <input value={logForm.vetName} onChange={e => setLogForm(f => ({ ...f, vetName: e.target.value }))}
                  placeholder="ভেট / ডাক্তারের নাম" className="h-10 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                <input type="number" value={logForm.cost} onChange={e => setLogForm(f => ({ ...f, cost: e.target.value }))}
                  placeholder="খরচ (৳)" className="h-10 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>পরবর্তী তারিখ (Next Due Date)</label>
                <input type="date" value={logForm.nextDueDate} onChange={e => setLogForm(f => ({ ...f, nextDueDate: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
              </div>
              <textarea value={logForm.notes} onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="নোট..." rows={2} className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none" style={{ borderColor: S.border, color: S.text }} />
              <div className="flex gap-2">
                <button onClick={() => setShowLog(false)} className="flex-1 py-3 rounded-xl border font-semibold text-sm" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
                <button onClick={saveLog} disabled={saving}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center" style={{ backgroundColor: PET_COLOR }}>
                  {saving ? <Loader2 size={15} className="animate-spin" /> : "✓ সেভ করুন"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Modal */}
      {showAppt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-5 space-y-3" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <h2 className="font-black text-base" style={{ color: S.text }}>নতুন Appointment</h2>
              <button onClick={() => setShowAppt(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: S.border }}><X size={15} /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {APPT_TYPES.map(t => (
                <button key={t.key} onClick={() => setApptForm(f => ({ ...f, type: t.key }))}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border"
                  style={apptForm.type === t.key ? { backgroundColor: PET_COLOR, color: "#fff", borderColor: PET_COLOR } : { backgroundColor: S.surface, color: S.muted, borderColor: S.border }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>তারিখ ও সময় *</label>
                <input type="datetime-local" value={apptForm.date} onChange={e => setApptForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full h-11 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
              </div>
              <input type="number" value={apptForm.fee} onChange={e => setApptForm(f => ({ ...f, fee: e.target.value }))}
                placeholder="ফি (৳)" className="h-10 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
              <input type="number" value={apptForm.paidAmount} onChange={e => setApptForm(f => ({ ...f, paidAmount: e.target.value }))}
                placeholder="অগ্রিম (৳)" className="h-10 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
            </div>
            <textarea value={apptForm.note} onChange={e => setApptForm(f => ({ ...f, note: e.target.value }))}
              placeholder="নোট..." rows={2} className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none" style={{ borderColor: S.border, color: S.text }} />
            <div className="flex gap-2">
              <button onClick={() => setShowAppt(false)} className="flex-1 py-3 rounded-xl border font-semibold text-sm" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={saveAppt} disabled={saving}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center" style={{ backgroundColor: PET_COLOR }}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : "✓ Book করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
