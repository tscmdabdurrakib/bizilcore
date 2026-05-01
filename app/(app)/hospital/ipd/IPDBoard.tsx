"use client";

import { useEffect, useState, useCallback } from "react";
import { BedDouble, Plus, X, Loader2, Search, ChevronRight, UserPlus, DollarSign } from "lucide-react";
import HospitalDisclaimer from "@/components/hospital/HospitalDisclaimer";

interface Doctor { id: string; name: string; title: string; specialization: string }
interface Bed { id: string; number: string; ward: string; type: string; status: string; dailyRate: number; occupiedBy?: string | null }
interface Patient { id: string; name: string; age?: number | null; ageUnit?: string | null; gender?: string | null; phone?: string | null; regNumber: string }
interface IPDCharge { id: string; chargeType: string; description: string; amount: number; chargeDate: string }
interface IPDNote { id: string; noteType: string; note: string; writtenAt: string }
interface Admission {
  id: string; admissionNumber: string; bedNumber: string; ward: string;
  admitDate: string; dischargeDate?: string | null;
  admitDiagnosis?: string | null; finalDiagnosis?: string | null;
  surgeryDone: boolean; totalBill: number; advancePaid: number; dueAmount: number; status: string;
  patient: { id: string; name: string; age?: number | null; ageUnit?: string | null; gender?: string | null; phone?: string | null; regNumber: string };
  doctor: { id: string; name: string; title: string; specialization: string };
  charges: IPDCharge[];
  notes: IPDNote[];
}

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", bg: "var(--c-bg)" };
const ACC = "#378ADD";
const WARDS = ["General", "Cabin", "ICU", "CCU", "Maternity", "Pediatrics"];
const CHARGE_TYPES = ["room", "doctor_visit", "nursing", "medicine", "procedure", "lab", "other"];
const CHARGE_LABELS: Record<string, string> = { room: "রুম", doctor_visit: "ডাক্তার ভিজিট", nursing: "নার্সিং", medicine: "ওষুধ", procedure: "পদ্ধতি", lab: "ল্যাব", other: "অন্যান্য" };
const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  admitted:    { bg: "#EFF6FF", color: "#1D4ED8", label: "ভর্তি" },
  discharged:  { bg: "#E1F5EE", color: "#085041", label: "ছাড়পত্র" },
  transferred: { bg: "#FAEEDA", color: "#633806", label: "স্থানান্তর" },
  absconded:   { bg: "#FEE2E2", color: "#991B1B", label: "পালিয়েছে" },
};
const BED_COLOR: Record<string, { bg: string; color: string }> = {
  vacant: { bg: "#E1F5EE", color: "#085041" },
  occupied: { bg: "#EFF6FF", color: "#1D4ED8" },
  reserved: { bg: "#FAEEDA", color: "#633806" },
  maintenance: { bg: "#FEE2E2", color: "#991B1B" },
};

const BLANK_PATIENT = { name: "", phone: "", age: "", ageUnit: "years", gender: "", bloodGroup: "", address: "" };

