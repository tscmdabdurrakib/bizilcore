"use client";

import { useEffect, useState } from "react";
import { Stamp, Plus, X, Loader2, AlertTriangle, CheckCircle, Clock, XCircle, Search } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import DatePicker from "@/components/ui/DatePicker";

interface VisaRequest {
  id: string;
  visaNumber: string;
  applicantName: string;
  applicantPhone: string;
  passportNumber: string;
  passportExpiry: string;
  country: string;
  visaType: string;
  applicationDate: string;
  status: string;
  serviceCharge: number;
  paidAmount: number;
  documents: string[];
  notes?: string;
}

const STATUS_FILTERS = [
  { key: "all",              label: "সব" },
  { key: "collecting_docs",  label: "Docs সংগ্রহ" },
  { key: "submitted",        label: "Submitted" },
  { key: "processing",       label: "Processing" },
  { key: "approved",         label: "Approved" },
  { key: "rejected",         label: "Rejected" },
  { key: "delivered",        label: "Delivered" },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  collecting_docs: { label: "Docs সংগ্রহ",  color: "#F59E0B", bg: "#FFFBEB", icon: Clock },
  submitted:       { label: "Submitted",     color: "#0891B2", bg: "#ECFEFF", icon: Clock },
  processing:      { label: "Processing",    color: "#7C3AED", bg: "#F5F3FF", icon: Clock },
  approved:        { label: "Approved",      color: "#0F6E56", bg: "#E1F5EE", icon: CheckCircle },
  rejected:        { label: "Rejected",      color: "#DC2626", bg: "#FEE2E2", icon: XCircle },
  delivered:       { label: "Delivered",     color: "#0F6E56", bg: "#D1FAE5", icon: CheckCircle },
};

const VISA_TYPES = ["tourist", "business", "student", "work", "medical", "umrah", "hajj"];

const DOCUMENT_CHECKLIST = [
  "Passport copy",
  "NID copy",
  "Photo",
  "Bank statement",
  "Employment letter",
  "Hotel booking",
  "Air ticket",
  "Travel insurance",
  "Invitation letter",
];

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};
const inputCls = "w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500";
const inputStyle = { borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text)" };

const emptyForm = {
  applicantName: "", applicantPhone: "", passportNumber: "", passportExpiry: "",
  country: "", visaType: "tourist", serviceCharge: "", paidAmount: "",
  documents: [] as string[], notes: "",
};

