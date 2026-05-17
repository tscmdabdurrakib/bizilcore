"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Scale, Search, Plus, X, ChevronDown, AlertCircle, CheckCircle, Clock,
  Users, Calendar, DollarSign, FileText,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";
import DatePicker from "@/components/ui/DatePicker";

const CASE_TYPES = [
  { value: "civil",          label: "দেওয়ানী মামলা" },
  { value: "criminal",       label: "ফৌজদারী মামলা" },
  { value: "family",         label: "পারিবারিক মামলা" },
  { value: "property",       label: "সম্পত্তি বিরোধ" },
  { value: "labor",          label: "শ্রম মামলা" },
  { value: "business",       label: "বাণিজ্যিক মামলা" },
  { value: "constitutional", label: "সাংবিধানিক মামলা" },
  { value: "other",          label: "অন্যান্য" },
];

const COMMON_COURTS = [
  "জেলা জজ আদালত",
  "দায়রা জজ আদালত",
  "চিফ জুডিসিয়াল ম্যাজিস্ট্রেট আদালত",
  "হাইকোর্ট বিভাগ",
  "শ্রম আদালত",
  "পারিবারিক আদালত",
  "সিনিয়র জুডিসিয়াল ম্যাজিস্ট্রেট আদালত",
  "অন্যান্য",
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  active:            { label: "সক্রিয়",           bg: "#DCFCE7", color: "#166534", border: "#86EFAC" },
  hearing_pending:   { label: "শুনানি মুলতবি",      bg: "#DBEAFE", color: "#1E40AF", border: "#93C5FD" },
  judgement_pending: { label: "রায় মুলতবি",         bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" },
  decided:           { label: "সিদ্ধান্ত হয়েছে",   bg: "#F3E8FF", color: "#6B21A8", border: "#D8B4FE" },
  appealed:          { label: "আপিল করা হয়েছে",    bg: "#FEE2E2", color: "#991B1B", border: "#FCA5A5" },
  closed:            { label: "বন্ধ",               bg: "#F3F4F6", color: "#374151", border: "#D1D5DB" },
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  civil:          { bg: "#EFF6FF", color: "#1D4ED8" },
  criminal:       { bg: "#FEF2F2", color: "#DC2626" },
  family:         { bg: "#FDF2F8", color: "#DB2777" },
  property:       { bg: "#FFFBEB", color: "#D97706" },
  labor:          { bg: "#F0FDF4", color: "#16A34A" },
  business:       { bg: "#F5F3FF", color: "#7C3AED" },
  constitutional: { bg: "#ECFEFF", color: "#0891B2" },
  other:          { bg: "#F9FAFB", color: "#6B7280" },
};

type CaseItem = {
  id: string;
  caseNumber: string;
  title: string;
  caseType: string;
  court: string;
  status: string;
  nextHearing: string | null;
  dueFee: number;
  paidFee: number;
  totalFee: number;
  client: { id: string; name: string; phone: string };
  _count: { hearings: number; documents: number };
};

type Customer = { id: string; name: string; phone: string };

const STATUS_TABS = [
  { value: "all",              label: "সব" },
  { value: "active",           label: "সক্রিয়" },
  { value: "hearing_pending",  label: "শুনানি মুলতবি" },
  { value: "decided",          label: "সিদ্ধান্ত হয়েছে" },
  { value: "closed",           label: "বন্ধ" },
];

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  bg: "var(--c-bg)",
  primary: "#1D4ED8",
};