export default function IPDBoard() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("admitted");
  const [wardTab, setWardTab] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "bed">("list");
  const [showAdmitForm, setShowAdmitForm] = useState(false);
  const [admitStep, setAdmitStep] = useState(1);
  const [phoneSearch, setPhoneSearch] = useState("");
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const [patientForm, setPatientForm] = useState({ ...BLANK_PATIENT });
  const [admitForm, setAdmitForm] = useState({ doctorId: "", ward: "", bedId: "", admitDiagnosis: "", advancePaid: "" });
  const [saving, setSaving] = useState(false);
  const [selectedAdm, setSelectedAdm] = useState<Admission | null>(null);
  const [showChargeForm, setShowChargeForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showDischargeForm, setShowDischargeForm] = useState(false);
  const [chargeForm, setChargeForm] = useState({ chargeType: "room", description: "", amount: "" });
  const [noteForm, setNoteForm] = useState({ noteType: "doctor", note: "" });
  const [dischargeForm, setDischargeForm] = useState({ finalDiagnosis: "", surgeryDone: false, surgeryNote: "", finalPaid: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/hospital/ipd?status=${statusFilter}`);
    if (res.ok) setAdmissions(await res.json());
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch("/api/hospital/doctors").then((r) => r.json()).then(setDoctors);
    fetch("/api/hospital/beds").then((r) => r.json()).then(setBeds);
  }, []);

  async function searchPatient() {
    if (!phoneSearch.trim()) return;
    const res = await fetch(`/api/hospital/patients?search=${phoneSearch}`);
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) {
        setFoundPatient(data[0]);
        setPatientForm({ name: data[0].name, phone: data[0].phone ?? "", age: String(data[0].age ?? ""), ageUnit: data[0].ageUnit ?? "years", gender: data[0].gender ?? "", bloodGroup: "", address: data[0].address ?? "" });
      } else { setFoundPatient(null); setPatientForm({ ...BLANK_PATIENT, phone: phoneSearch }); }
    }
  }

  const wardBeds = admitForm.ward ? beds.filter((b) => b.ward === admitForm.ward && b.status === "vacant") : [];

  async function handleAdmit() {
    setSaving(true);
    let patientId = foundPatient?.id ?? null;
    if (!patientId) {
      const pRes = await fetch("/api/hospital/patients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...patientForm, age: patientForm.age ? Number(patientForm.age) : null }) });
      if (pRes.ok) { const p = await pRes.json(); patientId = p.id; }
    }
    if (!patientId) { setSaving(false); return; }

    const selectedBed = beds.find((b) => b.id === admitForm.bedId);
    const res = await fetch("/api/hospital/ipd", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId, doctorId: admitForm.doctorId, ward: admitForm.ward, bedNumber: selectedBed?.number, admitDiagnosis: admitForm.admitDiagnosis, advancePaid: Number(admitForm.advancePaid || 0) }),
    });
    if (res.ok) {
      setShowAdmitForm(false);
      setAdmitStep(1); setPhoneSearch(""); setFoundPatient(null); setPatientForm({ ...BLANK_PATIENT }); setAdmitForm({ doctorId: "", ward: "", bedId: "", admitDiagnosis: "", advancePaid: "" });
      load();
      fetch("/api/hospital/beds").then((r) => r.json()).then(setBeds);
    }
    setSaving(false);
  }

  async function openDetail(id: string) {
    const res = await fetch(`/api/hospital/ipd/${id}`);
    if (res.ok) setSelectedAdm(await res.json());
  }

  async function addCharge() {
    if (!selectedAdm) return;
    setSubmitting(true);
    const res = await fetch(`/api/hospital/ipd/${selectedAdm.id}/charges`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(chargeForm) });
    if (res.ok) { setShowChargeForm(false); setChargeForm({ chargeType: "room", description: "", amount: "" }); openDetail(selectedAdm.id); }
    setSubmitting(false);
  }

  async function addNote() {
    if (!selectedAdm) return;
    setSubmitting(true);
    const res = await fetch(`/api/hospital/ipd/${selectedAdm.id}/notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(noteForm) });
    if (res.ok) { setShowNoteForm(false); setNoteForm({ noteType: "doctor", note: "" }); openDetail(selectedAdm.id); }
    setSubmitting(false);
  }

  async function handleDischarge() {
    if (!selectedAdm) return;
    setSubmitting(true);
    const res = await fetch(`/api/hospital/ipd/${selectedAdm.id}/discharge`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dischargeForm) });
    if (res.ok) { setShowDischargeForm(false); setSelectedAdm(null); load(); fetch("/api/hospital/beds").then((r) => r.json()).then(setBeds); }
    setSubmitting(false);
  }

  const inp = "w-full px-3 py-2 rounded-xl border text-sm outline-none";
  const wards = [...new Set(beds.map((b) => b.ward))];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      <HospitalDisclaimer />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BedDouble size={20} style={{ color: "#7C3AED" }} />
          <h1 className="text-lg font-bold" style={{ color: S.text }}>IPD ব্যবস্থাপনা</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setViewMode((m) => m === "list" ? "bed" : "list")} className="px-3 py-2 rounded-xl text-xs font-medium border" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
            {viewMode === "list" ? "বেড ম্যাপ" : "তালিকা"}
          </button>
          <button onClick={() => { setShowAdmitForm(true); setAdmitStep(1); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#7C3AED" }}>
            <Plus size={15} /> রোগী ভর্তি
          </button>
        </div>
      </div>

      {viewMode === "bed" ? (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setWardTab("all")} className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border" style={{ backgroundColor: wardTab === "all" ? "#7C3AED" : S.surface, color: wardTab === "all" ? "#fff" : S.text, borderColor: wardTab === "all" ? "#7C3AED" : S.border }}>সব ওয়ার্ড</button>
            {wards.map((w) => (
              <button key={w} onClick={() => setWardTab(w)} className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border" style={{ backgroundColor: wardTab === w ? "#7C3AED" : S.surface, color: wardTab === w ? "#fff" : S.text, borderColor: wardTab === w ? "#7C3AED" : S.border }}>{w}</button>
            ))}
          </div>
          {(wardTab === "all" ? wards : [wardTab]).map((ward) => {
            const wardBedList = beds.filter((b) => b.ward === ward);
            if (wardBedList.length === 0) return null;
            return (
              <div key={ward} className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: S.text }}>{ward} ওয়ার্ড</h3>
                <div className="flex flex-wrap gap-2">
                  {wardBedList.map((b) => {
                    const bc = BED_COLOR[b.status] ?? BED_COLOR.vacant;
                    return (
                      <div key={b.id} className="relative group">
                        <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center border text-center cursor-default" style={{ backgroundColor: bc.bg, borderColor: bc.color }}>
                          <p className="text-xs font-bold" style={{ color: bc.color }}>{b.number}</p>
                          <p className="text-[9px] mt-0.5" style={{ color: bc.color }}>{b.status === "vacant" ? "খালি" : b.status === "occupied" ? "ভর্তি" : b.status === "reserved" ? "সংরক্ষিত" : "রক্ষণাবেক্ষণ"}</p>
                        </div>
                        {b.occupiedBy && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded-lg text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10" style={{ backgroundColor: "#1E293B", color: "#fff" }}>
                            {b.occupiedBy}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-3 mt-3 text-[11px]" style={{ color: S.muted }}>
                  {Object.entries(BED_COLOR).map(([status, style]) => (
                    <span key={status} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: style.color }} />
                      {status === "vacant" ? "খালি" : status === "occupied" ? "ভর্তি" : status === "reserved" ? "সংরক্ষিত" : "রক্ষণাবেক্ষণ"}: {wardBedList.filter((b) => b.status === status).length}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[["admitted", "ভর্তি"], ["discharged", "ছাড়পত্র"], ["", "সব"]].map(([val, label]) => (
              <button key={val} onClick={() => setStatusFilter(val)} className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border" style={{ backgroundColor: statusFilter === val ? "#7C3AED" : S.surface, color: statusFilter === val ? "#fff" : S.text, borderColor: statusFilter === val ? "#7C3AED" : S.border }}>{label}</button>
            ))}
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: "#7C3AED" }} /></div>
          ) : admissions.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <BedDouble size={28} className="mx-auto mb-3" style={{ color: S.muted }} />
              <p className="text-sm" style={{ color: S.muted }}>কোনো ভর্তি রোগী নেই</p>
            </div>
          ) : (
            <div className="space-y-3">
              {admissions.map((a) => {
                const ss = STATUS_STYLE[a.status] ?? STATUS_STYLE.admitted;
                return (
                  <div key={a.id} className="rounded-2xl border p-4 cursor-pointer hover:shadow-sm transition-shadow" style={{ backgroundColor: S.surface, borderColor: S.border }} onClick={() => openDetail(a.id)}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold" style={{ color: S.text }}>{a.patient.name}</p>
                          <span className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: ss.bg, color: ss.color }}>{ss.label}</span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: S.muted }}>{a.admissionNumber} · {a.ward} · বেড {a.bedNumber}</p>
                        <p className="text-xs" style={{ color: S.muted }}>ডাক্তার: {a.doctor.title} {a.doctor.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: "#7C3AED" }}>৳{a.totalBill.toLocaleString("bn-BD")}</p>
                        {a.dueAmount > 0 && <p className="text-xs" style={{ color: "#DC2626" }}>বাকি: ৳{a.dueAmount.toLocaleString("bn-BD")}</p>}
                        <ChevronRight size={14} className="ml-auto mt-1" style={{ color: S.muted }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {showAdmitForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ backgroundColor: S.surface, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: S.border }}>
              <div>
                <h2 className="text-base font-bold" style={{ color: S.text }}>রোগী ভর্তি করুন</h2>
                <div className="flex gap-2 mt-1">
                  {[1, 2].map((s) => <span key={s} className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: admitStep === s ? "#7C3AED" : S.border, color: admitStep === s ? "#fff" : S.muted }}>ধাপ {s}</span>)}
                </div>
              </div>
              <button onClick={() => setShowAdmitForm(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <div className="p-5 space-y-4">
              {admitStep === 1 && (
                <>
                  <div className="flex gap-2">
                    <input className={inp} value={phoneSearch} onChange={(e) => setPhoneSearch(e.target.value)} placeholder="ফোন নম্বর দিয়ে খুঁজুন" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                    <button onClick={searchPatient} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ backgroundColor: "#7C3AED", color: "#fff" }}><Search size={16} /></button>
                  </div>
                  {foundPatient ? (
                    <div className="p-3 rounded-xl border" style={{ backgroundColor: "#E1F5EE", borderColor: "#A7F3D0" }}>
                      <p className="text-xs font-semibold" style={{ color: "#085041" }}>পুরনো রোগী পাওয়া গেছে</p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: S.text }}>{foundPatient.name}</p>
                      <p className="text-xs" style={{ color: S.muted }}>{foundPatient.regNumber}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: S.muted }}><UserPlus size={12} /> নতুন রোগীর তথ্য</div>
                      <input className={inp} value={patientForm.name} onChange={(e) => setPatientForm((f) => ({ ...f, name: e.target.value }))} placeholder="নাম *" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                      <div className="grid grid-cols-2 gap-3">
                        <input className={inp} type="number" value={patientForm.age} onChange={(e) => setPatientForm((f) => ({ ...f, age: e.target.value }))} placeholder="বয়স" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                        <select className={inp} value={patientForm.gender} onChange={(e) => setPatientForm((f) => ({ ...f, gender: e.target.value }))} style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                          <option value="">লিঙ্গ</option>
                          <option value="male">পুরুষ</option>
                          <option value="female">মহিলা</option>
                          <option value="other">অন্যান্য</option>
                        </select>
                      </div>
                      <input className={inp} value={patientForm.phone} onChange={(e) => setPatientForm((f) => ({ ...f, phone: e.target.value }))} placeholder="ফোন নম্বর" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                    </div>
                  )}
                  <button onClick={() => setAdmitStep(2)} className="w-full py-2.5 rounded-xl font-semibold text-sm text-white" style={{ backgroundColor: "#7C3AED" }}>পরবর্তী ধাপ</button>
                </>
              )}
              {admitStep === 2 && (
                <>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>ডাক্তার *</label>
                    <select className={inp} value={admitForm.doctorId} onChange={(e) => setAdmitForm((f) => ({ ...f, doctorId: e.target.value }))} required style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                      <option value="">ডাক্তার বেছে নিন</option>
                      {doctors.map((d) => <option key={d.id} value={d.id}>{d.title} {d.name} · {d.specialization}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>ওয়ার্ড *</label>
                    <select className={inp} value={admitForm.ward} onChange={(e) => setAdmitForm((f) => ({ ...f, ward: e.target.value, bedId: "" }))} required style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                      <option value="">ওয়ার্ড বেছে নিন</option>
                      {WARDS.map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>বেড * (শুধুমাত্র খালি বেড)</label>
                    <select className={inp} value={admitForm.bedId} onChange={(e) => setAdmitForm((f) => ({ ...f, bedId: e.target.value }))} required style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                      <option value="">বেড বেছে নিন</option>
                      {wardBeds.map((b) => <option key={b.id} value={b.id}>বেড {b.number} ({b.type}){b.dailyRate > 0 ? ` · ৳${b.dailyRate}/দিন` : ""}</option>)}
                    </select>
                    {admitForm.ward && wardBeds.length === 0 && <p className="text-xs mt-1" style={{ color: "#DC2626" }}>এই ওয়ার্ডে কোনো খালি বেড নেই</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>ভর্তির কারণ</label>
                    <textarea className={inp} value={admitForm.admitDiagnosis} onChange={(e) => setAdmitForm((f) => ({ ...f, admitDiagnosis: e.target.value }))} rows={2} placeholder="রোগ নির্ণয় বা উপসর্গ" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface, resize: "none" }} />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>অগ্রিম পেমেন্ট (৳)</label>
                    <input className={inp} type="number" value={admitForm.advancePaid} onChange={(e) => setAdmitForm((f) => ({ ...f, advancePaid: e.target.value }))} min="0" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setAdmitStep(1)} className="flex-1 py-2.5 rounded-xl font-semibold text-sm border" style={{ borderColor: S.border, color: S.text }}>পিছনে</button>
                    <button onClick={handleAdmit} disabled={saving || !admitForm.doctorId || !admitForm.bedId} className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-1" style={{ backgroundColor: "#7C3AED", opacity: saving || !admitForm.doctorId || !admitForm.bedId ? 0.5 : 1 }}>
                      {saving ? <Loader2 size={14} className="animate-spin" /> : "ভর্তি করুন"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedAdm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-2xl rounded-2xl shadow-2xl" style={{ backgroundColor: S.surface, maxHeight: "92vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: S.border }}>
              <div>
                <p className="text-base font-bold" style={{ color: S.text }}>{selectedAdm.patient.name}</p>
                <p className="text-xs" style={{ color: S.muted }}>{selectedAdm.admissionNumber} · {selectedAdm.ward} · বেড {selectedAdm.bedNumber}</p>
              </div>
              <button onClick={() => setSelectedAdm(null)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <HospitalDisclaimer />
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3" style={{ backgroundColor: S.bg, borderColor: S.border }}>
                  <p className="text-xs" style={{ color: S.muted }}>মোট বিল</p>
                  <p className="text-lg font-bold" style={{ color: "#7C3AED" }}>৳{selectedAdm.totalBill.toLocaleString("bn-BD")}</p>
                </div>
                <div className="rounded-xl border p-3" style={{ backgroundColor: S.bg, borderColor: S.border }}>
                  <p className="text-xs" style={{ color: S.muted }}>বাকি</p>
                  <p className="text-lg font-bold" style={{ color: selectedAdm.dueAmount > 0 ? "#DC2626" : "#0F6E56" }}>৳{selectedAdm.dueAmount.toLocaleString("bn-BD")}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold" style={{ color: S.text }}>চার্জ</h3>
                  {selectedAdm.status === "admitted" && <button onClick={() => setShowChargeForm(true)} className="text-xs font-medium px-2 py-1 rounded-lg" style={{ backgroundColor: "#EFF6FF", color: ACC }}>+ চার্জ যোগ</button>}
                </div>
                {selectedAdm.charges.length === 0 ? <p className="text-xs" style={{ color: S.muted }}>কোনো চার্জ নেই</p> : (
                  <div className="space-y-1.5">
                    {selectedAdm.charges.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0" style={{ borderColor: S.border }}>
                        <div>
                          <span className="font-medium" style={{ color: S.text }}>{CHARGE_LABELS[c.chargeType] ?? c.chargeType}</span>
                          <span style={{ color: S.muted }}> · {c.description}</span>
                        </div>
                        <span className="font-semibold" style={{ color: S.text }}>৳{c.amount.toLocaleString("bn-BD")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold" style={{ color: S.text }}>প্রগতি নোট</h3>
                  {selectedAdm.status === "admitted" && <button onClick={() => setShowNoteForm(true)} className="text-xs font-medium px-2 py-1 rounded-lg" style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}>+ নোট যোগ</button>}
                </div>
                {selectedAdm.notes.length === 0 ? <p className="text-xs" style={{ color: S.muted }}>কোনো নোট নেই</p> : (
                  <div className="space-y-2">
                    {selectedAdm.notes.map((n) => (
                      <div key={n.id} className="rounded-xl border p-3" style={{ backgroundColor: S.bg, borderColor: S.border }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: n.noteType === "doctor" ? "#EFF6FF" : n.noteType === "nurse" ? "#E1F5EE" : S.border, color: n.noteType === "doctor" ? ACC : n.noteType === "nurse" ? "#0F6E56" : S.muted }}>
                            {n.noteType === "doctor" ? "ডাক্তার" : n.noteType === "nurse" ? "নার্স" : "সাধারণ"}
                          </span>
                          <span className="text-[11px]" style={{ color: S.muted }}>{new Date(n.writtenAt).toLocaleDateString("bn-BD")}</span>
                        </div>
                        <p className="text-xs" style={{ color: S.text }}>{n.note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedAdm.status === "admitted" && (
                <button onClick={() => setShowDischargeForm(true)} className="w-full py-2.5 rounded-xl font-semibold text-sm text-white" style={{ backgroundColor: "#0F6E56" }}>
                  ছাড়পত্র দিন
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showChargeForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold" style={{ color: S.text }}>চার্জ যোগ করুন</h3>
              <button onClick={() => setShowChargeForm(false)}><X size={16} style={{ color: S.muted }} /></button>
            </div>
            <select className={inp} value={chargeForm.chargeType} onChange={(e) => setChargeForm((f) => ({ ...f, chargeType: e.target.value }))} style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
              {CHARGE_TYPES.map((t) => <option key={t} value={t}>{CHARGE_LABELS[t]}</option>)}
            </select>
            <input className={inp} value={chargeForm.description} onChange={(e) => setChargeForm((f) => ({ ...f, description: e.target.value }))} placeholder="বিবরণ *" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
            <input className={inp} type="number" value={chargeForm.amount} onChange={(e) => setChargeForm((f) => ({ ...f, amount: e.target.value }))} placeholder="পরিমাণ (৳) *" min="0" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
            <button onClick={addCharge} disabled={submitting || !chargeForm.description || !chargeForm.amount} className="w-full py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-1" style={{ backgroundColor: ACC, opacity: submitting || !chargeForm.description || !chargeForm.amount ? 0.5 : 1 }}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : "যোগ করুন"}
            </button>
          </div>
        </div>
      )}

      {showNoteForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold" style={{ color: S.text }}>নোট যোগ করুন</h3>
              <button onClick={() => setShowNoteForm(false)}><X size={16} style={{ color: S.muted }} /></button>
            </div>
            <div className="flex gap-2">
              {[["doctor", "ডাক্তার"], ["nurse", "নার্স"], ["general", "সাধারণ"]].map(([val, label]) => (
                <button key={val} type="button" onClick={() => setNoteForm((f) => ({ ...f, noteType: val }))} className="flex-1 py-1.5 rounded-xl text-xs font-medium border" style={{ backgroundColor: noteForm.noteType === val ? ACC : S.surface, color: noteForm.noteType === val ? "#fff" : S.text, borderColor: noteForm.noteType === val ? ACC : S.border }}>{label}</button>
              ))}
            </div>
            <textarea className={inp} value={noteForm.note} onChange={(e) => setNoteForm((f) => ({ ...f, note: e.target.value }))} rows={3} placeholder="নোট লিখুন *" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface, resize: "none" }} />
            <button onClick={addNote} disabled={submitting || !noteForm.note} className="w-full py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-1" style={{ backgroundColor: "#0F6E56", opacity: submitting || !noteForm.note ? 0.5 : 1 }}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : "নোট সেভ করুন"}
            </button>
          </div>
        </div>
      )}

      {showDischargeForm && selectedAdm && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ backgroundColor: S.surface, maxHeight: "85vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: S.border }}>
              <h3 className="text-base font-bold" style={{ color: S.text }}>ছাড়পত্র দিন</h3>
              <button onClick={() => setShowDischargeForm(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <HospitalDisclaimer />
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>চূড়ান্ত রোগ নির্ণয়</label>
                <textarea className={inp} value={dischargeForm.finalDiagnosis} onChange={(e) => setDischargeForm((f) => ({ ...f, finalDiagnosis: e.target.value }))} rows={2} placeholder="চূড়ান্ত রোগ নির্ণয়" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface, resize: "none" }} />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="surgeryDone" checked={dischargeForm.surgeryDone} onChange={(e) => setDischargeForm((f) => ({ ...f, surgeryDone: e.target.checked }))} />
                <label htmlFor="surgeryDone" className="text-sm" style={{ color: S.text }}>অপারেশন হয়েছে</label>
              </div>
              {dischargeForm.surgeryDone && (
                <textarea className={inp} value={dischargeForm.surgeryNote} onChange={(e) => setDischargeForm((f) => ({ ...f, surgeryNote: e.target.value }))} rows={2} placeholder="অপারেশনের বিবরণ" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface, resize: "none" }} />
              )}
              <div className="rounded-xl border p-3 space-y-1" style={{ backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }}>
                <p className="text-xs" style={{ color: S.muted }}>মোট বিল: <strong style={{ color: S.text }}>৳{selectedAdm.totalBill.toLocaleString("bn-BD")}</strong></p>
                <p className="text-xs" style={{ color: S.muted }}>অগ্রিম দেওয়া: <strong style={{ color: S.text }}>৳{selectedAdm.advancePaid.toLocaleString("bn-BD")}</strong></p>
                <p className="text-xs" style={{ color: S.muted }}>বাকি: <strong style={{ color: "#DC2626" }}>৳{selectedAdm.dueAmount.toLocaleString("bn-BD")}</strong></p>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>চূড়ান্ত পেমেন্ট (৳)</label>
                <input className={inp} type="number" value={dischargeForm.finalPaid} onChange={(e) => setDischargeForm((f) => ({ ...f, finalPaid: e.target.value }))} min="0" placeholder="০" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
              </div>
              <button onClick={handleDischarge} disabled={submitting} className="w-full py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-1" style={{ backgroundColor: "#0F6E56" }}>
                {submitting ? <Loader2 size={14} className="animate-spin" /> : "ছাড়পত্র নিশ্চিত করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
