"use client";

import { useEffect, useState } from "react";
import { Tractor, Plus, X, Loader2, MapPin, Sprout } from "lucide-react";
import { formatBDT } from "@/lib/utils";

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", bg: "var(--c-bg)" };
const G = "#16A34A";

interface CycleRef { id: string; cropName: string; status: string }
interface Land {
  id: string; name: string; type: string; areaBigha: number; areaAcre?: number | null;
  location?: string | null; soilType?: string | null; ownership: string;
  leaseAmount?: number | null; leaseFreq?: string | null; isActive: boolean; notes?: string | null;
  cycles: CycleRef[];
}

const LAND_TYPE: Record<string, { label: string; icon: string }> = {
  crop_field:    { label: "ফসলি জমি",    icon: "🌾" },
  pond:          { label: "পুকুর",        icon: "🐟" },
  orchard:       { label: "ফলের বাগান",  icon: "🌳" },
  poultry_farm:  { label: "পোল্ট্রি ফার্ম", icon: "🐓" },
  other:         { label: "অন্যান্য",     icon: "🏡" },
};
const SOIL_TYPE: Record<string, string> = {
  sandy: "বালুকা", loamy: "দোআঁশ", clay: "এঁটেল", alluvial: "পলিমাটি",
};
const OWN_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  own:    { bg: "#E1F5EE", color: "#085041", label: "নিজস্ব"  },
  leased: { bg: "#FFF3DC", color: "#633806", label: "লিজ"     },
  shared: { bg: "#EFF6FF", color: "#1D4ED8", label: "যৌথ"    },
};
const CROP_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  planned:    { bg: "#EFF6FF", color: "#1D4ED8", label: "পরিকল্পিত" },
  sowing:     { bg: "#F0FDF4", color: "#16A34A", label: "বপন"       },
  growing:    { bg: "#ECFDF5", color: "#059669", label: "বাড়ছে"    },
  harvesting: { bg: "#FFF3DC", color: "#633806", label: "ফসল তোলা" },
  completed:  { bg: "#F3F4F6", color: "#6B7280", label: "সম্পন্ন"  },
};

