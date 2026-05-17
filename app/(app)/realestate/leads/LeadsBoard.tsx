"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Plus, X, Search, Loader2, Phone, ChevronRight } from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";

interface Lead {
  id: string; clientName: string; clientPhone: string; requirement?: string | null;
  budget?: number | null; leadSource: string; stage: string; interestedIn?: string | null;
  followUpDate?: string | null; notes?: string | null;
  property?: { id: string; propertyCode: string; title: string; type: string } | null;
}

const RE_COLOR = "#0891B2";
const RE_LIGHT = "#E0F2FE";
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };

const STAGES = [
  { key: "new",             label: "নতুন",           color: "#6B7280", bg: "#F3F4F6" },
  { key: "contacted",       label: "যোগাযোগ হয়েছে", color: "#3B82F6", bg: "#EFF6FF" },
  { key: "site_visit_done", label: "Site Visit",     color: "#8B5CF6", bg: "#F5F3FF" },
  { key: "negotiating",     label: "আলোচনায়",       color: "#F59E0B", bg: "#FFFBEB" },
  { key: "deal_done",       label: "Deal হয়েছে",    color: "#10B981", bg: "#ECFDF5" },
  { key: "lost",            label: "Lost",           color: "#EF4444", bg: "#FEF2F2" },
];
const SOURCE_META: Record<string, string> = { facebook: "Facebook", referral: "Referral", website: "Website", walk_in: "Walk-in", phone: "Phone" };
const blank = { clientName: "", clientPhone: "", requirement: "", budget: "", preferredArea: "", leadSource: "facebook", interestedIn: "sale", followUpDate: "", notes: "" };

