"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SproutIcon, Loader2, ArrowLeft, Plus, X, Save, CloudSun, Droplets, Leaf, Scissors, Eye, Wrench } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import DatePicker from "@/components/ui/DatePicker";

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };
const G = "#16A34A";

interface ActivityLog { id: string; activityType: string; description: string; quantity?: string | null; cost: number; laborCount?: number | null; weather?: string | null; activityDate: string }
interface SaleRecord { id: string; quantityKg: number; pricePerKg: number; totalAmount: number; buyerName?: string | null; saleDate: string; paymentStatus: string }
interface Harvest { id: string; harvestDate: string; quantityKg: number; qualityGrade?: string | null; storageLocation?: string | null; sellRecords: SaleRecord[] }
interface Cycle {
  id: string; cropName: string; cropType: string; season?: string | null; status: string;
  land: { name: string; areaBigha: number };
  sowingDate?: string | null; expectedHarvestDate?: string | null;
  seedCost: number; fertilizerCost: number; pesticideCost: number; irrigationCost: number; laborCost: number; otherCost: number;
  expectedYieldKg?: number | null; actualYieldKg?: number | null;
  notes?: string | null;
  logs: ActivityLog[];
  harvests: Harvest[];
  totalCost: number; totalHarvested: number; totalRevenue: number;
}

const ACTIVITY_CHIPS = [
  { key: "irrigation",   label: "সেচ",          icon: Droplets  },
  { key: "fertilizer",   label: "সার প্রয়োগ",   icon: Leaf      },
  { key: "pesticide",    label: "কীটনাশক",       icon: Scissors  },
  { key: "weeding",      label: "আগাছা",         icon: Scissors  },
  { key: "observation",  label: "পর্যবেক্ষণ",    icon: Eye       },
  { key: "other",        label: "অন্যান্য",      icon: Wrench    },
];
const WEATHER_OPTIONS = [
  { k: "sunny", l: "☀️ রোদ" }, { k: "rainy", l: "🌧️ বৃষ্টি" },
  { k: "cloudy", l: "☁️ মেঘলা" }, { k: "windy", l: "💨 ঝড়" },
];
const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  planned:    { bg: "#EFF6FF", color: "#1D4ED8", label: "পরিকল্পিত" },
  sowing:     { bg: "#F0FDF4", color: "#16A34A", label: "বপন"       },
  growing:    { bg: "#ECFDF5", color: "#059669", label: "বাড়ছে"    },
  harvesting: { bg: "#FFF3DC", color: "#92400E", label: "ফসল তোলা" },
  completed:  { bg: "#F3F4F6", color: "#6B7280", label: "সম্পন্ন"  },
};

