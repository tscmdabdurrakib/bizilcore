"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, Plus, X, Loader2, Search, ChevronRight, Phone, UserPlus, Printer } from "lucide-react";
import HospitalDisclaimer from "@/components/hospital/HospitalDisclaimer";

interface Doctor { id: string; name: string; title: string; specialization: string; visitFee: number; followUpFee?: number | null; chamberDays?: string | null; todayCount: number; maxPatients?: number | null }
interface Patient { id: string; name: string; age?: number | null; ageUnit?: string | null; gender?: string | null; phone?: string | null; regNumber: string }
interface Visit {
  id: string; visitNumber: string; tokenNumber: number; visitType: string;
  status: string; visitFee: number; paidAmount: number; dueAmount: number;
  chiefComplaint?: string | null; visitDate: string;
  patient: { id: string; name: string; age?: number | null; ageUnit?: string | null; gender?: string | null; phone?: string | null; regNumber: string };
  doctor: { id: string; name: string; title: string; specialization: string };
  tests: { id: string; testName: string; note?: string | null }[];
}

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", bg: "var(--c-bg)" };
const ACC = "#378ADD";
const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  waiting:    { bg: "#FAEEDA", color: "#633806", label: "অপেক্ষমাণ" },
  with_doctor: { bg: "#EEEDFE", color: "#3C3489", label: "ডাক্তারের সাথে" },
  done:       { bg: "#E1F5EE", color: "#085041", label: "সম্পন্ন" },
  cancelled:  { bg: "#FEE2E2", color: "#991B1B", label: "বাতিল" },
};
const VISIT_TYPE_LABEL: Record<string, string> = { new: "নতুন", follow_up: "ফলো-আপ", emergency: "জরুরি" };
const BLANK_PATIENT = { name: "", phone: "", age: "", ageUnit: "years", gender: "", bloodGroup: "", address: "", allergies: "" };
const BLANK_VITALS = { bp: "", pulse: "", temp: "", weight: "", height: "" };

