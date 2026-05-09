"use client";

import { useEffect, useState, useCallback } from "react";
import { HandCoins, Plus, X, Loader2, CheckCircle } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface Deal {
  id: string; dealNumber: string; clientName: string; clientPhone: string;
  dealType: string; agreedAmount: number; commissionRate: number; commissionAmount: number;
  advanceReceived: number; status: string; dealDate: string; completionDate?: string | null;
  documents: string[]; notes?: string | null;
  property: { id: string; propertyCode: string; title: string; type: string; location: string };
}

const RE_COLOR = "#0891B2";
const RE_LIGHT = "#E0F2FE";
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };
const STATUS_META: Record<string, { label: string; color: string }> = {
  in_progress: { label: "চলমান",  color: "#F59E0B" },
  completed:   { label: "সম্পন্ন", color: "#10B981" },
  cancelled:   { label: "বাতিল",  color: "#EF4444" },
};
const DOCS = ["Bayna agreement signed", "Registry done", "Mutation done", "Power of Attorney"];

const blank = { propertyId: "", clientName: "", clientPhone: "", dealType: "sale", agreedAmount: "", commissionRate: "2", advanceReceived: "", documents: [] as string[], notes: "" };

export default function DealsBoard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Deal | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ ...blank });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (statusFilter !== "all") p.set("status", statusFilter);
    const res = await fetch(`/api/realestate/deals?${p}`);
    const data = await res.json();
    setDeals(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const commission = Math.round((Number(form.agreedAmount || 0) * Number(form.commissionRate || 0)) / 100);

  const toggleDoc = (doc: string) => setForm(f => ({
    ...f, documents: f.documents.includes(doc) ? f.documents.filter(d => d !== doc) : [...f.documents, doc],
  }));

  const handleSave = async () => {
    if (!form.propertyId || !form.clientName || !form.agreedAmount) return;
    setSaving(true);
    try {
      await fetch("/api/realestate/deals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, agreedAmount: Number(form.agreedAmount), commissionRate: Number(form.commissionRate), advanceReceived: Number(form.advanceReceived || 0) }),
      });
      setShowNew(false); setForm({ ...blank }); load();
    } finally { setSaving(false); }
  };

  const handleComplete = async (dealId: string) => {
    await fetch(`/api/realestate/deals/${dealId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "complete" }),
    });
    load(); if (selected?.id === dealId) setSelected(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <HandCoins size={20} style={{ color: RE_COLOR }} />
          <h1 className="text-lg font-black" style={{ color: S.text }}>Deal ট্র্যাকিং</h1>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: RE_COLOR }}>
          <Plus size={15} /> নতুন Deal
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-4">
        {[{ key: "all", label: "সব" }, ...Object.entries(STATUS_META).map(([k, v]) => ({ key: k, label: v.label }))].map(t => (
          <button key={t.key} onClick={() => setStatusFilter(t.key)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border"
            style={statusFilter === t.key ? { backgroundColor: RE_COLOR, color: "#fff", borderColor: RE_COLOR } : { backgroundColor: S.surface, color: S.muted, borderColor: S.border }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin" style={{ color: RE_COLOR }} /></div>
      ) : deals.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: RE_LIGHT }}>
            <HandCoins size={22} style={{ color: RE_COLOR }} />
          </div>
          <p className="text-sm" style={{ color: S.muted }}>কোনো deal পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deals.map(d => {
            const sm = STATUS_META[d.status] ?? STATUS_META.in_progress;
            return (
              <div key={d.id} onClick={() => setSelected(d)}
                className="rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md"
                style={{ backgroundColor: S.surface, borderColor: selected?.id === d.id ? RE_COLOR : S.border }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: RE_LIGHT, color: RE_COLOR }}>{d.dealNumber}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${sm.color}15`, color: sm.color }}>{sm.label}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100" style={{ color: S.muted }}>{d.dealType === "sale" ? "বিক্রয়" : "ভাড়া"}</span>
                    </div>
                    <p className="font-bold text-sm mt-1" style={{ color: S.text }}>{d.clientName}</p>
                    <p className="text-xs mt-0.5" style={{ color: S.muted }}>🏠 {d.property.title} · {d.property.location}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-base" style={{ color: S.text }}>{formatBDT(d.agreedAmount)}</p>
                    <p className="text-xs font-bold" style={{ color: "#10B981" }}>কমিশন: {formatBDT(d.commissionAmount)}</p>
                    <p className="text-xs" style={{ color: S.muted }}>{d.commissionRate}%</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: S.muted }}>
                  <span>অগ্রিম: {formatBDT(d.advanceReceived)}</span>
                  <span>{d.documents.length}/{DOCS.length} docs</span>
                  <span>{new Date(d.dealDate).toLocaleDateString("bn-BD")}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deal Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={() => setSelected(null)}>
          <div className="w-full max-w-sm h-full overflow-y-auto p-5 space-y-4"
            style={{ backgroundColor: S.surface }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: RE_LIGHT, color: RE_COLOR }}>{selected.dealNumber}</span>
                <p className="font-bold text-base mt-1" style={{ color: S.text }}>{selected.clientName}</p>
                <p className="text-sm" style={{ color: S.muted }}>{selected.property.title}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: S.border }}><X size={15} /></button>
            </div>

            <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: RE_LIGHT }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: S.muted }}>Agreed মূল্য</span>
                <span className="font-black" style={{ color: RE_COLOR }}>{formatBDT(selected.agreedAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: S.muted }}>কমিশন ({selected.commissionRate}%)</span>
                <span className="font-bold" style={{ color: "#10B981" }}>{formatBDT(selected.commissionAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: S.muted }}>অগ্রিম পেয়েছি</span>
                <span className="font-bold" style={{ color: S.text }}>{formatBDT(selected.advanceReceived)}</span>
              </div>
            </div>

            {/* Documents checklist */}
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: S.muted }}>Documents Checklist</p>
              <div className="space-y-1.5">
                {DOCS.map(doc => (
                  <div key={doc} className="flex items-center gap-2 py-1.5 px-3 rounded-xl"
                    style={{ backgroundColor: selected.documents.includes(doc) ? "#ECFDF5" : "#F9F9F8" }}>
                    <CheckCircle size={14} style={{ color: selected.documents.includes(doc) ? "#10B981" : "#D1D5DB" }} />
                    <span className="text-sm" style={{ color: selected.documents.includes(doc) ? "#10B981" : S.muted }}>{doc}</span>
                  </div>
                ))}
              </div>
            </div>

            {selected.status === "in_progress" && (
              <button onClick={() => handleComplete(selected.id)}
                className="w-full py-3 rounded-xl font-bold text-sm text-white" style={{ backgroundColor: "#10B981" }}>
                ✓ Deal সম্পন্ন করুন
              </button>
            )}

            {selected.notes && (
              <div className="rounded-xl p-3 text-xs" style={{ backgroundColor: "#FFFBEB", color: "#92400E" }}>
                {selected.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Deal Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl" style={{ backgroundColor: S.surface }}>
            <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b z-10" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <h2 className="font-black text-base" style={{ color: S.text }}>নতুন Deal</h2>
              <button onClick={() => setShowNew(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: S.border }}><X size={15} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>Property ID *</label>
                <input value={form.propertyId} onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
                  placeholder="PROP-2026-001 or property id" className="w-full h-10 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
              </div>
              {[
                { label: "ক্লায়েন্টের নাম *", key: "clientName", placeholder: "নাম" },
                { label: "ফোন নম্বর", key: "clientPhone", placeholder: "01XXXXXXXXX" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>{f.label}</label>
                  <input value={(form as Record<string, string>)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} className="w-full h-10 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>Deal Type</label>
                  <select value={form.dealType} onChange={e => setForm(f => ({ ...f, dealType: e.target.value }))}
                    className="w-full h-10 px-2 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }}>
                    <option value="sale">বিক্রয়</option><option value="rent">ভাড়া</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>কমিশন %</label>
                  <input type="number" value={form.commissionRate} onChange={e => setForm(f => ({ ...f, commissionRate: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>Agreed মূল্য (৳) *</label>
                  <input type="number" value={form.agreedAmount} onChange={e => setForm(f => ({ ...f, agreedAmount: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>অগ্রিম (৳)</label>
                  <input type="number" value={form.advanceReceived} onChange={e => setForm(f => ({ ...f, advanceReceived: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                </div>
              </div>
              {commission > 0 && (
                <div className="rounded-xl p-3" style={{ backgroundColor: "#ECFDF5" }}>
                  <p className="text-xs" style={{ color: "#166534" }}>আনুমানিক কমিশন</p>
                  <p className="font-black text-lg" style={{ color: "#10B981" }}>{formatBDT(commission)}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: S.muted }}>Documents</p>
                <div className="space-y-1.5">
                  {DOCS.map(doc => (
                    <label key={doc} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.documents.includes(doc)} onChange={() => toggleDoc(doc)} />
                      <span className="text-sm" style={{ color: S.text }}>{doc}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowNew(false)} className="flex-1 py-3 rounded-xl border font-semibold text-sm" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2" style={{ backgroundColor: RE_COLOR }}>
                  {saving ? <Loader2 size={15} className="animate-spin" /> : "✓ Deal তৈরি করুন"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