export default function CropDetail({ id }: { id: string }) {
  const router = useRouter();
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"logs" | "harvest">("logs");
  const [logModal, setLogModal] = useState(false);
  const [harvestModal, setHarvestModal] = useState(false);
  const [saleHarvestId, setSaleHarvestId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [logForm, setLogForm] = useState({ activityType: "irrigation", description: "", quantity: "", cost: "", laborCount: "", weather: "sunny", activityDate: new Date().toISOString().split("T")[0] });
  const [harvestForm, setHarvestForm] = useState({ harvestDate: new Date().toISOString().split("T")[0], quantityKg: "", qualityGrade: "", storageLocation: "", notes: "" });
  const [saleForm, setSaleForm] = useState({ buyerName: "", buyerPhone: "", quantityKg: "", pricePerKg: "", saleDate: new Date().toISOString().split("T")[0], paymentStatus: "paid", note: "" });

  const load = useCallback(async () => {
    const r = await fetch(`/api/farm/crops/${id}`);
    if (r.ok) setCycle(await r.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function saveLog(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await fetch(`/api/farm/crops/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "log", ...logForm }) });
    setSaving(false); setLogModal(false); load();
  }
  async function saveHarvest(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await fetch(`/api/farm/crops/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "harvest", ...harvestForm }) });
    setSaving(false); setHarvestModal(false); load();
  }
  async function saveSale(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await fetch(`/api/farm/crops/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "sale", harvestId: saleHarvestId, ...saleForm }) });
    setSaving(false); setSaleHarvestId(null); load();
  }
  async function updateStatus(status: string) {
    await fetch(`/api/farm/crops/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }

  const inputCls = "w-full px-3 py-2 rounded-xl border text-sm outline-none";
  const iS = { backgroundColor: S.surface, borderColor: S.border, color: S.text };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;
  if (!cycle) return <div className="text-center py-20" style={{ color: S.muted }}>ফসল পাওয়া যায়নি</div>;

  const badge = STATUS_BADGE[cycle.status] ?? STATUS_BADGE.planned;
  const profit = cycle.totalRevenue - cycle.totalCost;
  const now = new Date();
  const daysGrowing = cycle.sowingDate ? Math.floor((now.getTime() - new Date(cycle.sowingDate).getTime()) / 86400000) : 0;
  const daysToHarvest = cycle.expectedHarvestDate ? Math.ceil((new Date(cycle.expectedHarvestDate).getTime() - now.getTime()) / 86400000) : null;

  const costBreakdown = [
    { label: "বীজ/পোনা", cost: cycle.seedCost },
    { label: "সার/খাদ্য", cost: cycle.fertilizerCost },
    { label: "কীটনাশক/ওষুধ", cost: cycle.pesticideCost },
    { label: "সেচ", cost: cycle.irrigationCost },
    { label: "শ্রমিক", cost: cycle.laborCost },
    { label: "অন্যান্য", cost: cycle.otherCost },
    { label: "কার্যক্রম খরচ", cost: cycle.logs.reduce((s, l) => s + l.cost, 0) },
  ];

  const statusFlow = ["planned", "sowing", "growing", "harvesting", "completed"];
  const curIdx = statusFlow.indexOf(cycle.status);
  const nextStatus = curIdx < statusFlow.length - 1 ? statusFlow[curIdx + 1] : null;
  const nextLabel = { planned: "বপন শুরু", sowing: "বাড়ছে ✓", growing: "ফসল তোলা শুরু", harvesting: "সম্পন্ন" }[cycle.status];

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}><ArrowLeft size={16} /></button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold" style={{ color: S.text }}>{cycle.cropName}</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>{badge.label}</span>
          </div>
          <p className="text-xs" style={{ color: S.muted }}>{cycle.land.name}{cycle.season ? ` · ${cycle.season}` : ""}</p>
        </div>
        {nextStatus && (
          <button onClick={() => updateStatus(nextStatus)} className="px-3 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: G }}>{nextLabel} →</button>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        {daysGrowing > 0 && <div className="rounded-xl p-3 text-center border" style={{ backgroundColor: S.surface, borderColor: S.border }}><p className="text-lg font-bold" style={{ color: G }}>{daysGrowing}</p><p className="text-[10px]" style={{ color: S.muted }}>দিন বাড়ছে</p></div>}
        {daysToHarvest !== null && <div className="rounded-xl p-3 text-center border" style={{ backgroundColor: S.surface, borderColor: S.border }}><p className="text-lg font-bold" style={{ color: "#F59E0B" }}>{daysToHarvest > 0 ? daysToHarvest : 0}</p><p className="text-[10px]" style={{ color: S.muted }}>দিন বাকি</p></div>}
        <div className="rounded-xl p-3 text-center border" style={{ backgroundColor: S.surface, borderColor: S.border }}><p className="text-lg font-bold" style={{ color: profit >= 0 ? G : "#EF4444" }}>{profit >= 0 ? "+" : ""}{formatBDT(Math.abs(profit))}</p><p className="text-[10px]" style={{ color: S.muted }}>{profit >= 0 ? "লাভ" : "লোকসান"}</p></div>
      </div>

      {/* Cost breakdown */}
      <div className="rounded-2xl border p-4 space-y-2" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h3 className="text-sm font-bold" style={{ color: S.text }}>💰 খরচের হিসাব</h3>
        {costBreakdown.filter((c) => c.cost > 0).map((c) => (
          <div key={c.label} className="flex justify-between">
            <span className="text-xs" style={{ color: S.muted }}>{c.label}</span>
            <span className="text-xs font-semibold" style={{ color: S.text }}>{formatBDT(c.cost)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-2 border-t" style={{ borderColor: S.border }}>
          <span className="text-sm font-bold" style={{ color: S.text }}>মোট বিনিয়োগ</span>
          <span className="text-sm font-bold" style={{ color: G }}>{formatBDT(cycle.totalCost)}</span>
        </div>
        {cycle.totalRevenue > 0 && (
          <div className="flex justify-between">
            <span className="text-sm font-bold" style={{ color: S.text }}>মোট আয়</span>
            <span className="text-sm font-bold" style={{ color: G }}>{formatBDT(cycle.totalRevenue)}</span>
          </div>
        )}
        {profit !== 0 && (
          <div className="flex justify-between pt-2 border-t" style={{ borderColor: S.border }}>
            <span className="text-sm font-bold" style={{ color: S.text }}>নিট {profit >= 0 ? "লাভ" : "লোকসান"}</span>
            <span className="text-sm font-bold" style={{ color: profit >= 0 ? G : "#EF4444" }}>{profit >= 0 ? "+" : ""}{formatBDT(profit)}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
        {(["logs", "harvest"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all" style={{ backgroundColor: tab === t ? G : "transparent", color: tab === t ? "white" : S.muted }}>
            {t === "logs" ? `📋 কার্যক্রম লগ (${cycle.logs.length})` : `🌾 ফসল ও বিক্রি (${cycle.harvests.length})`}
          </button>
        ))}
      </div>

      {tab === "logs" && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => setLogModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: G }}><Plus size={14} /> কার্যক্রম লগ করুন</button>
          </div>
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            {cycle.logs.length === 0 ? (
              <div className="py-10 text-center"><p className="text-xs" style={{ color: S.muted }}>কোনো কার্যক্রম লগ হয়নি</p></div>
            ) : cycle.logs.map((log, i) => (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3" style={{ borderTop: i > 0 ? `1px solid ${S.border}` : "none" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F0FDF4" }}>
                  {log.weather === "rainy" ? "🌧️" : log.weather === "cloudy" ? "☁️" : "☀️"}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold" style={{ color: S.text }}>{log.description}</p>
                  {log.quantity && <p className="text-[10px] mt-0.5" style={{ color: S.muted }}>পরিমাণ: {log.quantity}</p>}
                  <p className="text-[10px] mt-0.5" style={{ color: S.muted }}>{new Date(log.activityDate).toLocaleDateString("bn-BD")} {log.laborCount ? `· ${log.laborCount} জন শ্রমিক` : ""}</p>
                </div>
                {log.cost > 0 && <span className="text-xs font-bold flex-shrink-0" style={{ color: "#EF4444" }}>-{formatBDT(log.cost)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "harvest" && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => setHarvestModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: G }}><Plus size={14} /> ফসল তোলা</button>
          </div>
          <div className="space-y-3">
            {cycle.harvests.length === 0 ? (
              <div className="rounded-2xl border py-10 text-center" style={{ backgroundColor: S.surface, borderColor: S.border }}><p className="text-xs" style={{ color: S.muted }}>এখনো ফসল তোলা হয়নি</p></div>
            ) : cycle.harvests.map((h) => {
              const soldKg = h.sellRecords.reduce((s, r) => s + r.quantityKg, 0);
              const remaining = h.quantityKg - soldKg;
              const revenue = h.sellRecords.reduce((s, r) => s + r.totalAmount, 0);
              return (
                <div key={h.id} className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold" style={{ color: S.text }}>{h.quantityKg} কেজি তোলা হয়েছে</p>
                      <p className="text-xs" style={{ color: S.muted }}>{new Date(h.harvestDate).toLocaleDateString("bn-BD")}{h.qualityGrade ? ` · গ্রেড-${h.qualityGrade}` : ""}</p>
                    </div>
                    <button onClick={() => setSaleHarvestId(h.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: G }}><Plus size={12} /> বিক্রি</button>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span style={{ color: G }}>বিক্রি: {soldKg} কেজি ({formatBDT(revenue)})</span>
                    {remaining > 0 && <span style={{ color: "#F59E0B" }}>বাকি: {remaining} কেজি</span>}
                  </div>
                  {h.sellRecords.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {h.sellRecords.map((r) => (
                        <div key={r.id} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: S.bg }}>
                          <span style={{ color: S.muted }}>{r.buyerName ?? "অজ্ঞাত"} · {r.quantityKg} কেজি @ ৳{r.pricePerKg}/কেজি</span>
                          <span style={{ color: G, fontWeight: 600 }}>{formatBDT(r.totalAmount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Log Modal */}
      {logModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border shadow-xl" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: S.border }}>
              <h2 className="font-bold text-sm" style={{ color: S.text }}>কার্যক্রম লগ করুন</h2>
              <button onClick={() => setLogModal(false)}><X size={16} style={{ color: S.muted }} /></button>
            </div>
            <form onSubmit={saveLog} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: S.muted }}>কার্যক্রমের ধরন</label>
                <div className="flex flex-wrap gap-1.5">
                  {ACTIVITY_CHIPS.map((chip) => (
                    <button type="button" key={chip.key} onClick={() => setLogForm({ ...logForm, activityType: chip.key })} className="px-3 py-1.5 rounded-xl text-xs font-semibold border" style={{ backgroundColor: logForm.activityType === chip.key ? G : S.surface, color: logForm.activityType === chip.key ? "white" : S.muted, borderColor: S.border }}>{chip.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>বিবরণ *</label>
                <input required value={logForm.description} onChange={(e) => setLogForm({ ...logForm, description: e.target.value })} placeholder="কী কাজ করা হলো?" className={inputCls} style={iS} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পরিমাণ (যদি থাকে)</label>
                  <input value={logForm.quantity} onChange={(e) => setLogForm({ ...logForm, quantity: e.target.value })} placeholder="২০ কেজি ইউরিয়া" className={inputCls} style={iS} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>খরচ (৳)</label>
                  <input type="number" value={logForm.cost} onChange={(e) => setLogForm({ ...logForm, cost: e.target.value })} placeholder="০" className={inputCls} style={iS} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>শ্রমিক সংখ্যা</label>
                  <input type="number" value={logForm.laborCount} onChange={(e) => setLogForm({ ...logForm, laborCount: e.target.value })} placeholder="৫" className={inputCls} style={iS} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>তারিখ</label>
                  <DatePicker value={logForm.activityDate} onChange={v => setLogForm({ ...logForm, activityDate: v })} className={inputCls} style={iS} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: S.muted }}>আবহাওয়া</label>
                <div className="flex gap-1.5">
                  {WEATHER_OPTIONS.map((w) => (
                    <button type="button" key={w.k} onClick={() => setLogForm({ ...logForm, weather: w.k })} className="flex-1 py-2 rounded-xl text-xs border" style={{ backgroundColor: logForm.weather === w.k ? "#F0FDF4" : S.surface, borderColor: logForm.weather === w.k ? G : S.border, color: logForm.weather === w.k ? G : S.muted, fontWeight: logForm.weather === w.k ? "bold" : "normal" }}>{w.l}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setLogModal(false)} className="flex-1 py-2.5 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2" style={{ backgroundColor: G }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} সেভ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Harvest Modal */}
      {harvestModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border shadow-xl" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: S.border }}>
              <h2 className="font-bold text-sm" style={{ color: S.text }}>ফসল তোলা রেকর্ড করুন</h2>
              <button onClick={() => setHarvestModal(false)}><X size={16} style={{ color: S.muted }} /></button>
            </div>
            <form onSubmit={saveHarvest} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ফসল তোলার তারিখ</label>
                  <DatePicker value={harvestForm.harvestDate} onChange={v => setHarvestForm({ ...harvestForm, harvestDate: v })} className={inputCls} style={iS} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পরিমাণ (কেজি) *</label>
                  <input required type="number" step="0.1" value={harvestForm.quantityKg} onChange={(e) => setHarvestForm({ ...harvestForm, quantityKg: e.target.value })} placeholder="৫০০" className={inputCls} style={iS} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>মান গ্রেড</label>
                  <select value={harvestForm.qualityGrade} onChange={(e) => setHarvestForm({ ...harvestForm, qualityGrade: e.target.value })} className={inputCls} style={iS}>
                    <option value="">নির্বাচন করুন</option>
                    <option value="A">A</option><option value="B">B</option><option value="C">C</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>সংরক্ষণস্থল</label>
                  <input value={harvestForm.storageLocation} onChange={(e) => setHarvestForm({ ...harvestForm, storageLocation: e.target.value })} placeholder="গুদামঘর" className={inputCls} style={iS} />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setHarvestModal(false)} className="flex-1 py-2.5 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2" style={{ backgroundColor: G }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <SproutIcon size={14} />} রেকর্ড করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Modal */}
      {saleHarvestId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border shadow-xl" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: S.border }}>
              <h2 className="font-bold text-sm" style={{ color: S.text }}>বিক্রি রেকর্ড করুন</h2>
              <button onClick={() => setSaleHarvestId(null)}><X size={16} style={{ color: S.muted }} /></button>
            </div>
            <form onSubmit={saveSale} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ক্রেতার নাম</label>
                  <input value={saleForm.buyerName} onChange={(e) => setSaleForm({ ...saleForm, buyerName: e.target.value })} placeholder="ক্রেতার নাম" className={inputCls} style={iS} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ফোন</label>
                  <input value={saleForm.buyerPhone} onChange={(e) => setSaleForm({ ...saleForm, buyerPhone: e.target.value })} placeholder="01XXXXXXXXX" className={inputCls} style={iS} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পরিমাণ (কেজি) *</label>
                  <input required type="number" step="0.1" value={saleForm.quantityKg} onChange={(e) => setSaleForm({ ...saleForm, quantityKg: e.target.value })} placeholder="১০০" className={inputCls} style={iS} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>মূল্য/কেজি (৳) *</label>
                  <input required type="number" step="0.01" value={saleForm.pricePerKg} onChange={(e) => setSaleForm({ ...saleForm, pricePerKg: e.target.value })} placeholder="৪০" className={inputCls} style={iS} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>তারিখ</label>
                  <DatePicker value={saleForm.saleDate} onChange={v => setSaleForm({ ...saleForm, saleDate: v })} className={inputCls} style={iS} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পেমেন্ট</label>
                  <select value={saleForm.paymentStatus} onChange={(e) => setSaleForm({ ...saleForm, paymentStatus: e.target.value })} className={inputCls} style={iS}>
                    <option value="paid">পরিশোধ</option>
                    <option value="due">বাকি</option>
                  </select>
                </div>
              </div>
              {saleForm.quantityKg && saleForm.pricePerKg && (
                <div className="rounded-xl px-3 py-2 text-sm font-bold" style={{ backgroundColor: "#F0FDF4", color: G }}>
                  মোট: {formatBDT(parseFloat(saleForm.quantityKg) * parseFloat(saleForm.pricePerKg))}
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setSaleHarvestId(null)} className="flex-1 py-2.5 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2" style={{ backgroundColor: G }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} বিক্রি নিশ্চিত
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
