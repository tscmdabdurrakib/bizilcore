"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Users, Search, X, Loader2, ChevronRight, Plus } from "lucide-react";
import HospitalDisclaimer from "@/components/hospital/HospitalDisclaimer";
import Link from "next/link";

interface Patient {
  id: string; regNumber: string; name: string; nameBangla?: string | null;
  phone?: string | null; age?: number | null; ageUnit?: string | null;
  gender?: string | null; bloodGroup?: string | null; address?: string | null;
  allergies?: string | null; chronicIllness?: string | null;
  createdAt: string;
  _count: { visits: number; admissions: number };
}

interface PatientDetail extends Patient {
  visits: {
    id: string; visitNumber: string; visitDate: string; visitType: string; status: string;
    diagnosis?: string | null; prescription?: string | null; visitFee: number; paidAmount: number; dueAmount: number;
    doctor: { name: string; title: string; specialization: string };
    tests: { id: string; testName: string }[];
  }[];
  admissions: {
    id: string; admissionNumber: string; admitDate: string; dischargeDate?: string | null;
    ward: string; bedNumber: string; status: string; totalBill: number; advancePaid: number;
    doctor: { name: string; title: string };
  }[];
}

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", bg: "var(--c-bg)" };
const ACC = "#378ADD";

export default function PatientsBoard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PatientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"opd" | "ipd">("opd");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/hospital/patients?search=${search}`);
    if (res.ok) setPatients(await res.json());
    setLoading(false);
  }, [search]);

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(load, 300);
    return () => clearTimeout(timeoutRef.current);
  }, [load]);

  async function openDetail(id: string) {
    setDetailLoading(true);
    const res = await fetch(`/api/hospital/patients/${id}`);
    if (res.ok) { setSelected(await res.json()); setActiveTab("opd"); }
    setDetailLoading(false);
  }

  const inp = "w-full px-3 py-2 rounded-xl border text-sm outline-none";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <HospitalDisclaimer />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={20} style={{ color: ACC }} />
          <h1 className="text-lg font-bold" style={{ color: S.text }}>রোগীর তালিকা</h1>
        </div>
        <Link href="/hospital/opd?new=1" className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: ACC }}>
          <Plus size={15} /> নতুন ভিজিট
        </Link>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
        <input className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="নাম, ফোন বা রেজিস্ট্রেশন নম্বর দিয়ে খুঁজুন" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: ACC }} /></div>
      ) : patients.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <Users size={28} className="mx-auto mb-3" style={{ color: S.muted }} />
          <p className="text-sm" style={{ color: S.muted }}>{search ? "কোনো রোগী পাওয়া যায়নি" : "কোনো রোগী নেই"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {patients.map((p) => (
            <div key={p.id} className="rounded-2xl border p-4 flex items-center justify-between cursor-pointer hover:shadow-sm transition-shadow" style={{ backgroundColor: S.surface, borderColor: S.border }} onClick={() => openDetail(p.id)}>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold" style={{ color: S.text }}>{p.name}</p>
                  {p.nameBangla && <p className="text-xs" style={{ color: S.muted }}>{p.nameBangla}</p>}
                </div>
                <p className="text-xs mt-0.5" style={{ color: S.muted }}>
                  {p.regNumber}
                  {p.phone ? ` · ${p.phone}` : ""}
                  {p.age ? ` · ${p.age} ${p.ageUnit === "years" ? "বছর" : p.ageUnit === "months" ? "মাস" : "দিন"}` : ""}
                  {p.gender ? ` · ${p.gender === "male" ? "পুরুষ" : p.gender === "female" ? "মহিলা" : "অন্যান্য"}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[11px]" style={{ color: S.muted }}>OPD: {p._count.visits} · IPD: {p._count.admissions}</p>
                </div>
                <ChevronRight size={14} style={{ color: S.muted }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {(selected || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-2xl rounded-2xl shadow-2xl" style={{ backgroundColor: S.surface, maxHeight: "92vh", overflowY: "auto" }}>
            {detailLoading ? (
              <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: ACC }} /></div>
            ) : selected ? (
              <>
                <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: S.border }}>
                  <div>
                    <p className="text-base font-bold" style={{ color: S.text }}>{selected.name}</p>
                    <p className="text-xs" style={{ color: S.muted }}>{selected.regNumber}{selected.phone ? ` · ${selected.phone}` : ""}</p>
                  </div>
                  <button onClick={() => setSelected(null)}><X size={18} style={{ color: S.muted }} /></button>
                </div>
                <HospitalDisclaimer />
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {selected.age && <div className="rounded-xl border p-2" style={{ borderColor: S.border }}><p style={{ color: S.muted }}>বয়স</p><p className="font-semibold" style={{ color: S.text }}>{selected.age} {selected.ageUnit === "years" ? "বছর" : selected.ageUnit === "months" ? "মাস" : "দিন"}</p></div>}
                    {selected.gender && <div className="rounded-xl border p-2" style={{ borderColor: S.border }}><p style={{ color: S.muted }}>লিঙ্গ</p><p className="font-semibold" style={{ color: S.text }}>{selected.gender === "male" ? "পুরুষ" : selected.gender === "female" ? "মহিলা" : "অন্যান্য"}</p></div>}
                    {selected.bloodGroup && <div className="rounded-xl border p-2" style={{ borderColor: S.border }}><p style={{ color: S.muted }}>রক্তের গ্রুপ</p><p className="font-semibold" style={{ color: S.text }}>{selected.bloodGroup}</p></div>}
                    {selected.allergies && <div className="rounded-xl border p-2" style={{ borderColor: S.border }}><p style={{ color: S.muted }}>অ্যালার্জি</p><p className="font-semibold" style={{ color: S.text }}>{selected.allergies}</p></div>}
                  </div>

                  <div className="flex gap-2">
                    {(["opd", "ipd"] as const).map((tab) => (
                      <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 rounded-xl text-xs font-semibold border" style={{ backgroundColor: activeTab === tab ? ACC : S.surface, color: activeTab === tab ? "#fff" : S.text, borderColor: activeTab === tab ? ACC : S.border }}>
                        {tab === "opd" ? `OPD (${selected.visits.length})` : `IPD (${selected.admissions.length})`}
                      </button>
                    ))}
                  </div>

                  {activeTab === "opd" && (
                    <div className="space-y-2">
                      {selected.visits.length === 0 ? <p className="text-xs" style={{ color: S.muted }}>কোনো OPD ভিজিট নেই</p> : selected.visits.map((v) => (
                        <div key={v.id} className="rounded-xl border p-3" style={{ backgroundColor: S.bg, borderColor: S.border }}>
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold" style={{ color: S.text }}>{v.visitNumber} · {new Date(v.visitDate).toLocaleDateString("bn-BD")}</p>
                            <p className="text-xs font-semibold" style={{ color: ACC }}>৳{v.visitFee}</p>
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: S.muted }}>ডাক্তার: {v.doctor.title} {v.doctor.name}</p>
                          {v.diagnosis && <p className="text-xs mt-1" style={{ color: S.text }}>রোগ নির্ণয়: {v.diagnosis}</p>}
                          {v.prescription && <p className="text-xs" style={{ color: S.muted }}>প্রেসক্রিপশন: {v.prescription}</p>}
                          {v.tests.length > 0 && <p className="text-xs mt-0.5" style={{ color: S.muted }}>পরীক্ষা: {v.tests.map((t) => t.testName).join(", ")}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === "ipd" && (
                    <div className="space-y-2">
                      {selected.admissions.length === 0 ? <p className="text-xs" style={{ color: S.muted }}>কোনো IPD ভর্তি নেই</p> : selected.admissions.map((a) => (
                        <div key={a.id} className="rounded-xl border p-3" style={{ backgroundColor: S.bg, borderColor: S.border }}>
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold" style={{ color: S.text }}>{a.admissionNumber}</p>
                            <p className="text-xs font-semibold" style={{ color: "#7C3AED" }}>৳{a.totalBill.toLocaleString("bn-BD")}</p>
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: S.muted }}>{a.ward} · বেড {a.bedNumber} · {new Date(a.admitDate).toLocaleDateString("bn-BD")}</p>
                          <p className="text-xs" style={{ color: S.muted }}>ডাক্তার: {a.doctor.title} {a.doctor.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