export default function LeadsBoard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ ...blank });
  const [saving, setSaving] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editFollowUp, setEditFollowUp] = useState("");
  const [updatingStage, setUpdatingStage] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (stageFilter !== "all") p.set("stage", stageFilter);
    if (search) p.set("search", search);
    const res = await fetch(`/api/realestate/leads?${p}`);
    const data = await res.json();
    setLeads(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [stageFilter, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("new") === "1") setShowNew(true);
  }, []);

  const handleSave = async () => {
    if (!form.clientName || !form.clientPhone) return;
    setSaving(true);
    try {
      await fetch("/api/realestate/leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, budget: form.budget ? Number(form.budget) : null }),
      });
      setShowNew(false); setForm({ ...blank }); load();
    } finally { setSaving(false); }
  };

  const updateStage = async (leadId: string, stage: string) => {
    setUpdatingStage(true);
    await fetch(`/api/realestate/leads/${leadId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage }),
    });
    load();
    if (selected?.id === leadId) setSelected(p => p ? { ...p, stage } : p);
    setUpdatingStage(false);
  };

  const saveNotes = async (leadId: string) => {
    await fetch(`/api/realestate/leads/${leadId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: editNotes, followUpDate: editFollowUp || null }),
    });
    load();
    if (selected?.id === leadId) setSelected(p => p ? { ...p, notes: editNotes, followUpDate: editFollowUp || null } : p);
  };

  const getStageMeta = (key: string) => STAGES.find(s => s.key === key) ?? STAGES[0];

  // Kanban grouped
  const kanbanStages = STAGES.filter(s => s.key !== "all");
  const grouped: Record<string, Lead[]> = Object.fromEntries(kanbanStages.map(s => [s.key, []]));
  leads.forEach(l => { if (grouped[l.stage]) grouped[l.stage].push(l); else grouped.new?.push(l); });

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Users size={20} style={{ color: RE_COLOR }} />
          <h1 className="text-lg font-black" style={{ color: S.text }}>Lead ম্যানেজমেন্ট</h1>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: RE_COLOR }}>
          <Plus size={15} /> নতুন Lead
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="নাম বা ফোন..."
            className="w-full h-9 pl-9 pr-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
        </div>
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
          className="h-9 px-3 rounded-xl border text-xs" style={{ borderColor: S.border, color: S.text }}>
          <option value="all">সব Stage</option>
          {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin" style={{ color: RE_COLOR }} /></div>
      ) : (
        /* Kanban Board */
        <div className="flex gap-3 overflow-x-auto pb-4 min-h-[400px]">
          {kanbanStages.map(stage => {
            const stageleads = grouped[stage.key] ?? [];
            return (
              <div key={stage.key} className="flex-shrink-0 w-64">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: stage.bg, color: stage.color }}>{stage.label}</span>
                  <span className="text-xs font-bold" style={{ color: S.muted }}>{stageleads.length}</span>
                </div>
                <div className="space-y-2">
                  {stageleads.map(lead => (
                    <div key={lead.id} onClick={() => { setSelected(lead); setEditNotes(lead.notes ?? ""); setEditFollowUp(lead.followUpDate ? lead.followUpDate.split("T")[0] : ""); }}
                      className="rounded-xl border p-3 cursor-pointer transition-all hover:shadow-md"
                      style={{ backgroundColor: S.surface, borderColor: selected?.id === lead.id ? RE_COLOR : S.border }}>
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-bold text-sm leading-snug" style={{ color: S.text }}>{lead.clientName}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: `${SOURCE_META[lead.leadSource] ? "#6B7280" : "#6B7280"}15`, color: "#6B7280" }}>
                          {SOURCE_META[lead.leadSource] ?? lead.leadSource}
                        </span>
                      </div>
                      {lead.requirement && <p className="text-xs mt-1 line-clamp-2" style={{ color: S.muted }}>{lead.requirement}</p>}
                      {lead.budget && <p className="text-xs font-bold mt-1" style={{ color: RE_COLOR }}>Budget: ৳{(lead.budget / 100000).toFixed(1)}L</p>}
                      {lead.followUpDate && (
                        <p className="text-[10px] mt-1 font-semibold" style={{ color: "#F59E0B" }}>
                          📅 {new Date(lead.followUpDate).toLocaleDateString("bn-BD")}
                        </p>
                      )}
                      {lead.property && (
                        <p className="text-[10px] mt-1 truncate" style={{ color: RE_COLOR }}>🏠 {lead.property.title}</p>
                      )}
                    </div>
                  ))}
                  {stageleads.length === 0 && (
                    <div className="rounded-xl border-2 border-dashed p-4 text-center text-xs" style={{ borderColor: S.border, color: S.muted }}>
                      কোনো lead নেই
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={() => setSelected(null)}>
          <div className="w-full max-w-sm h-full overflow-y-auto p-5 space-y-4"
            style={{ backgroundColor: S.surface }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-base" style={{ color: S.text }}>{selected.clientName}</p>
                <a href={`tel:${selected.clientPhone}`} className="text-sm flex items-center gap-1" style={{ color: RE_COLOR }}>
                  <Phone size={12} /> {selected.clientPhone}
                </a>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: S.border }}><X size={15} /></button>
            </div>

            {selected.requirement && (
              <div className="rounded-xl p-3" style={{ backgroundColor: RE_LIGHT }}>
                <p className="text-xs font-bold mb-1" style={{ color: RE_COLOR }}>চাহিদা</p>
                <p className="text-sm" style={{ color: S.text }}>{selected.requirement}</p>
                {selected.budget && <p className="text-sm font-bold mt-1" style={{ color: RE_COLOR }}>Budget: ৳{(selected.budget / 100000).toFixed(1)} Lakh</p>}
              </div>
            )}

            {/* Stage Update */}
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: S.muted }}>Stage আপডেট</p>
              <div className="grid grid-cols-2 gap-1.5">
                {STAGES.map(s => (
                  <button key={s.key} onClick={() => updateStage(selected.id, s.key)} disabled={updatingStage}
                    className="py-2 rounded-xl text-xs font-bold border transition-all"
                    style={selected.stage === s.key
                      ? { backgroundColor: s.color, color: "#fff", borderColor: s.color }
                      : { backgroundColor: s.bg, color: s.color, borderColor: `${s.color}40` }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes + Follow-up */}
            <div className="space-y-2">
              <p className="text-xs font-bold" style={{ color: S.muted }}>নোট ও Follow-up</p>
              <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                placeholder="কল লগ, নোট..." rows={3}
                className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none" style={{ borderColor: S.border, color: S.text }} />
              <DatePicker
  value={editFollowUp}
  onChange={v => setEditFollowUp(v)}
  className="w-full h-10 px-3 rounded-xl border text-sm"
  style={{ borderColor: S.border, color: S.text }}
/>
              <button onClick={() => saveNotes(selected.id)}
                className="w-full py-2.5 rounded-xl font-bold text-sm text-white" style={{ backgroundColor: RE_COLOR }}>
                ✓ নোট সেভ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Lead Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl" style={{ backgroundColor: S.surface }}>
            <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b z-10" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <h2 className="font-black text-base" style={{ color: S.text }}>নতুন Lead</h2>
              <button onClick={() => setShowNew(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: S.border }}><X size={15} /></button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: "ক্লায়েন্টের নাম *", key: "clientName", placeholder: "নাম" },
                { label: "ফোন নম্বর *", key: "clientPhone", placeholder: "01XXXXXXXXX" },
                { label: "চাহিদা", key: "requirement", placeholder: "3 BHK, Dhanmondi এলাকা..." },
                { label: "Budget (৳)", key: "budget", placeholder: "৫০ লাখ" },
                { label: "পছন্দের এলাকা", key: "preferredArea", placeholder: "Gulshan, Banani..." },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>{f.label}</label>
                  <input value={(form as Record<string, string>)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} className="w-full h-10 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>Lead Source</label>
                  <select value={form.leadSource} onChange={e => setForm(f => ({ ...f, leadSource: e.target.value }))}
                    className="w-full h-10 px-2 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }}>
                    {Object.entries(SOURCE_META).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>আগ্রহ</label>
                  <select value={form.interestedIn} onChange={e => setForm(f => ({ ...f, interestedIn: e.target.value }))}
                    className="w-full h-10 px-2 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }}>
                    <option value="sale">বিক্রয়</option><option value="rent">ভাড়া</option><option value="both">উভয়</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>Follow-up তারিখ</label>
                <DatePicker
  value={form.followUpDate}
  onChange={v => setForm(f => ({ ...f, followUpDate: v }))}
  className="w-full h-10 px-3 rounded-xl border text-sm"
  style={{ borderColor: S.border, color: S.text }}
/>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowNew(false)} className="flex-1 py-3 rounded-xl border font-semibold text-sm" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2" style={{ backgroundColor: RE_COLOR }}>
                  {saving ? <Loader2 size={15} className="animate-spin" /> : "✓ সেভ করুন"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