export default function VisaBoard() {
  const [visas, setVisas] = useState<VisaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<VisaRequest | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = async (tab = activeTab) => {
    setLoading(true);
    const url = tab === "all" ? "/api/travel/visa" : `/api/travel/visa?status=${tab}`;
    const res = await fetch(url);
    if (res.ok) setVisas(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    load(tab);
  };

  const handleSave = async () => {
    if (!form.applicantName || !form.passportNumber || !form.country || !form.serviceCharge) return;
    setSaving(true);
    const res = await fetch("/api/travel/visa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { await load(); setShowForm(false); setForm({ ...emptyForm }); }
    setSaving(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const updateData: Record<string, string> = { id, status };
    const now = new Date().toISOString();
    if (status === "submitted") updateData.submittedDate = now;
    if (status === "approved") updateData.approvedDate = now;
    if (status === "rejected") updateData.rejectedDate = now;

    await fetch("/api/travel/visa", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });
    await load();
    setSelected(s => s && s.id === id ? { ...s, status } : s);
  };

  const toggleDoc = async (visaId: string, doc: string, checked: boolean) => {
    const visa = visas.find(v => v.id === visaId);
    if (!visa) return;
    const docs = checked ? [...visa.documents, doc] : visa.documents.filter(d => d !== doc);
    await fetch("/api/travel/visa", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: visaId, documents: docs }),
    });
    setVisas(vs => vs.map(v => v.id === visaId ? { ...v, documents: docs } : v));
    setSelected(s => s && s.id === visaId ? { ...s, documents: docs } : s);
  };

  const isPassportExpiringSoon = (expiry: string) => {
    const months = (new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
    return months < 6;
  };

  const filtered = visas.filter(v =>
    v.applicantName.toLowerCase().includes(search.toLowerCase()) ||
    v.visaNumber.toLowerCase().includes(search.toLowerCase()) ||
    v.country.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#0891B2" }} /></div>;

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>ভিসা ট্র্যাকিং</h1>
          <p className="text-sm" style={{ color: S.muted }}>{visas.length}টি আবেদন</p>
        </div>
        <button onClick={() => { setForm({ ...emptyForm }); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#0891B2" }}>
          <Plus size={16} /> নতুন ভিসা আবেদন
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map(t => (
            <button key={t.key} onClick={() => handleTabChange(t.key)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
              style={{ backgroundColor: activeTab === t.key ? "#0891B2" : S.surface, color: activeTab === t.key ? "#fff" : S.muted, border: `1px solid ${activeTab === t.key ? "#0891B2" : "var(--c-border)"}` }}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input className={inputCls} style={{ ...inputStyle, paddingLeft: "2rem" }} placeholder="নাম, ভিসা নং, দেশ..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <Stamp size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">কোনো ভিসা আবেদন নেই</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((v) => {
            const status = STATUS_MAP[v.status] ?? { label: v.status, color: "#6B7280", bg: "#F3F4F6", icon: Clock };
            const expiringSoon = isPassportExpiringSoon(v.passportExpiry);
            const daysSince = Math.floor((Date.now() - new Date(v.applicationDate).getTime()) / 86400000);
            return (
              <button key={v.id} onClick={() => setSelected(v)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all hover:shadow-md"
                style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: status.bg }}>
                  <status.icon size={18} style={{ color: status.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm" style={{ color: S.text }}>{v.applicantName}</span>
                    {expiringSoon && <AlertTriangle size={13} style={{ color: "#F59E0B" }} />}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: S.muted }}>{v.visaNumber} · {v.country} · {v.visaType} · {daysSince}দিন আগে</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm" style={{ color: "#0891B2" }}>{formatBDT(v.serviceCharge)}</p>
                  {(v.serviceCharge - v.paidAmount) > 0 && <p className="text-xs font-semibold" style={{ color: "#DC2626" }}>বাকি {formatBDT(v.serviceCharge - v.paidAmount)}</p>}
                </div>
                <span className="px-2 py-1 rounded-lg text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: status.bg, color: status.color }}>{status.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="w-full max-w-lg h-full overflow-y-auto p-5 space-y-4" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg" style={{ color: S.text }}>{selected.applicantName}</h2>
                <p className="text-xs" style={{ color: S.muted }}>{selected.visaNumber}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-gray-100"><X size={18} /></button>
            </div>

            {isPassportExpiringSoon(selected.passportExpiry) && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: "#FFFBEB" }}>
                <AlertTriangle size={16} style={{ color: "#F59E0B" }} />
                <p className="text-sm font-medium" style={{ color: "#B45309" }}>পাসপোর্টের মেয়াদ ৬ মাসের কম!</p>
              </div>
            )}

            <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: "#ECFEFF" }}>
              {[
                ["পাসপোর্ট নং", selected.passportNumber],
                ["মেয়াদ শেষ", new Date(selected.passportExpiry).toLocaleDateString("bn-BD")],
                ["দেশ", selected.country],
                ["ভিসার ধরন", selected.visaType],
                ["ফোন", selected.applicantPhone],
                ["চার্জ", formatBDT(selected.serviceCharge)],
                ["প্রদান", formatBDT(selected.paidAmount)],
              ].map(([k, val]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span style={{ color: "#0891B2" }}>{k}</span>
                  <span className="font-medium" style={{ color: "#0C4A6E" }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Status update */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: S.muted }}>স্ট্যাটাস পরিবর্তন</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(STATUS_MAP).map(([key, val]) => (
                  <button key={key} onClick={() => updateStatus(selected.id, key)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                    style={{ backgroundColor: selected.status === key ? val.color : val.bg, color: selected.status === key ? "#fff" : val.color }}>
                    {val.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Document checklist */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: S.muted }}>ডকুমেন্ট চেকলিস্ট ({selected.documents.length}/{DOCUMENT_CHECKLIST.length})</p>
              <div className="space-y-1.5">
                {DOCUMENT_CHECKLIST.map((doc) => {
                  const checked = selected.documents.includes(doc);
                  return (
                    <label key={doc} className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer hover:opacity-80" style={{ backgroundColor: checked ? "#E1F5EE" : S.surface, border: `1px solid ${checked ? "#0F6E56" : "var(--c-border)"}` }}>
                      <input type="checkbox" checked={checked} onChange={e => toggleDoc(selected.id, doc, e.target.checked)} className="accent-cyan-600" />
                      <span className="text-sm" style={{ color: checked ? "#0F6E56" : S.text }}>{doc}</span>
                      {checked && <CheckCircle size={14} className="ml-auto" style={{ color: "#0F6E56" }} />}
                    </label>
                  );
                })}
              </div>
            </div>

            {selected.notes && (
              <div className="p-3 rounded-xl" style={{ backgroundColor: "#FFFBEB" }}>
                <p className="text-xs font-medium mb-1" style={{ color: "#B45309" }}>নোট</p>
                <p className="text-sm" style={{ color: "#92600A" }}>{selected.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Visa Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-xl rounded-2xl p-6 space-y-4 mb-10" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg" style={{ color: S.text }}>নতুন ভিসা আবেদন</h2>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>আবেদনকারীর নাম *</label>
                <input className={inputCls} style={inputStyle} value={form.applicantName} onChange={e => setForm(f => ({ ...f, applicantName: e.target.value }))} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ফোন *</label>
                <input className={inputCls} style={inputStyle} placeholder="01XXXXXXXXX" value={form.applicantPhone} onChange={e => setForm(f => ({ ...f, applicantPhone: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পাসপোর্ট নং *</label>
                <input className={inputCls} style={inputStyle} value={form.passportNumber} onChange={e => setForm(f => ({ ...f, passportNumber: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>মেয়াদ *</label>
                <DatePicker value={form.passportExpiry} onChange={v => setForm(f => ({ ...f, passportExpiry: v }))} className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>দেশ *</label>
                <input className={inputCls} style={inputStyle} placeholder="Thailand, Malaysia..." value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ভিসার ধরন *</label>
                <select className={inputCls} style={inputStyle} value={form.visaType} onChange={e => setForm(f => ({ ...f, visaType: e.target.value }))}>
                  {VISA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>সার্ভিস চার্জ *</label>
                <input className={inputCls} style={inputStyle} type="number" placeholder="৳" value={form.serviceCharge} onChange={e => setForm(f => ({ ...f, serviceCharge: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>অগ্রিম প্রদান</label>
                <input className={inputCls} style={inputStyle} type="number" placeholder="৳" value={form.paidAmount} onChange={e => setForm(f => ({ ...f, paidAmount: e.target.value }))} />
              </div>
            </div>

            {/* Document checklist in form */}
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: S.muted }}>ডকুমেন্ট চেকলিস্ট</label>
              <div className="grid grid-cols-2 gap-1.5">
                {DOCUMENT_CHECKLIST.map(doc => {
                  const checked = form.documents.includes(doc);
                  return (
                    <label key={doc} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs" style={{ backgroundColor: checked ? "#E1F5EE" : S.surface, border: `1px solid ${checked ? "#0F6E56" : "var(--c-border)"}`, color: checked ? "#0F6E56" : S.text }}>
                      <input type="checkbox" checked={checked} onChange={e => {
                        if (e.target.checked) setForm(f => ({ ...f, documents: [...f.documents, doc] }));
                        else setForm(f => ({ ...f, documents: f.documents.filter(d => d !== doc) }));
                      }} className="accent-cyan-600" />
                      {doc}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>নোট</label>
              <textarea className={inputCls} style={{ ...inputStyle, height: "64px", resize: "none" }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={handleSave} disabled={saving || !form.applicantName || !form.passportNumber || !form.country || !form.serviceCharge}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#0891B2" }}>
                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "সেভ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
