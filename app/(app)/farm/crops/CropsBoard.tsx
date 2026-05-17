"use client";

import { useEffect, useState } from "react";
import { SproutIcon, Plus, X, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import DatePicker from "@/components/ui/DatePicker";

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };
const G = "#16A34A";

interface Land { id: string; name: string }
interface Cycle {
  id: string; cropName: string; cropType: string; season?: string | null; status: string;
  land: { name: string }; sowingDate?: string | null; expectedHarvestDate?: string | null;
  totalCost: number; totalRevenue: number; totalHarvested: number; daysGrowing: number; daysToHarvest?: number | null;
}

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  planned:    { bg: "#EFF6FF", color: "#1D4ED8", label: "পরিকল্পিত" },
  sowing:     { bg: "#F0FDF4", color: "#16A34A", label: "বপন"       },
  growing:    { bg: "#ECFDF5", color: "#059669", label: "বাড়ছে"    },
  harvesting: { bg: "#FFF3DC", color: "#92400E", label: "ফসল তোলা" },
  completed:  { bg: "#F3F4F6", color: "#6B7280", label: "সম্পন্ন"  },
};

const CROP_SUGGESTIONS = ["ধান (আমন)", "ধান (বোরো)", "আলু", "পেঁয়াজ", "রসুন", "টমেটো", "বেগুন", "মরিচ", "কুমড়া", "করলা", "লাউ", "শসা", "ভুট্টা", "গম", "সরিষা", "রুই মাছ", "কাতলা মাছ", "তেলাপিয়া", "পাঙ্গাস", "ব্রয়লার মুরগি", "লেয়ার মুরগি"];
const CROP_TYPE_MAP: Record<string, string> = { "ধান": "rice", "আলু": "vegetable", "পেঁয়াজ": "vegetable", "রসুন": "vegetable", "টমেটো": "vegetable", "বেগুন": "vegetable", "মরিচ": "vegetable", "কুমড়া": "vegetable", "করলা": "vegetable", "লাউ": "vegetable", "শসা": "vegetable", "ভুট্টা": "vegetable", "গম": "rice", "সরিষা": "vegetable", "মাছ": "fish", "মুরগি": "poultry" };

function guessCropType(name: string): string {
  for (const [key, val] of Object.entries(CROP_TYPE_MAP)) { if (name.includes(key)) return val; }
  return "other";
}