export default function CasesBoard() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [custSearch, setCustSearch] = useState("");
  const [courtInput, setCourtInput] = useState("");
  const [showCourtDropdown, setShowCourtDropdown] = useState(false);

  const [form, setForm] = useState({
    title: "", caseType: "civil", court: "", caseRef: "",
    filingDate: "", clientId: "", opposingParty: "",
    opposingLawyer: "", assignedTo: "", retainerFee: "", alreadyPaid: "", notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (q) params.set("q", q);
    const r = await fetch(`/api/legal/cases?${params}`);
    const d = await r.json();
    setCases(d.cases ?? []);
    setLoading(false);
  }, [statusFilter, q]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!showModal) return;
    fetch(`/api/customers?q=${custSearch}&limit=20`)
      .then(r => r.json())
      .then(d => setCustomers(d.customers ?? []));
  }, [showModal, custSearch]);

  const handleCourtSelect = (court: string) => {
    setForm(f => ({ ...f, court }));
    setCourtInput(court);
    setShowCourtDropdown(false);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.caseType || !form.court || !form.clientId) {
      alert("মামলার শিরোনাম, ধরন, আদালত এবং ক্লায়েন্ট আবশ্যক");
      return;
    }
    setSaving(true);
    await fetch("/api/legal/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, court: form.court || courtInput }),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ title: "", caseType: "civil", court: "", caseRef: "", filingDate: "", clientId: "", opposingParty: "", opposingLawyer: "", assignedTo: "", retainerFee: "", alreadyPaid: "", notes: "" });
    setCourtInput("");
    load();
  };

  const retainerNum = parseFloat(form.retainerFee) || 0;
  const paidNum = parseFloat(form.alreadyPaid) || 0;
  const dueCalc = Math.max(0, retainerNum - paidNum);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">

      {/* Confidentiality Notice */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium" style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}>
        <Scale size={13} />
        <span>এই তথ্য সম্পূর্ণ গোপনীয়। শুধুমাত্র আপনার জন্য সংরক্ষিত।</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>মামলা ব্যবস্থাপনা</h1>
          <p className="text-sm" style={{ color: S.muted }}>{cases.length}টি মামলা পাওয়া গেছে</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: S.primary }}
        >
          <Plus size={16} /> নতুন মামলা
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="মামলার নাম, ক্লায়েন্ট, আদালত রেফারেন্স…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.text }}
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setStatusFilter(t.value)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={statusFilter === t.value
              ? { background: S.primary, color: "#fff" }
              : { background: S.surface, color: S.muted, border: `1px solid ${S.border}` }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Cases List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : cases.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <Scale size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">কোনো মামলা পাওয়া যায়নি</p>
          <p className="text-sm mt-1">নতুন মামলা যোগ করুন</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {cases.map(c => {
            const st = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.active;
            const tc = TYPE_COLORS[c.caseType] ?? TYPE_COLORS.other;
            const typeMeta = CASE_TYPES.find(t => t.value === c.caseType);
            const soon = c.nextHearing && new Date(c.nextHearing) <= new Date(Date.now() + 3 * 86400000);
            return (
              <Link
                key={c.id}
                href={`/cases/${c.id}`}
                className="block p-4 rounded-2xl transition-shadow hover:shadow-md"
                style={{ background: S.surface, border: `1px solid ${S.border}` }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono font-bold" style={{ color: S.muted }}>{c.caseNumber}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: tc.bg, color: tc.color }}>
                        {typeMeta?.label ?? c.caseType}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm leading-snug" style={{ color: S.text }}>
                      {c.title.length > 60 ? c.title.slice(0, 60) + "…" : c.title}
                    </h3>
                  </div>
                  <span
                    className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
                  >
                    {st.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs mb-2" style={{ color: S.muted }}>
                  <span className="flex items-center gap-1"><Users size={11} /> {c.client.name}</span>
                  <span className="truncate">{c.court.length > 30 ? c.court.slice(0, 30) + "…" : c.court}</span>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3 text-xs" style={{ color: S.muted }}>
                    {c.nextHearing && (
                      <span
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full font-medium"
                        style={soon ? { background: "#FEF3C7", color: "#92400E" } : { background: S.bg, color: S.muted }}
                      >
                        <Calendar size={11} />
                        {new Date(c.nextHearing).toLocaleDateString("bn-BD", { day: "numeric", month: "short" })}
                        {soon && " (শীঘ্রই)"}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <FileText size={11} /> {c._count.hearings}টি শুনানি
                    </span>
                  </div>
                  {c.dueFee > 0 && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEF2F2", color: "#DC2626" }}>
                      <DollarSign size={11} /> {formatBDT(c.dueFee)} বাকি
                    </span>
                  )}
                  {c.dueFee === 0 && c.totalFee > 0 && (
                    <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#DCFCE7", color: "#166534" }}>
                      <CheckCircle size={11} /> পরিশোধিত
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* New Case Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto" style={{ background: S.surface }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: S.border }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: S.text }}>নতুন মামলা রেজিস্ট্রেশন</h2>
                <p className="text-xs mt-0.5" style={{ color: S.muted }}>স্বয়ংক্রিয় CASE-YYYY-NNN নম্বর তৈরি হবে</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ color: S.muted }}><X size={20} /></button>
            </div>

            <div className="p-5 space-y-5">

              {/* Case Info */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: S.text }}>মামলার তথ্য</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>মামলার শিরোনাম *</label>
                    <input
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="যেমন: বাদী vs প্রতিবাদী সম্পত্তি বিরোধ"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>মামলার ধরন *</label>
                      <select
                        value={form.caseType}
                        onChange={e => setForm(f => ({ ...f, caseType: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }}
                      >
                        {CASE_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>দায়ের তারিখ</label>
                      <DatePicker
  value={form.filingDate}
  onChange={v => setForm(f => ({ ...f, filingDate: v }))}
  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
  style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }}
/>
                    </div>
                  </div>

                  {/* Court with Dropdown */}
                  <div className="relative">
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>আদালত *</label>
                    <div className="relative">
                      <input
                        value={courtInput}
                        onChange={e => { setCourtInput(e.target.value); setForm(f => ({ ...f, court: e.target.value })); setShowCourtDropdown(true); }}
                        onFocus={() => setShowCourtDropdown(true)}
                        placeholder="আদালত নির্বাচন করুন বা টাইপ করুন"
                        className="w-full pl-3 pr-8 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }}
                      />
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
                    </div>
                    {showCourtDropdown && (
                      <div
                        className="absolute z-10 w-full mt-1 rounded-xl shadow-lg py-1"
                        style={{ background: S.surface, border: `1px solid ${S.border}` }}
                        onMouseLeave={() => setShowCourtDropdown(false)}
                      >
                        {COMMON_COURTS.filter(c => c.toLowerCase().includes(courtInput.toLowerCase())).map(court => (
                          <button
                            key={court}
                            onMouseDown={() => handleCourtSelect(court)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors"
                            style={{ color: S.text }}
                          >
                            {court}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>আদালতের কেস রেফারেন্স (ঐচ্ছিক)</label>
                    <input
                      value={form.caseRef}
                      onChange={e => setForm(f => ({ ...f, caseRef: e.target.value }))}
                      placeholder="সরকারি কেস নম্বর"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }}
                    />
                  </div>
                </div>
              </div>

              {/* Parties */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: S.text }}>পক্ষসমূহ</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ক্লায়েন্ট *</label>
                    <input
                      placeholder="ক্লায়েন্ট খুঁজুন…"
                      value={custSearch}
                      onChange={e => setCustSearch(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none mb-2"
                      style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }}
                    />
                    <div className="max-h-32 overflow-y-auto rounded-xl" style={{ border: `1px solid ${S.border}` }}>
                      {customers.map(cu => (
                        <button
                          key={cu.id}
                          onClick={() => { setForm(f => ({ ...f, clientId: cu.id })); setCustSearch(cu.name); }}
                          className="w-full text-left px-3 py-2 text-sm transition-colors"
                          style={{
                            background: form.clientId === cu.id ? "#EFF6FF" : "transparent",
                            color: form.clientId === cu.id ? "#1D4ED8" : S.text,
                          }}
                        >
                          {cu.name} {cu.phone && `• ${cu.phone}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>প্রতিপক্ষ (ঐচ্ছিক)</label>
                      <input
                        value={form.opposingParty}
                        onChange={e => setForm(f => ({ ...f, opposingParty: e.target.value }))}
                        placeholder="প্রতিপক্ষের নাম"
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>বিপক্ষ আইনজীবী (ঐচ্ছিক)</label>
                      <input
                        value={form.opposingLawyer}
                        onChange={e => setForm(f => ({ ...f, opposingLawyer: e.target.value }))}
                        placeholder="বিপক্ষ আইনজীবীর নাম"
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>দায়িত্বপ্রাপ্ত আইনজীবী (ঐচ্ছিক)</label>
                    <input
                      value={form.assignedTo}
                      onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                      placeholder="যদি ফার্ম হয়, কোন আইনজীবী দেখবেন"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }}
                    />
                  </div>
                </div>
              </div>

              {/* Fee Setup */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: S.text }}>ফি নির্ধারণ</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>রিটেইনার ফি (মোট)</label>
                    <input
                      type="number"
                      value={form.retainerFee}
                      onChange={e => setForm(f => ({ ...f, retainerFee: e.target.value }))}
                      placeholder="০"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ইতিমধ্যে পরিশোধিত</label>
                    <input
                      type="number"
                      value={form.alreadyPaid}
                      onChange={e => setForm(f => ({ ...f, alreadyPaid: e.target.value }))}
                      placeholder="০"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }}
                    />
                  </div>
                </div>
                {retainerNum > 0 && (
                  <div className="mt-2 p-3 rounded-xl flex items-center justify-between" style={{ background: dueCalc > 0 ? "#FEF2F2" : "#F0FDF4" }}>
                    <span className="text-sm font-medium" style={{ color: dueCalc > 0 ? "#DC2626" : "#166534" }}>
                      বাকি ফি: {formatBDT(dueCalc)}
                    </span>
                    {dueCalc === 0 && <CheckCircle size={16} style={{ color: "#16A34A" }} />}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>নোট (ঐচ্ছিক)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="অতিরিক্ত তথ্য…"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: S.bg, border: `1px solid ${S.border}`, color: S.text }}
                />
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t" style={{ borderColor: S.border }}>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: S.bg, color: S.muted, border: `1px solid ${S.border}` }}
              >
                বাতিল
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: S.primary }}
              >
                {saving ? "সেভ হচ্ছে…" : "মামলা রেজিস্ট্রেশন করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
