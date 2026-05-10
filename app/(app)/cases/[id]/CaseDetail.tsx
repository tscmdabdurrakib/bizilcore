"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Scale, Users, Calendar, FileText, DollarSign,
  Plus, X, CheckCircle, Clock, AlertCircle, Edit2, Save,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";

const CASE_TYPES = [
  { value: "civil", label: "দেওয়ানী" },
  { value: "criminal", label: "ফৌজদারী" },
  { value: "family", label: "পারিবারিক" },
  { value: "property", label: "সম্পত্তি" },
  { value: "labor", label: "শ্রম" },
  { value: "business", label: "বাণিজ্যিক" },
  { value: "constitutional", label: "সাংবিধানিক" },
  { value: "other", label: "অন্যান্য" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "সক্রিয়" },
  { value: "hearing_pending", label: "শুনানি মুলতবি" },
  { value: "judgement_pending", label: "রায় মুলতবি" },
  { value: "decided", label: "সিদ্ধান্ত হয়েছে" },
  { value: "appealed", label: "আপিল করা হয়েছে" },
  { value: "closed", label: "বন্ধ" },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  active:            { label: "সক্রিয়",         bg: "#DCFCE7", color: "#166534" },
  hearing_pending:   { label: "শুনানি মুলতবি",    bg: "#DBEAFE", color: "#1E40AF" },
  judgement_pending: { label: "রায় মুলতবি",       bg: "#FEF3C7", color: "#92400E" },
  decided:           { label: "সিদ্ধান্ত হয়েছে", bg: "#F3E8FF", color: "#6B21A8" },
  appealed:          { label: "আপিল",             bg: "#FEE2E2", color: "#991B1B" },
  closed:            { label: "বন্ধ",             bg: "#F3F4F6", color: "#374151" },
};

const HEARING_PURPOSES = [
  { value: "argument",    label: "যুক্তিতর্ক" },
  { value: "witness",     label: "সাক্ষ্য" },
  { value: "judgement",   label: "রায়" },
  { value: "adjournment", label: "মুলতবি" },
  { value: "order",       label: "আদেশ" },
];

const DOC_TYPES = [
  { value: "petition",  label: "আর্জি" },
  { value: "counter",   label: "কাউন্টার" },
  { value: "deed",      label: "দলিল" },
  { value: "affidavit", label: "এফিডেভিট" },
  { value: "order",     label: "আদেশনামা" },
  { value: "other",     label: "অন্যান্য" },
];

const FEE_TYPES = [
  { value: "retainer",   label: "রিটেইনার" },
  { value: "appearance", label: "হাজিরা ফি" },
  { value: "filing",     label: "ফাইলিং ফি" },
  { value: "other",      label: "অন্যান্য" },
];

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  bg: "var(--c-bg)",
  primary: "#1D4ED8",
};

type Hearing = {
  id: string;
  hearingDate: string;
  court: string | null;
  purpose: string | null;
  outcome: string | null;
  attended: boolean;
  nextDate: string | null;
  appearanceFee: number;
  note: string | null;
};

type Document = {
  id: string;
  docName: string;
  docType: string;
  fileUrl: string | null;
  submittedAt: string | null;
  note: string | null;
  addedAt: string;
};

type Payment = {
  id: string;
  amount: number;
  feeType: string;
  method: string | null;
  note: string | null;
  paidAt: string;
};

type LegalCase = {
  id: string;
  caseNumber: string;
  title: string;
  caseType: string;
  court: string;
  caseRef: string | null;
  filingDate: string | null;
  opposingParty: string | null;
  opposingLawyer: string | null;
  assignedTo: string | null;
  status: string;
  verdict: string | null;
  verdictDate: string | null;
  totalFee: number;
  retainerFee: number;
  paidFee: number;
  dueFee: number;
  nextHearing: string | null;
  notes: string | null;
  client: { id: string; name: string; phone: string; address: string | null };
  hearings: Hearing[];
  documents: Document[];
  payments: Payment[];
};

