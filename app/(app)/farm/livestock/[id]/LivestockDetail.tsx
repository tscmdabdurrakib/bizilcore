"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, X, Save } from "lucide-react";
import { formatBDT } from "@/lib/utils";

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };
const G = "#16A34A";

interface LivestockLog { id: string; logType: string; description: string; quantity?: number | null; cost: number; totalAmount: number; vetName?: string | null; logDate: string; nextDueDate?: string | null }
interface LivestockItem {
  id: string; type: string; breed?: string | null; quantity: number; male?: number | null; female?: number | null;
  purchaseCost: number; currentValue?: number | null; location?: string | null; purpose?: string | null; notes?: string | null;
  healthLogs: LivestockLog[];
}

const TYPE_EMOJI: Record<string, string> = { "গরু": "🐄", "ছাগল": "🐐", "ভেড়া": "🐑", "হাঁস": "🦆", "মুরগি": "🐓", "মাছ": "🐟", "অন্যান্য": "🐾" };
const LOG_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  vaccination:  { label: "টিকা",       color: "#1D4ED8", bg: "#EFF6FF" },
  medicine:     { label: "ওষুধ",       color: "#7C3AED", bg: "#F5F3FF" },
  feed:         { label: "খাবার",      color: "#16A34A", bg: "#F0FDF4" },
  birth:        { label: "জন্ম",       color: "#059669", bg: "#ECFDF5" },
  death:        { label: "মৃত্যু",     color: "#DC2626", bg: "#FEF2F2" },
  sale:         { label: "বিক্রি",     color: "#16A34A", bg: "#DCFCE7" },
  purchase:     { label: "ক্রয়",       color: "#0369A1", bg: "#E0F2FE" },
  observation:  { label: "পর্যবেক্ষণ", color: "#6B7280", bg: "#F3F4F6" },
};