export default function OPDBoard() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [step, setStep] = useState(1);
  const [phoneSearch, setPhoneSearch] = useState("");
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const [patientForm, setPatientForm] = useState({ ...BLANK_PATIENT });
  const [docForm, setDocForm] = useState({ doctorId: "", visitType: "new", chiefComplaint: "" });
  const [vitals, setVitals] = useState({ ...BLANK_VITALS });
  const [feeForm, setFeeForm] = useState({ visitFee: "", paidAmount: "" });
  const [saving, setSaving] = useState(false);
  const [tokenSlip, setTokenSlip] = useState<{ tokenNumber: number; doctorName: string; specialty: string; patientName: string; age: string; visitType: string; visitNumber: string } | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completeForm, setCompleteForm] = useState({ diagnosis: "", prescription: "", advice: "", nextVisitDate: "", tests: [{ testName: "", note: "" }] });
  const [savingComplete, setSavingComplete] = useState(false);
  const [showVitals, setShowVitals] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedDoc) params.set("doctorId", selectedDoc);
    const res = await fetch(`/api/hospital/opd?${params}`);
    if (res.ok) setVisits(await res.json());
    setLoading(false);
  }, [selectedDoc]);

  useEffect(() => {
    fetch("/api/hospital/doctors").then((r) => r.json()).then((data) => {
      setDoctors(data);
      if (data.length > 0) setSelectedDoc(data[0].id);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  async function searchPatient() {
    if (!phoneSearch.trim()) return;
    const res = await fetch(`/api/hospital/patients?search=${phoneSearch}`);
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) {
        setFoundPatient(data[0]);
        setPatientForm({ name: data[0].name, phone: data[0].phone ?? "", age: String(data[0].age ?? ""), ageUnit: data[0].ageUnit ?? "years", gender: data[0].gender ?? "", bloodGroup: data[0].bloodGroup ?? "", address: data[0].address ?? "", allergies: data[0].allergies ?? "" });
      } else { setFoundPatient(null); setPatientForm({ ...BLANK_PATIENT, phone: phoneSearch }); }
    }
  }

  const selectedDoctor = doctors.find((d) => d.id === docForm.doctorId);
  const autoFee = docForm.visitType === "follow_up" ? (selectedDoctor?.followUpFee ?? selectedDoctor?.visitFee ?? 0) : (selectedDoctor?.visitFee ?? 0);

  useEffect(() => {
    if (selectedDoctor) setFeeForm((f) => ({ ...f, visitFee: String(autoFee) }));
  }, [docForm.doctorId, docForm.visitType, autoFee, selectedDoctor]);

  async function handleToken() {
    setSaving(true);
    let patientId = foundPatient?.id ?? null;
    if (!patientId) {
      const pRes = await fetch("/api/hospital/patients", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...patientForm, age: patientForm.age ? Number(patientForm.age) : null }),
      });
      if (pRes.ok) { const p = await pRes.json(); patientId = p.id; }
    }
    if (!patientId) { setSaving(false); return; }

    const vitalsData: Record<string, string> = {};
    if (vitals.bp) vitalsData.bp = vitals.bp;
    if (vitals.pulse) vitalsData.pulse = vitals.pulse;
    if (vitals.temp) vitalsData.temp = vitals.temp;
    if (vitals.weight) vitalsData.weight = vitals.weight;
    if (vitals.height) vitalsData.height = vitals.height;

    const res = await fetch("/api/hospital/opd", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId, doctorId: docForm.doctorId, visitType: docForm.visitType,
        chiefComplaint: docForm.chiefComplaint || null,
        vitalSigns: Object.keys(vitalsData).length > 0 ? vitalsData : null,
        visitFee: Number(feeForm.visitFee), paidAmount: Number(feeForm.paidAmount || 0),
        followUpFee: selectedDoctor?.followUpFee,
      }),
    });

    if (res.ok) {
      const v = await res.json();
      const age = patientForm.age ? `${patientForm.age} ${patientForm.ageUnit}` : "";
      setTokenSlip({ tokenNumber: v.tokenNumber, doctorName: `${selectedDoctor?.title} ${selectedDoctor?.name}`, specialty: selectedDoctor?.specialization ?? "", patientName: patientForm.name, age, visitType: VISIT_TYPE_LABEL[docForm.visitType], visitNumber: v.visitNumber });
      setShowNewForm(false);
      setStep(1);
      setPhoneSearch(""); setFoundPatient(null); setPatientForm({ ...BLANK_PATIENT }); setDocForm({ doctorId: "", visitType: "new", chiefComplaint: "" }); setVitals({ ...BLANK_VITALS }); setFeeForm({ visitFee: "", paidAmount: "" });
      load();
    }
    setSaving(false);
  }

  async function callPatient(id: string) {
    await fetch(`/api/hospital/opd/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "with_doctor" }) });
    load();
  }

  async function handleComplete() {
    if (!completingId) return;
    setSavingComplete(true);
    const tests = completeForm.tests.filter((t) => t.testName.trim());
    await fetch(`/api/hospital/opd/${completingId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done", diagnosis: completeForm.diagnosis || null, prescription: completeForm.prescription || null, advice: completeForm.advice || null, nextVisitDate: completeForm.nextVisitDate || null, tests }),
    });
    setCompletingId(null);
    setCompleteForm({ diagnosis: "", prescription: "", advice: "", nextVisitDate: "", tests: [{ testName: "", note: "" }] });
    setSavingComplete(false);
    load();
  }

  const inp = "w-full px-3 py-2 rounded-xl border text-sm outline-none";

  const groupedByDoctor: Record<string, Visit[]> = {};
  visits.forEach((v) => {
    if (!groupedByDoctor[v.doctor.id]) groupedByDoctor[v.doctor.id] = [];
    groupedByDoctor[v.doctor.id].push(v);
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      <HospitalDisclaimer />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={20} style={{ color: ACC }} />
          <h1 className="text-lg font-bold" style={{ color: S.text }}>OPD ব্যবস্থাপনা</h1>
        </div>
        <button onClick={() => { setShowNewForm(true); setStep(1); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: ACC }}>
          <Plus size={15} /> নতুন রোগী
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setSelectedDoc("")} className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border" style={{ backgroundColor: selectedDoc === "" ? ACC : S.surface, color: selectedDoc === "" ? "#fff" : S.text, borderColor: selectedDoc === "" ? ACC : S.border }}>সব</button>
        {doctors.map((d) => (
          <button key={d.id} onClick={() => setSelectedDoc(d.id)} className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border" style={{ backgroundColor: selectedDoc === d.id ? ACC : S.surface, color: selectedDoc === d.id ? "#fff" : S.text, borderColor: selectedDoc === d.id ? ACC : S.border }}>
            {d.title} {d.name} ({groupedByDoctor[d.id]?.length ?? 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: ACC }} /></div>
      ) : visits.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <Activity size={28} className="mx-auto mb-3" style={{ color: S.muted }} />
          <p className="text-sm" style={{ color: S.muted }}>আজকে কোনো রোগী নেই</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[11px] font-semibold border-b" style={{ borderColor: S.border, color: S.muted, backgroundColor: S.bg }}>
            <span className="col-span-1">টোকেন</span>
            <span className="col-span-3">রোগী</span>
            <span className="col-span-3">ডাক্তার</span>
            <span className="col-span-2">ধরন</span>
            <span className="col-span-2">অবস্থা</span>
            <span className="col-span-1"></span>
          </div>
          {visits.map((v) => {
            const ss = STATUS_STYLE[v.status] ?? STATUS_STYLE.waiting;
            return (
              <div key={v.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b last:border-0 items-center" style={{ borderColor: S.border }}>
                <span className="col-span-1 text-sm font-bold" style={{ color: ACC }}>{v.tokenNumber}</span>
                <div className="col-span-3">
                  <p className="text-xs font-semibold" style={{ color: S.text }}>{v.patient.name}</p>
                  <p className="text-[11px]" style={{ color: S.muted }}>{v.patient.age ? `${v.patient.age} ${v.patient.ageUnit}` : ""}{v.patient.gender ? ` · ${v.patient.gender === "male" ? "পুরুষ" : v.patient.gender === "female" ? "মহিলা" : "অন্যান্য"}` : ""}</p>
                </div>
                <div className="col-span-3">
                  <p className="text-xs" style={{ color: S.text }}>{v.doctor.title} {v.doctor.name}</p>
                  <p className="text-[11px]" style={{ color: S.muted }}>{v.doctor.specialization}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: v.visitType === "emergency" ? "#FEE2E2" : v.visitType === "follow_up" ? "#E1F5EE" : "#EFF6FF", color: v.visitType === "emergency" ? "#991B1B" : v.visitType === "follow_up" ? "#085041" : ACC }}>
                    {VISIT_TYPE_LABEL[v.visitType]}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: ss.bg, color: ss.color }}>{ss.label}</span>
                </div>
                <div className="col-span-1 flex justify-end">
                  {v.status === "waiting" && (
                    <button onClick={() => callPatient(v.id)} className="text-[11px] px-2 py-1 rounded-lg font-medium" style={{ backgroundColor: "#EEEDFE", color: "#3C3489" }}>ডাকুন</button>
                  )}
                  {v.status === "with_doctor" && (
                    <button onClick={() => { setCompletingId(v.id); setCompleteForm({ diagnosis: "", prescription: "", advice: "", nextVisitDate: "", tests: [{ testName: "", note: "" }] }); }} className="text-[11px] px-2 py-1 rounded-lg font-medium" style={{ backgroundColor: "#E1F5EE", color: "#085041" }}>সম্পন্ন</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ backgroundColor: S.surface, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: S.border }}>
              <div>
                <h2 className="text-base font-bold" style={{ color: S.text }}>নতুন রোগী - টোকেন</h2>
                <div className="flex gap-2 mt-1">
                  {[1, 2, 3].map((s) => (
                    <span key={s} className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: step === s ? ACC : S.border, color: step === s ? "#fff" : S.muted }}>
                      ধাপ {s}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={() => setShowNewForm(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <div className="p-5 space-y-4">
              {step === 1 && (
                <>
                  <div className="flex gap-2">
                    <input className={inp} value={phoneSearch} onChange={(e) => setPhoneSearch(e.target.value)} placeholder="ফোন নম্বর দিয়ে খুঁজুন" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                    <button onClick={searchPatient} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ backgroundColor: ACC, color: "#fff" }}><Search size={16} /></button>
                  </div>
                  {foundPatient && (
                    <div className="p-3 rounded-xl border" style={{ backgroundColor: "#E1F5EE", borderColor: "#A7F3D0" }}>
                      <p className="text-xs font-semibold" style={{ color: "#085041" }}>পুরনো রোগী পাওয়া গেছে</p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: S.text }}>{foundPatient.name}</p>
                      <p className="text-xs" style={{ color: S.muted }}>{foundPatient.regNumber} · {foundPatient.phone}</p>
                    </div>
                  )}
                  {!foundPatient && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: S.muted }}>
                        <UserPlus size={12} /> নতুন রোগীর তথ্য
                      </div>
                      <input className={inp} value={patientForm.name} onChange={(e) => setPatientForm((f) => ({ ...f, name: e.target.value }))} placeholder="নাম *" required style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                      <div className="grid grid-cols-2 gap-3">
                        <input className={inp} type="number" value={patientForm.age} onChange={(e) => setPatientForm((f) => ({ ...f, age: e.target.value }))} placeholder="বয়স *" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                        <select className={inp} value={patientForm.ageUnit} onChange={(e) => setPatientForm((f) => ({ ...f, ageUnit: e.target.value }))} style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                          <option value="years">বছর</option>
                          <option value="months">মাস</option>
                          <option value="days">দিন</option>
                        </select>
                      </div>
                      <select className={inp} value={patientForm.gender} onChange={(e) => setPatientForm((f) => ({ ...f, gender: e.target.value }))} style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                        <option value="">লিঙ্গ নির্বাচন করুন</option>
                        <option value="male">পুরুষ</option>
                        <option value="female">মহিলা</option>
                        <option value="other">অন্যান্য</option>
                      </select>
                      <input className={inp} value={patientForm.address} onChange={(e) => setPatientForm((f) => ({ ...f, address: e.target.value }))} placeholder="ঠিকানা" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                    </div>
                  )}
                  <button onClick={() => setStep(2)} className="w-full py-2.5 rounded-xl font-semibold text-sm text-white" style={{ backgroundColor: ACC }}>পরবর্তী ধাপ <ChevronRight size={14} className="inline" /></button>
                </>
              )}
              {step === 2 && (
                <>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>ডাক্তার নির্বাচন *</label>
                    <select className={inp} value={docForm.doctorId} onChange={(e) => setDocForm((f) => ({ ...f, doctorId: e.target.value }))} required style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                      <option value="">ডাক্তার বেছে নিন</option>
                      {doctors.map((d) => <option key={d.id} value={d.id}>{d.title} {d.name} · {d.specialization} (আজ: {d.todayCount})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>ভিজিটের ধরন</label>
                    <div className="flex gap-2">
                      {[["new", "নতুন"], ["follow_up", "ফলো-আপ"], ["emergency", "জরুরি"]].map(([val, label]) => (
                        <button key={val} type="button" onClick={() => setDocForm((f) => ({ ...f, visitType: val }))}
                          className="flex-1 py-2 rounded-xl text-xs font-medium border"
                          style={{ backgroundColor: docForm.visitType === val ? ACC : S.surface, color: docForm.visitType === val ? "#fff" : S.text, borderColor: docForm.visitType === val ? ACC : S.border }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea className={inp} value={docForm.chiefComplaint} onChange={(e) => setDocForm((f) => ({ ...f, chiefComplaint: e.target.value }))} placeholder="মূল সমস্যা (ঐচ্ছিক)" rows={2} style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface, resize: "none" }} />
                  <div>
                    <button type="button" onClick={() => setShowVitals((v) => !v)} className="text-xs font-medium flex items-center gap-1" style={{ color: ACC }}>
                      {showVitals ? "ভাইটাল সাইন লুকান" : "+ ভাইটাল সাইন যোগ করুন (ঐচ্ছিক)"}
                    </button>
                    {showVitals && (
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {[["bp", "রক্তচাপ (BP)"], ["pulse", "নাড়ি (Pulse)"], ["temp", "তাপমাত্রা (°F)"], ["weight", "ওজন (kg)"], ["height", "উচ্চতা (cm)"]].map(([key, label]) => (
                          <div key={key}>
                            <label className="text-[11px] font-medium block mb-0.5" style={{ color: S.muted }}>{label}</label>
                            <input className={inp} value={vitals[key as keyof typeof vitals]} onChange={(e) => setVitals((v) => ({ ...v, [key]: e.target.value }))} placeholder={label} style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl font-semibold text-sm border" style={{ borderColor: S.border, color: S.text }}>পিছনে</button>
                    <button onClick={() => setStep(3)} disabled={!docForm.doctorId} className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white" style={{ backgroundColor: ACC, opacity: docForm.doctorId ? 1 : 0.5 }}>পরবর্তী ধাপ</button>
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <div className="p-3 rounded-xl border" style={{ backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }}>
                    <p className="text-xs" style={{ color: S.muted }}>ডাক্তার: <strong style={{ color: S.text }}>{selectedDoctor?.title} {selectedDoctor?.name}</strong></p>
                    <p className="text-xs mt-0.5" style={{ color: S.muted }}>রোগী: <strong style={{ color: S.text }}>{foundPatient?.name ?? patientForm.name}</strong></p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>ভিজিট ফি (৳)</label>
                      <input className={inp} type="number" value={feeForm.visitFee} onChange={(e) => setFeeForm((f) => ({ ...f, visitFee: e.target.value }))} min="0" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>পরিশোধিত (৳)</label>
                      <input className={inp} type="number" value={feeForm.paidAmount} onChange={(e) => setFeeForm((f) => ({ ...f, paidAmount: e.target.value }))} min="0" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                    </div>
                  </div>
                  {Number(feeForm.visitFee) > Number(feeForm.paidAmount || 0) && (
                    <p className="text-xs" style={{ color: "#DC2626" }}>বাকি: ৳{Number(feeForm.visitFee) - Number(feeForm.paidAmount || 0)}</p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl font-semibold text-sm border" style={{ borderColor: S.border, color: S.text }}>পিছনে</button>
                    <button onClick={handleToken} disabled={saving} className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-1" style={{ backgroundColor: ACC }}>
                      {saving ? <Loader2 size={14} className="animate-spin" /> : "টোকেন নিন"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {tokenSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <div className="w-72 rounded-2xl shadow-2xl text-center p-6 space-y-3" style={{ backgroundColor: S.surface }}>
            <div className="text-4xl font-black" style={{ color: ACC }}>{tokenSlip.tokenNumber}</div>
            <p className="text-xs font-medium" style={{ color: S.muted }}>টোকেন নম্বর</p>
            <div className="border-t border-b py-3 space-y-1" style={{ borderColor: S.border }}>
              <p className="text-sm font-semibold" style={{ color: S.text }}>{tokenSlip.doctorName}</p>
              <p className="text-xs" style={{ color: S.muted }}>{tokenSlip.specialty}</p>
              <p className="text-sm font-medium mt-2" style={{ color: S.text }}>{tokenSlip.patientName}</p>
              {tokenSlip.age && <p className="text-xs" style={{ color: S.muted }}>বয়স: {tokenSlip.age}</p>}
              <p className="text-xs" style={{ color: S.muted }}>{new Date().toLocaleTimeString("bn-BD")}</p>
              <span className="inline-block text-xs px-2 py-0.5 rounded-full mt-1" style={{ backgroundColor: "#EFF6FF", color: ACC }}>{tokenSlip.visitType}</span>
            </div>
            <p className="text-[11px]" style={{ color: S.muted }}>{tokenSlip.visitNumber}</p>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="flex-1 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1" style={{ borderColor: S.border, color: S.muted }}>
                <Printer size={12} /> প্রিন্ট
              </button>
              <button onClick={() => setTokenSlip(null)} className="flex-1 py-2 rounded-xl text-xs font-medium text-white" style={{ backgroundColor: ACC }}>বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}

      {completingId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ backgroundColor: S.surface, maxHeight: "85vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: S.border }}>
              <h2 className="text-base font-bold" style={{ color: S.text }}>পরামর্শ সম্পন্ন করুন</h2>
              <button onClick={() => setCompletingId(null)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <HospitalDisclaimer />
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>রোগ নির্ণয়</label>
                <textarea className={inp} value={completeForm.diagnosis} onChange={(e) => setCompleteForm((f) => ({ ...f, diagnosis: e.target.value }))} rows={2} placeholder="রোগ নির্ণয় লিখুন" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface, resize: "none" }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>প্রেসক্রিপশন</label>
                <textarea className={inp} value={completeForm.prescription} onChange={(e) => setCompleteForm((f) => ({ ...f, prescription: e.target.value }))} rows={3} placeholder="ওষুধ ও ডোজ" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface, resize: "none" }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>পরামর্শ</label>
                <textarea className={inp} value={completeForm.advice} onChange={(e) => setCompleteForm((f) => ({ ...f, advice: e.target.value }))} rows={2} placeholder="জীবনযাপন পরামর্শ ইত্যাদি" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface, resize: "none" }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>পরবর্তী ভিজিটের তারিখ</label>
                <input className={inp} type="date" value={completeForm.nextVisitDate} onChange={(e) => setCompleteForm((f) => ({ ...f, nextVisitDate: e.target.value }))} style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: S.muted }}>পরীক্ষার অনুরোধ</label>
                {completeForm.tests.map((t, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input className={inp} value={t.testName} onChange={(e) => setCompleteForm((f) => ({ ...f, tests: f.tests.map((tt, ii) => ii === i ? { ...tt, testName: e.target.value } : tt) }))} placeholder="পরীক্ষার নাম (CBC, X-Ray...)" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                    {i > 0 && <button type="button" onClick={() => setCompleteForm((f) => ({ ...f, tests: f.tests.filter((_, ii) => ii !== i) }))} className="px-2"><X size={14} style={{ color: S.muted }} /></button>}
                  </div>
                ))}
                <button type="button" onClick={() => setCompleteForm((f) => ({ ...f, tests: [...f.tests, { testName: "", note: "" }] }))} className="text-xs font-medium" style={{ color: ACC }}>+ আরও পরীক্ষা যোগ করুন</button>
              </div>
              <button onClick={handleComplete} disabled={savingComplete} className="w-full py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2" style={{ backgroundColor: "#0F6E56" }}>
                {savingComplete ? <Loader2 size={14} className="animate-spin" /> : "সম্পন্ন নিশ্চিত করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