export default function CropsBoard() {
  const router = useRouter();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "completed">("active");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ landId: "", cropName: "", cropType: "rice", season: "", sowingDate: "", expectedHarvestDate: "", seedSource: "", seedCost: "", fertilizerCost: "", expectedYieldKg: "", notes: "" });
  const [cropSuggestion, setCropSuggestion] = useState("");

  async function load() {
    const [r1, r2] = await Promise.all([fetch(`/api/farm/crops?status=${tab}`), fetch("/api/farm/lands")]);
    if (r1.ok) setCycles(await r1.json());
    if (r2.ok) setLands(await r2.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, [tab]);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await fetch("/api/farm/crops", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false); setOpen(false);
    setForm({ landId: "", cropName: "", cropType: "rice", season: "", sowingDate: "", expectedHarvestDate: "", seedSource: "", seedCost: "", fertilizerCost: "", expectedYieldKg: "", notes: "" });
    load();
  }

  const inputCls = "w-full px-3 py-2 rounded-xl border text-sm outline-none";
  const inputStyle = { backgroundColor: S.surface, borderColor: S.border, color: S.text };
  const filtered = cycles;

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: S.text }}><SproutIcon size={20} style={{ color: G }} /> ফসল ব্যবস্থাপনা</h1>
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: G }}>
          <Plus size={16} /> নতুন ফসল
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
        {(["active", "completed"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setLoading(true); }} className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all" style={{ backgroundColor: tab === t ? G : "transparent", color: tab === t ? "white" : S.muted }}>
            {t === "active" ? "চলমান ফসল" : "সম্পন্ন"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: S.border }}>
          <SproutIcon size={36} className="mx-auto mb-2" style={{ color: S.muted }} />
          <p className="text-sm" style={{ color: S.muted }}>কোনো ফসল নেই</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const badge = STATUS_BADGE[c.status] ?? STATUS_BADGE.planned;
            const profit = c.totalRevenue - c.totalCost;
            return (
              <div key={c.id} className="rounded-2xl border p-4 cursor-pointer hover:shadow-md transition-shadow" style={{ backgroundColor: S.surface, borderColor: S.border }} onClick={() => router.push(`/farm/crops/${c.id}`)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm" style={{ color: S.text }}>{c.cropName}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>{badge.label}</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: S.muted }}>{c.land.name}{c.season ? ` · ${c.season}` : ""}</p>
                    <div className="flex gap-3 mt-2 flex-wrap">
                      {c.daysGrowing > 0 && <span className="text-xs" style={{ color: S.muted }}>🌱 {c.daysGrowing} দিন</span>}
                      {c.daysToHarvest !== null && c.daysToHarvest !== undefined && c.daysToHarvest > 0 && <span className="text-xs font-semibold" style={{ color: "#F59E0B" }}>⏳ {c.daysToHarvest} দিন বাকি</span>}
                      {c.totalHarvested > 0 && <span className="text-xs font-semibold" style={{ color: G }}>📦 {c.totalHarvested} কেজি</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs" style={{ color: S.muted }}>বিনিয়োগ</p>
                    <p className="text-sm font-bold" style={{ color: S.text }}>৳{c.totalCost.toLocaleString("bn-BD")}</p>
                    {profit !== 0 && <p className="text-xs font-semibold" style={{ color: profit > 0 ? G : "#EF4444" }}>{profit > 0 ? "+" : ""}৳{Math.abs(profit).toLocaleString("bn-BD")}</p>}
                  </div>
                  <ArrowRight size={14} className="flex-shrink-0 mt-1" style={{ color: S.muted }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Crop Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border shadow-xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center justify-between p-5 border-b sticky top-0" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <h2 className="font-bold" style={{ color: S.text }}>নতুন ফসল শুরু করুন</h2>
              <button onClick={() => setOpen(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>জমি নির্বাচন *</label>
                <select required value={form.landId} onChange={(e) => setForm({ ...form, landId: e.target.value })} className={inputCls} style={inputStyle}>
                  <option value="">জমি নির্বাচন করুন</option>
                  {lands.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ফসলের নাম *</label>
                <input required value={form.cropName} onChange={(e) => { const v = e.target.value; setForm({ ...form, cropName: v, cropType: guessCropType(v) }); setCropSuggestion(""); }} placeholder="ফসলের নাম লিখুন বা নিচ থেকে বেছে নিন" className={inputCls} style={inputStyle} />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {CROP_SUGGESTIONS.map((s) => (
                    <button type="button" key={s} onClick={() => { setForm({ ...form, cropName: s, cropType: guessCropType(s) }); setCropSuggestion(s); }} className="text-[10px] px-2 py-1 rounded-lg border font-medium" style={{ backgroundColor: cropSuggestion === s ? G : S.surface, color: cropSuggestion === s ? "white" : S.muted, borderColor: S.border }}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ফসলের ধরন</label>
                  <select value={form.cropType} onChange={(e) => setForm({ ...form, cropType: e.target.value })} className={inputCls} style={inputStyle}>
                    <option value="rice">ধান / শস্য</option>
                    <option value="vegetable">সবজি</option>
                    <option value="fruit">ফল</option>
                    <option value="fish">মাছ</option>
                    <option value="poultry">পোল্ট্রি</option>
                    <option value="livestock">গবাদিপশু</option>
                    <option value="other">অন্যান্য</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>মৌসুম</label>
                  <select value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} className={inputCls} style={inputStyle}>
                    <option value="">নির্বাচন করুন</option>
                    <option value="রবি (শীত)">রবি (শীত)</option>
                    <option value="খরিফ-১ (বোরো)">খরিফ-১ (বোরো)</option>
                    <option value="খরিফ-২ (আমন)">খরিফ-২ (আমন)</option>
                    <option value="বারোমাসি">বারোমাসি</option>
                    <option value="Year-round">Year-round</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>বপন / শুরুর তারিখ *</label>
                  <DatePicker value={form.sowingDate} onChange={v => setForm({ ...form, sowingDate: v })} className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>প্রত্যাশিত ফসল তোলার তারিখ</label>
                  <DatePicker value={form.expectedHarvestDate} onChange={v => setForm({ ...form, expectedHarvestDate: v })} className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>বীজ উৎস</label>
                  <select value={form.seedSource} onChange={(e) => setForm({ ...form, seedSource: e.target.value })} className={inputCls} style={inputStyle}>
                    <option value="">নির্বাচন করুন</option>
                    <option value="নিজস্ব">নিজস্ব</option>
                    <option value="বাজার কেনা">বাজার কেনা</option>
                    <option value="কৃষি অফিস">কৃষি অফিস</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>বীজ/পোনা খরচ (৳)</label>
                  <input type="number" value={form.seedCost} onChange={(e) => setForm({ ...form, seedCost: e.target.value })} placeholder="০" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>প্রাথমিক সার খরচ (৳)</label>
                  <input type="number" value={form.fertilizerCost} onChange={(e) => setForm({ ...form, fertilizerCost: e.target.value })} placeholder="০" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>প্রত্যাশিত ফলন (কেজি)</label>
                  <input type="number" value={form.expectedYieldKg} onChange={(e) => setForm({ ...form, expectedYieldKg: e.target.value })} placeholder="৫০০" className={inputCls} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>নোট</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} style={inputStyle} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-3 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2" style={{ backgroundColor: G }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <SproutIcon size={16} />} ফসল শুরু করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