export default function LivestockDetail({ id }: { id: string }) {
  const router = useRouter();
  const [ls, setLs] = useState<LivestockItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [logModal, setLogModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logForm, setLogForm] = useState({ logType: "vaccination", description: "", quantity: "", pricePerHead: "", cost: "", vetName: "", logDate: new Date().toISOString().split("T")[0], nextDueDate: "", note: "" });

  const load = useCallback(async () => {
    const r = await fetch(`/api/farm/livestock/${id}`);
    if (r.ok) setLs(await r.json());
    setLoading(false);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function saveLog(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await fetch(`/api/farm/livestock/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(logForm) });
    setSaving(false); setLogModal(false); load();
  }

  const inputCls = "w-full px-3 py-2 rounded-xl border text-sm outline-none";
  const iS = { backgroundColor: S.surface, borderColor: S.border, color: S.text };
  const LOG_TYPES = ["vaccination", "medicine", "feed", "birth", "death", "sale", "purchase", "observation"];

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;
  if (!ls) return <div className="text-center py-20" style={{ color: S.muted }}>পাওয়া যায়নি</div>;

  const emoji = TYPE_EMOJI[ls.type] ?? "🐾";
  const lastVax = ls.healthLogs.find((l) => l.logType === "vaccination");
  const totalCost = ls.healthLogs.reduce((s, l) => s + l.cost, 0) + ls.purchaseCost;
  const totalSales = ls.healthLogs.filter((l) => l.logType === "sale").reduce((s, l) => s + l.totalAmount, 0);

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}><ArrowLeft size={16} /></button>
        <div className="flex-1">
          <h1 className="text-lg font-bold" style={{ color: S.text }}>{emoji} {ls.type}{ls.breed ? ` (${ls.breed})` : ""}</h1>
          <p className="text-xs" style={{ color: S.muted }}>{ls.quantity}টি{ls.location ? ` · ${ls.location}` : ""}</p>
        </div>
        <button onClick={() => setLogModal(true)} className="px-3 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: G }}><Plus size={14} className="inline mr-1" />কার্যক্রম</button>
      </div>

      {/* Info card */}
      <div className="rounded-2xl border p-4 grid grid-cols-2 sm:grid-cols-3 gap-3" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        {[
          ["মোট সংখ্যা", `${ls.quantity} টি`],
          ls.male !== null && ls.male !== undefined ? ["পুরুষ", `${ls.male} টি`] : null,
          ls.female !== null && ls.female !== undefined ? ["মহিলা", `${ls.female} টি`] : null,
          ["ক্রয় মূল্য", formatBDT(ls.purchaseCost)],
          ls.currentValue ? ["বর্তমান মূল্য", formatBDT(ls.currentValue)] : null,
          ls.purpose ? ["উদ্দেশ্য", ls.purpose] : null,
        ].filter(Boolean).map((item) => (
          <div key={item![0]}>
            <p className="text-[10px]" style={{ color: S.muted }}>{item![0]}</p>
            <p className="text-sm font-bold" style={{ color: S.text }}>{item![1]}</p>
          </div>
        ))}
      </div>

      {/* Summary pills */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>মোট খরচ: {formatBDT(totalCost)}</span>
        {totalSales > 0 && <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>বিক্রি: {formatBDT(totalSales)}</span>}
        {lastVax?.nextDueDate && <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ backgroundColor: "#FFF3DC", color: "#92400E" }}>পরবর্তী টিকা: {new Date(lastVax.nextDueDate).toLocaleDateString("bn-BD")}</span>}
      </div>

      {/* Activity timeline */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: S.border }}>
          <h3 className="text-sm font-bold" style={{ color: S.text }}>কার্যক্রম ইতিহাস ({ls.healthLogs.length})</h3>
        </div>
        {ls.healthLogs.length === 0 ? (
          <div className="py-10 text-center"><p className="text-xs" style={{ color: S.muted }}>কোনো কার্যক্রম নেই</p></div>
        ) : ls.healthLogs.map((log, i) => {
          const badge = LOG_LABELS[log.logType] ?? LOG_LABELS.observation;
          return (
            <div key={log.id} className="flex items-start gap-3 px-4 py-3" style={{ borderTop: i > 0 ? `1px solid ${S.border}` : "none" }}>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ backgroundColor: badge.bg, color: badge.color }}>{badge.label}</span>
              <div className="flex-1">
                <p className="text-xs font-semibold" style={{ color: S.text }}>{log.description}</p>
                {log.vetName && <p className="text-[10px]" style={{ color: S.muted }}>ডা. {log.vetName}</p>}
                <p className="text-[10px]" style={{ color: S.muted }}>{new Date(log.logDate).toLocaleDateString("bn-BD")}{log.nextDueDate ? ` · পরবর্তী: ${new Date(log.nextDueDate).toLocaleDateString("bn-BD")}` : ""}</p>
              </div>
              {(log.cost > 0 || log.totalAmount > 0) && (
                <span className="text-xs font-bold flex-shrink-0" style={{ color: log.logType === "sale" ? G : "#EF4444" }}>
                  {log.logType === "sale" ? "+" : "-"}{formatBDT(log.logType === "sale" ? log.totalAmount : log.cost)}
                </span>
              )}
            </div>
          );
        })}
      </div>

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
                <label className="text-xs font-medium mb-1.5 block" style={{ color: S.muted }}>ধরন</label>
                <div className="flex flex-wrap gap-1.5">
                  {LOG_TYPES.map((t) => {
                    const badge = LOG_LABELS[t] ?? LOG_LABELS.observation;
                    return (
                      <button type="button" key={t} onClick={() => setLogForm({ ...logForm, logType: t })} className="px-3 py-1.5 rounded-xl text-xs font-semibold border" style={{ backgroundColor: logForm.logType === t ? badge.color : S.surface, color: logForm.logType === t ? "white" : S.muted, borderColor: S.border }}>{badge.label}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>বিবরণ *</label>
                <input required value={logForm.description} onChange={(e) => setLogForm({ ...logForm, description: e.target.value })} className={inputCls} style={iS} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {["sale", "purchase", "birth", "death"].includes(logForm.logType) && (
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>সংখ্যা</label>
                    <input type="number" value={logForm.quantity} onChange={(e) => setLogForm({ ...logForm, quantity: e.target.value })} className={inputCls} style={iS} />
                  </div>
                )}
                {["sale", "purchase"].includes(logForm.logType) && (
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>মাথাপিছু মূল্য (৳)</label>
                    <input type="number" value={logForm.pricePerHead} onChange={(e) => setLogForm({ ...logForm, pricePerHead: e.target.value })} className={inputCls} style={iS} />
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>খরচ (৳)</label>
                  <input type="number" value={logForm.cost} onChange={(e) => setLogForm({ ...logForm, cost: e.target.value })} className={inputCls} style={iS} />
                </div>
                {["vaccination", "medicine"].includes(logForm.logType) && (
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পশু চিকিৎসক</label>
                    <input value={logForm.vetName} onChange={(e) => setLogForm({ ...logForm, vetName: e.target.value })} className={inputCls} style={iS} />
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>তারিখ</label>
                  <input type="date" value={logForm.logDate} onChange={(e) => setLogForm({ ...logForm, logDate: e.target.value })} className={inputCls} style={iS} />
                </div>
                {logForm.logType === "vaccination" && (
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পরবর্তী টিকার তারিখ</label>
                    <input type="date" value={logForm.nextDueDate} onChange={(e) => setLogForm({ ...logForm, nextDueDate: e.target.value })} className={inputCls} style={iS} />
                  </div>
                )}
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
    </div>
  );
}