export default function CaseDetail({ id }: { id: string }) {
  const [legalCase, setLegalCase] = useState<LegalCase | null>(null);
  const [tab, setTab] = useState<"hearings" | "documents" | "fees">("hearings");
  const [saving, setSaving] = useState(false);

  const [showHearingModal, setShowHearingModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);

  const [hearingForm, setHearingForm] = useState({
    hearingDate: "", purpose: "argument", outcome: "",
    attended: false, nextDate: "", appearanceFee: "", note: "",
  });
  const [docForm, setDocForm] = useState({
    docName: "", docType: "petition", submittedAt: "", note: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: "", feeType: "appearance", method: "cash", note: "",
  });
  const [newStatus, setNewStatus] = useState("");

  const load = useCallback(async () => {
    const r = await fetch(`/api/legal/cases/${id}`);
    const d = await r.json();
    if (d.case) {
      setLegalCase(d.case);
      setNewStatus(d.case.status);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const addHearing = async () => {
    if (!hearingForm.hearingDate) return;
    setSaving(true);
    await fetch(`/api/legal/cases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_hearing", ...hearingForm }),
    });
    setSaving(false);
    setShowHearingModal(false);
    setHearingForm({ hearingDate: "", purpose: "argument", outcome: "", attended: false, nextDate: "", appearanceFee: "", note: "" });
    load();
  };

  const addDocument = async () => {
    if (!docForm.docName) return;
    setSaving(true);
    await fetch(`/api/legal/cases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_document", ...docForm }),
    });
    setSaving(false);
    setShowDocModal(false);
    setDocForm({ docName: "", docType: "petition", submittedAt: "", note: "" });
    load();
  };

  const addPayment = async () => {
    if (!paymentForm.amount) return;
    setSaving(true);
    await fetch(`/api/legal/cases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_payment", ...paymentForm }),
    });
    setSaving(false);
    setShowPaymentModal(false);
    setPaymentForm({ amount: "", feeType: "appearance", method: "cash", note: "" });
    load();
  };

  const updateStatus = async () => {
    setSaving(true);
    await fetch(`/api/legal/cases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setSaving(false);
    setEditingStatus(false);
    load();
  };

  const markAttended = async (hearingId: string) => {
    await fetch(`/api/legal/cases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_attended", hearingId }),
    });
    load();
  };

  if (!legalCase) return (
    <div className="flex justify-center items-center py-16">
      <div className="w-7 h-7 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  const st = STATUS_CONFIG[legalCase.status] ?? STATUS_CONFIG.active;
  const typeMeta = CASE_TYPES.find(t => t.value === legalCase.caseType);
  const paidPct = legalCase.totalFee > 0 ? Math.min(100, Math.round((legalCase.paidFee / legalCase.totalFee) * 100)) : 0;

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-6">

      {/* Confidentiality Notice */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium" style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}>
        <Scale size={13} />
        <span>এই তথ্য সম্পূর্ণ গোপনীয়। শুধুমাত্র আপনার জন্য সংরক্ষিত।</span>
      </div>

      {/* Back & Header */}
      <div className="flex items-center gap-3">
        <Link href="/cases" className="p-2 rounded-xl transition-colors hover:bg-blue-50" style={{ color: S.muted }}>
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold" style={{ color: S.muted }}>{legalCase.caseNumber}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
              {typeMeta?.label ?? legalCase.caseType}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.color }}>
              {st.label}
            </span>
          </div>
          <h1 className="text-lg font-bold mt-0.5" style={{ color: S.text }}>{legalCase.title}</h1>
        </div>
        {!editingStatus ? (
          <button
            onClick={() => setEditingStatus(true)}
            className="p-2 rounded-xl"
            style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.muted }}
          >
            <Edit2 size={15} />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs outline-none"
              style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }}
            >
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              onClick={updateStatus}
              disabled={saving}
              className="p-2 rounded-xl"
              style={{ background: S.primary, color: "#fff" }}
            >
              <Save size={14} />
            </button>
            <button onClick={() => setEditingStatus(false)} style={{ color: S.muted }}><X size={16} /></button>
          </div>
        )}
      </div>

      {/* Case Summary Card */}
      <div className="rounded-2xl p-5" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: S.muted }}>আদালত</p>
              <p className="text-sm font-semibold" style={{ color: S.text }}>{legalCase.court}</p>
              {legalCase.caseRef && <p className="text-xs mt-0.5" style={{ color: S.muted }}>রেফ: {legalCase.caseRef}</p>}
            </div>
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: S.muted }}>ক্লায়েন্ট</p>
              <Link href={`/customers/${legalCase.client.id}`} className="text-sm font-semibold hover:underline" style={{ color: S.primary }}>
                {legalCase.client.name}
              </Link>
              {legalCase.client.phone && <p className="text-xs mt-0.5" style={{ color: S.muted }}>{legalCase.client.phone}</p>}
            </div>
            {legalCase.opposingParty && (
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: S.muted }}>প্রতিপক্ষ</p>
                <p className="text-sm" style={{ color: S.text }}>{legalCase.opposingParty}</p>
                {legalCase.opposingLawyer && <p className="text-xs mt-0.5" style={{ color: S.muted }}>আইনজীবী: {legalCase.opposingLawyer}</p>}
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: S.muted }}>দায়ের তারিখ</p>
              <p className="text-sm" style={{ color: S.text }}>
                {legalCase.filingDate
                  ? new Date(legalCase.filingDate).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" })
                  : "—"}
              </p>
            </div>
            {legalCase.nextHearing && (
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: S.muted }}>পরবর্তী শুনানি</p>
                <p className="text-sm font-semibold" style={{ color: "#D97706" }}>
                  <Calendar size={12} className="inline mr-1" />
                  {new Date(legalCase.nextHearing).toLocaleDateString("bn-BD", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
            )}
            {legalCase.assignedTo && (
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: S.muted }}>দায়িত্বপ্রাপ্ত</p>
                <p className="text-sm" style={{ color: S.text }}>{legalCase.assignedTo}</p>
              </div>
            )}
          </div>
        </div>

        {/* Fee Progress */}
        {legalCase.totalFee > 0 && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: S.border }}>
            <div className="flex items-center justify-between text-xs mb-2">
              <span style={{ color: S.muted }}>ফি অগ্রগতি</span>
              <span className="font-semibold" style={{ color: S.text }}>
                {formatBDT(legalCase.paidFee)} / {formatBDT(legalCase.totalFee)}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: S.bg }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${paidPct}%`,
                  background: paidPct === 100 ? "#16A34A" : paidPct > 50 ? "#1D4ED8" : "#DC2626",
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs mt-1.5">
              <span style={{ color: S.muted }}>{paidPct}% পরিশোধিত</span>
              {legalCase.dueFee > 0 && (
                <span className="font-medium" style={{ color: "#DC2626" }}>{formatBDT(legalCase.dueFee)} বাকি</span>
              )}
              {legalCase.dueFee === 0 && (
                <span className="flex items-center gap-1 font-medium" style={{ color: "#166534" }}>
                  <CheckCircle size={11} /> সম্পূর্ণ পরিশোধিত
                </span>
              )}
            </div>
          </div>
        )}

        {legalCase.notes && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: S.border }}>
            <p className="text-xs font-medium mb-1" style={{ color: S.muted }}>নোট</p>
            <p className="text-sm" style={{ color: S.text }}>{legalCase.notes}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
        {[
          { key: "hearings" as const, label: `শুনানির ইতিহাস (${legalCase.hearings.length})`, icon: Calendar },
          { key: "documents" as const, label: `ডকুমেন্ট (${legalCase.documents.length})`, icon: FileText },
          { key: "fees" as const, label: `ফি ও পেমেন্ট (${legalCase.payments.length})`, icon: DollarSign },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={tab === t.key
              ? { background: S.primary, color: "#fff" }
              : { color: S.muted }
            }
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Hearings Tab */}
      {tab === "hearings" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setShowHearingModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: S.primary }}
            >
              <Plus size={14} /> নতুন শুনানি
            </button>
          </div>

          {legalCase.hearings.length === 0 ? (
            <div className="text-center py-10" style={{ color: S.muted }}>
              <Calendar size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">কোনো শুনানি নেই। যোগ করুন।</p>
            </div>
          ) : (
            <div className="space-y-3">
              {legalCase.hearings.map(h => {
                const purposeMeta = HEARING_PURPOSES.find(p => p.value === h.purpose);
                return (
                  <div
                    key={h.id}
                    className="p-4 rounded-2xl"
                    style={{ background: S.surface, border: `1px solid ${S.border}` }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: S.text }}>
                          {new Date(h.hearingDate).toLocaleDateString("bn-BD", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {h.purpose && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
                              {purposeMeta?.label ?? h.purpose}
                            </span>
                          )}
                          {h.court && <span className="text-xs" style={{ color: S.muted }}>{h.court}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {h.appearanceFee > 0 && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#F5F3FF", color: "#7C3AED" }}>
                            {formatBDT(h.appearanceFee)}
                          </span>
                        )}
                        {h.attended ? (
                          <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg" style={{ background: "#DCFCE7", color: "#166534" }}>
                            <CheckCircle size={11} /> উপস্থিত
                          </span>
                        ) : (
                          <button
                            onClick={() => markAttended(h.id)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                            style={{ background: S.primary }}
                          >
                            উপস্থিত হয়েছি
                          </button>
                        )}
                      </div>
                    </div>
                    {h.outcome && (
                      <div className="mt-2 p-2.5 rounded-xl" style={{ background: S.bg }}>
                        <p className="text-xs font-medium mb-0.5" style={{ color: S.muted }}>ফলাফল</p>
                        <p className="text-sm" style={{ color: S.text }}>{h.outcome}</p>
                      </div>
                    )}
                    {h.nextDate && (
                      <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "#D97706" }}>
                        <Calendar size={11} />
                        পরবর্তী তারিখ: {new Date(h.nextDate).toLocaleDateString("bn-BD", { day: "numeric", month: "long" })}
                      </p>
                    )}
                    {h.note && <p className="text-xs mt-1.5" style={{ color: S.muted }}>{h.note}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {tab === "documents" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setShowDocModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: S.primary }}
            >
              <Plus size={14} /> Document যোগ করুন
            </button>
          </div>
          {legalCase.documents.length === 0 ? (
            <div className="text-center py-10" style={{ color: S.muted }}>
              <FileText size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">কোনো ডকুমেন্ট নেই।</p>
            </div>
          ) : (
            <div className="space-y-2">
              {legalCase.documents.map(doc => {
                const typeMeta = DOC_TYPES.find(t => t.value === doc.docType);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: S.surface, border: `1px solid ${S.border}` }}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#EFF6FF" }}>
                      <FileText size={16} style={{ color: "#1D4ED8" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: S.text }}>{doc.docName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
                          {typeMeta?.label ?? doc.docType}
                        </span>
                        {doc.submittedAt && (
                          <span className="text-xs" style={{ color: S.muted }}>
                            জমা: {new Date(doc.submittedAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </div>
                      {doc.note && <p className="text-xs mt-0.5" style={{ color: S.muted }}>{doc.note}</p>}
                    </div>
                    {doc.fileUrl && (
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium px-2 py-1 rounded-lg" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
                        দেখুন
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Fees Tab */}
      {tab === "fees" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div>
                <p className="text-xs" style={{ color: S.muted }}>মোট</p>
                <p className="font-bold" style={{ color: S.text }}>{formatBDT(legalCase.totalFee)}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: S.muted }}>পরিশোধিত</p>
                <p className="font-bold" style={{ color: "#16A34A" }}>{formatBDT(legalCase.paidFee)}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: S.muted }}>বাকি</p>
                <p className="font-bold" style={{ color: legalCase.dueFee > 0 ? "#DC2626" : "#16A34A" }}>
                  {formatBDT(legalCase.dueFee)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: S.primary }}
            >
              <Plus size={14} /> পেমেন্ট নিন
            </button>
          </div>

          {legalCase.payments.length === 0 ? (
            <div className="text-center py-10" style={{ color: S.muted }}>
              <DollarSign size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">কোনো পেমেন্ট নেই।</p>
            </div>
          ) : (
            <div className="space-y-2">
              {legalCase.payments.map(p => {
                const typeMeta = FEE_TYPES.find(f => f.value === p.feeType);
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: S.surface, border: `1px solid ${S.border}` }}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#F0FDF4" }}>
                      <DollarSign size={15} style={{ color: "#16A34A" }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: S.text }}>{formatBDT(p.amount)}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: S.muted }}>
                        <span>{typeMeta?.label ?? p.feeType}</span>
                        {p.method && <span>• {p.method}</span>}
                        <span>• {new Date(p.paidAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short" })}</span>
                      </div>
                      {p.note && <p className="text-xs mt-0.5" style={{ color: S.muted }}>{p.note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Hearing Modal */}
      {showHearingModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl" style={{ background: S.surface }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: S.border }}>
              <h2 className="font-bold" style={{ color: S.text }}>নতুন শুনানি যোগ করুন</h2>
              <button onClick={() => setShowHearingModal(false)} style={{ color: S.muted }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>শুনানির তারিখ *</label>
                <input type="date" value={hearingForm.hearingDate} onChange={e => setHearingForm(f => ({ ...f, hearingDate: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>উদ্দেশ্য</label>
                <select value={hearingForm.purpose} onChange={e => setHearingForm(f => ({ ...f, purpose: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }}>
                  {HEARING_PURPOSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ফলাফল (কী হলো)</label>
                <textarea value={hearingForm.outcome} onChange={e => setHearingForm(f => ({ ...f, outcome: e.target.value }))}
                  rows={2} placeholder="এই শুনানিতে কী হয়েছিল…"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পরবর্তী তারিখ</label>
                  <input type="date" value={hearingForm.nextDate} onChange={e => setHearingForm(f => ({ ...f, nextDate: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>হাজিরা ফি</label>
                  <input type="number" value={hearingForm.appearanceFee} onChange={e => setHearingForm(f => ({ ...f, appearanceFee: e.target.value }))}
                    placeholder="০" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: S.text }}>
                  <input type="checkbox" checked={hearingForm.attended} onChange={e => setHearingForm(f => ({ ...f, attended: e.target.checked }))}
                    className="rounded" />
                  আজ উপস্থিত হয়েছি
                </label>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t" style={{ borderColor: S.border }}>
              <button onClick={() => setShowHearingModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: S.bg, color: S.muted, border: `1px solid ${S.border}` }}>বাতিল</button>
              <button onClick={addHearing} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: S.primary }}>{saving ? "সেভ হচ্ছে…" : "সেভ করুন"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Document Modal */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl" style={{ background: S.surface }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: S.border }}>
              <h2 className="font-bold" style={{ color: S.text }}>Document যোগ করুন</h2>
              <button onClick={() => setShowDocModal(false)} style={{ color: S.muted }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>Document নাম *</label>
                <input value={docForm.docName} onChange={e => setDocForm(f => ({ ...f, docName: e.target.value }))}
                  placeholder="যেমন: আর্জি, দলিল, এফিডেভিট…"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ধরন</label>
                  <select value={docForm.docType} onChange={e => setDocForm(f => ({ ...f, docType: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }}>
                    {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>জমার তারিখ</label>
                  <input type="date" value={docForm.submittedAt} onChange={e => setDocForm(f => ({ ...f, submittedAt: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>নোট</label>
                <input value={docForm.note} onChange={e => setDocForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="অতিরিক্ত তথ্য…"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }} />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t" style={{ borderColor: S.border }}>
              <button onClick={() => setShowDocModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: S.bg, color: S.muted, border: `1px solid ${S.border}` }}>বাতিল</button>
              <button onClick={addDocument} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: S.primary }}>{saving ? "সেভ হচ্ছে…" : "যোগ করুন"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl" style={{ background: S.surface }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: S.border }}>
              <div>
                <h2 className="font-bold" style={{ color: S.text }}>পেমেন্ট নিন</h2>
                <p className="text-xs mt-0.5" style={{ color: S.muted }}>বাকি: {formatBDT(legalCase.dueFee)}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} style={{ color: S.muted }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পরিমাণ *</label>
                <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="০" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ফির ধরন</label>
                  <select value={paymentForm.feeType} onChange={e => setPaymentForm(f => ({ ...f, feeType: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }}>
                    {FEE_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পদ্ধতি</label>
                  <select value={paymentForm.method} onChange={e => setPaymentForm(f => ({ ...f, method: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }}>
                    <option value="cash">নগদ</option>
                    <option value="bkash">বিকাশ</option>
                    <option value="nagad">নগদ (MFS)</option>
                    <option value="bank">ব্যাংক</option>
                    <option value="other">অন্যান্য</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>নোট</label>
                <input value={paymentForm.note} onChange={e => setPaymentForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="পেমেন্ট সংক্রান্ত তথ্য…"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }} />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t" style={{ borderColor: S.border }}>
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: S.bg, color: S.muted, border: `1px solid ${S.border}` }}>বাতিল</button>
              <button onClick={addPayment} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: S.primary }}>{saving ? "সেভ হচ্ছে…" : "পেমেন্ট সেভ করুন"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