export default function LandsBoard() {
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", type: "crop_field", areaBigha: "", areaAcre: "", location: "", soilType: "", ownership: "own", leaseAmount: "", leaseFreq: "monthly", notes: "" });

  const load = async () => { const r = await fetch("/api/farm/lands"); if (r.ok) setLands(await r.json()); setLoading(false); };
  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await fetch("/api/farm/lands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false); setOpen(false); setForm({ name: "", type: "crop_field", areaBigha: "", areaAcre: "", location: "", soilType: "", ownership: "own", leaseAmount: "", leaseFreq: "monthly", notes: "" });
    load();
  }

  const inputCls = "w-full px-3 py-2 rounded-xl border text-sm outline-none";
  const inputStyle = { backgroundColor: S.surface, borderColor: S.border, color: S.text };

  const totalBigha = lands.reduce((s, l) => s + l.areaBigha, 0);
  const activeLands = lands.filter((l) => l.isActive);

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: S.text }}><Tractor size={20} style={{ color: G }} /> জমি ম্যানেজমেন্ট</h1>
          <p className="text-xs mt-0.5" style={{ color: S.muted }}>মোট {activeLands.length}টি সক্রিয় জমি · {totalBigha.toFixed(2)} বিঘা</p>
        </div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: G }}>
          <Plus size={16} /> জমি যোগ
        </button>
      </div>

      {/* Summary pills */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(LAND_TYPE).map(([key, val]) => {
          const count = lands.filter((l) => l.type === key).length;
          if (!count) return null;
          return <span key={key} className="text-xs px-3 py-1 rounded-full font-semibold" style={{ backgroundColor: "#F0FDF4", color: G }}>{val.icon} {val.label}: {count}</span>;
        })}
      </div>

      {/* Land list */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>
      ) : lands.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: S.border }}>
          <Tractor size={36} className="mx-auto mb-2" style={{ color: S.muted }} />
          <p className="text-sm font-semibold" style={{ color: S.muted }}>এখনো কোনো জমি যোগ হয়নি</p>
          <button onClick={() => setOpen(true)} className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: G }}>প্রথম জমি যোগ করুন</button>
        </div>
      ) : (
        <div className="space-y-2">
          {lands.map((land) => {
            const typeInfo = LAND_TYPE[land.type] ?? LAND_TYPE.other;
            const ownBadge = OWN_BADGE[land.ownership] ?? OWN_BADGE.own;
            const activeCycle = land.cycles[0];
            const cycleBadge = activeCycle ? (CROP_STATUS[activeCycle.status] ?? CROP_STATUS.planned) : null;
            return (
              <div key={land.id} className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: "#F0FDF4" }}>{typeInfo.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm" style={{ color: S.text }}>{land.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: ownBadge.bg, color: ownBadge.color }}>{ownBadge.label}</span>
                      {!land.isActive && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">নিষ্ক্রিয়</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs font-semibold" style={{ color: G }}>{land.areaBigha} বিঘা</span>
                      {land.areaAcre && <span className="text-xs" style={{ color: S.muted }}>({land.areaAcre.toFixed(2)} একর)</span>}
                      {land.location && <span className="text-xs flex items-center gap-0.5" style={{ color: S.muted }}><MapPin size={10} />{land.location}</span>}
                      {land.soilType && <span className="text-xs" style={{ color: S.muted }}>{SOIL_TYPE[land.soilType] ?? land.soilType}</span>}
                    </div>
                    {land.leaseAmount && (
                      <p className="text-xs mt-1" style={{ color: S.muted }}>লিজ: {formatBDT(land.leaseAmount)}/{land.leaseFreq === "yearly" ? "বছর" : "মাস"}</p>
                    )}
                    {activeCycle && cycleBadge && (
                      <div className="flex items-center gap-2 mt-2">
                        <Sprout size={12} style={{ color: G }} />
                        <span className="text-xs" style={{ color: S.text }}>{activeCycle.cropName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: cycleBadge.bg, color: cycleBadge.color }}>{cycleBadge.label}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Land Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border shadow-xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center justify-between p-5 border-b sticky top-0" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <h2 className="font-bold flex items-center gap-2" style={{ color: S.text }}><Tractor size={16} style={{ color: G }} /> নতুন জমি যোগ করুন</h2>
              <button onClick={() => setOpen(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>জমির নাম *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="উত্তর মাঠ" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ধরন *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls} style={inputStyle}>
                    {Object.entries(LAND_TYPE).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পরিমাণ (বিঘা) *</label>
                  <input required type="number" step="0.01" value={form.areaBigha} onChange={(e) => { const b = e.target.value; const a = b ? (parseFloat(b) * 0.3306).toFixed(2) : ""; setForm({ ...form, areaBigha: b, areaAcre: a }); }} placeholder="২.৫" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পরিমাণ (একর)</label>
                  <input type="number" step="0.001" value={form.areaAcre} onChange={(e) => setForm({ ...form, areaAcre: e.target.value })} placeholder="স্বয়ংক্রিয়" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>অবস্থান (গ্রাম/উপজেলা)</label>
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="যেমন: দরিয়াপুর, কুমিল্লা" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>মাটির ধরন</label>
                  <select value={form.soilType} onChange={(e) => setForm({ ...form, soilType: e.target.value })} className={inputCls} style={inputStyle}>
                    <option value="">নির্বাচন করুন</option>
                    <option value="sandy">বালুকা</option>
                    <option value="loamy">দোআঁশ</option>
                    <option value="clay">এঁটেল</option>
                    <option value="alluvial">পলিমাটি</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>মালিকানা</label>
                  <select value={form.ownership} onChange={(e) => setForm({ ...form, ownership: e.target.value })} className={inputCls} style={inputStyle}>
                    <option value="own">নিজস্ব</option>
                    <option value="leased">লিজ</option>
                    <option value="shared">যৌথ</option>
                  </select>
                </div>
                {form.ownership === "leased" && <>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>লিজ পরিমাণ (৳)</label>
                    <input type="number" value={form.leaseAmount} onChange={(e) => setForm({ ...form, leaseAmount: e.target.value })} placeholder="৫০০০" className={inputCls} style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পরিশোধ পদ্ধতি</label>
                    <select value={form.leaseFreq} onChange={(e) => setForm({ ...form, leaseFreq: e.target.value })} className={inputCls} style={inputStyle}>
                      <option value="monthly">মাসিক</option>
                      <option value="yearly">বার্ষিক</option>
                    </select>
                  </div>
                </>}
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>নোট</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} style={inputStyle} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-3 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2" style={{ backgroundColor: G }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
