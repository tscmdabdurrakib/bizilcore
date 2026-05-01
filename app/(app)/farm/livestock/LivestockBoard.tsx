"use client";

import { useEffect, useState } from "react";
import { Plus, X, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatBDT } from "@/lib/utils";

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", bg: "var(--c-bg)" };
const G = "#16A34A";

interface HealthLog { nextDueDate?: string | null; description: string }
interface Livestock {
  id: string; type: string; breed?: string | null; quantity: number; male?: number | null; female?: number | null;
  purchaseCost: number; currentValue?: number | null; location?: string | null; purpose?: string | null;
  isActive: boolean; notes?: string | null;
  healthLogs: HealthLog[];
}

const TYPE_EMOJI: Record<string, string> = {
  "গরু": "🐄", "ছাগল": "🐐", "ভেড়া": "🐑", "হাঁস": "🦆", "মুরগি": "🐓", "মাছ": "🐟", "অন্যান্য": "🐾",
};

export default function LivestockBoard() {
  const router = useRouter();
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: "গরু", breed: "", quantity: "", male: "", female: "", purchaseDate: "", purchaseCost: "", currentValue: "", location: "", purpose: "", notes: "" });
  const [logModal, setLogModal] = useState<string | null>(null);
  const [logForm, setLogForm] = useState({ logType: "vaccination", description: "", quantity: "", pricePerHead: "", cost: "", vetName: "", logDate: new Date().toISOString().split("T")[0], nextDueDate: "", note: "" });
  const [savingLog, setSavingLog] = useState(false);

  const load = async () => { const r = await fetch("/api/farm/livestock"); if (r.ok) setLivestock(await r.json()); setLoading(false); };
  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await fetch("/api/farm/livestock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false); setOpen(false); setForm({ type: "গরু", breed: "", quantity: "", male: "", female: "", purchaseDate: "", purchaseCost: "", currentValue: "", location: "", purpose: "", notes: "" }); load();
  }

  async function saveLog(e: React.FormEvent) {
    e.preventDefault(); setSavingLog(true);
    await fetch(`/api/farm/livestock/${logModal}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(logForm) });
    setSavingLog(false); setLogModal(null); load();
  }

  const inputCls = "w-full px-3 py-2 rounded-xl border text-sm outline-none";
  const iS = { backgroundColor: S.surface, borderColor: S.border, color: S.text };
  const now = new Date();
  const sevenDaysLater = new Date(now); sevenDaysLater.setDate(now.getDate() + 7);

  const LOG_TYPES = ["vaccination", "medicine", "feed", "birth", "death", "sale", "purchase", "observation"];
  const LOG_LABELS: Record<string, string> = { vaccination: "টিকা", medicine: "ওষুধ", feed: "খাবার", birth: "জন্ম", death: "মৃত্যু", sale: "বিক্রি", purchase: "ক্রয়", observation: "পর্যবেক্ষণ" };

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>🐄 পশু / মৎস্য / পোল্ট্রি</h1>
          <p className="text-xs mt-0.5" style={{ color: S.muted }}>মোট {livestock.length}টি গ্রুপ</p>
        </div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: G }}>
          <Plus size={16} /> যোগ করুন
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>
      ) : livestock.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: S.border }}>
          <p className="text-4xl mb-3">🐄</p>
          <p className="text-sm" style={{ color: S.muted }}>কোনো পশু/মৎস্য/পোল্ট্রি যোগ হয়নি</p>
          <button onClick={() => setOpen(true)} className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: G }}>যোগ করুন</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {livestock.map((ls) => {
            const emoji = TYPE_EMOJI[ls.type] ?? "🐾";
            const nextVax = ls.healthLogs[0]?.nextDueDate ? new Date(ls.healthLogs[0].nextDueDate) : null;
            const vaxDue = nextVax && nextVax <= sevenDaysLater;
            return (
              <div key={ls.id} className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: "#F0FDF4" }}>{emoji}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm" style={{ color: S.text }}>{ls.type}{ls.breed ? ` (${ls.breed})` : ""}</h3>
                      {vaxDue && <AlertCircle size={14} style={{ color: "#F59E0B" }} />}
                    </div>
                    <p className="text-lg font-bold mt-0.5" style={{ color: G }}>{ls.quantity} {ls.type.includes("মাছ") ? "কেজি" : "টি"}</p>
                    {(ls.male || ls.female) && <p className="text-xs" style={{ color: S.muted }}>পুরুষ: {ls.male ?? 0} · মহিলা: {ls.female ?? 0}</p>}
                    {ls.location && <p className="text-xs" style={{ color: S.muted }}>📍 {ls.location}</p>}
                    {ls.currentValue && <p className="text-xs" style={{ color: S.muted }}>মূল্য: {formatBDT(ls.currentValue)}</p>}
                    {vaxDue && nextVax && <p className="text-xs font-semibold mt-1" style={{ color: "#F59E0B" }}>⚠️ টিকা: {nextVax.toLocaleDateString("bn-BD")}</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setLogModal(ls.id); setLogForm({ logType: "vaccination", description: "", quantity: "", pricePerHead: "", cost: "", vetName: "", logDate: new Date().toISOString().split("T")[0], nextDueDate: "", note: "" }); }} className="flex-1 py-2 rounded-xl text-xs font-semibold border" style={{ borderColor: S.border, color: S.text }}>+ কার্যক্রম</button>
                  <button onClick={() => router.push(`/farm/livestock/${ls.id}`)} className="flex-1 py-2 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: G }}>বিস্তারিত</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Livestock Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border shadow-xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center justify-between p-5 border-b sticky top-0" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <h2 className="font-bold" style={{ color: S.text }}>পশু/মৎস্য/পোল্ট্রি যোগ করুন</h2>
              <button onClick={() => setOpen(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: S.muted }}>ধরন *</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["গরু", "ছাগল", "ভেড়া", "হাঁস", "মুরগি", "মাছ", "অন্যান্য"].map((t) => (
                      <button type="button" key={t} onClick={() => setForm({ ...form, type: t })} className="px-3 py-1.5 rounded-xl text-xs font-semibold border" style={{ backgroundColor: form.type === t ? G : S.surface, color: form.type === t ? "white" : S.muted, borderColor: S.border }}>{TYPE_EMOJI[t] ?? "🐾"} {t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>জাত/প্রজাতি</label>
                  <input value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} placeholder="দেশি / হলস্টেইন / ব্রয়লার" className={inputCls} style={iS} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>সংখ্যা *</label>
                  <input required type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="১০" className={inputCls} style={iS} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>উদ্দেশ্য</label>
                  <select value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className={inputCls} style={iS}>
                    <option value="">নির্বাচন করুন</option>
                    <option value="dairy">দুধ উৎপাদন</option>
                    <option value="meat">মাংস</option>
                    <option value="eggs">ডিম</option>
                    <option value="breeding">প্রজনন</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ক্রয় মূল্য (৳)</label>
                  <input type="number" value={form.purchaseCost} onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })} placeholder="৫০০০০" className={inputCls} style={iS} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>বর্তমান মূল্য (৳)</label>
                  <input type="number" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })} placeholder="৬০০০০" className={inputCls} style={iS} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>অবস্থান/শেড</label>
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="উত্তর শেড" className={inputCls} style={iS} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ক্রয়ের তারিখ</label>
                  <input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} className={inputCls} style={iS} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2" style={{ backgroundColor: G }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} যোগ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Modal */}
      {logModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border shadow-xl" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: S.border }}>
              <h2 className="font-bold text-sm" style={{ color: S.text }}>কার্যক্রম লগ করুন</h2>
              <button onClick={() => setLogModal(null)}><X size={16} style={{ color: S.muted }} /></button>
            </div>
            <form onSubmit={saveLog} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: S.muted }}>ধরন</label>
                <div className="flex flex-wrap gap-1.5">
                  {LOG_TYPES.map((t) => (
                    <button type="button" key={t} onClick={() => setLogForm({ ...logForm, logType: t })} className="px-3 py-1.5 rounded-xl text-xs font-semibold border" style={{ backgroundColor: logForm.logType === t ? G : S.surface, color: logForm.logType === t ? "white" : S.muted, borderColor: S.border }}>{LOG_LABELS[t]}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>বিবরণ *</label>
                <input required value={logForm.description} onChange={(e) => setLogForm({ ...logForm, description: e.target.value })} placeholder="বিস্তারিত লিখুন" className={inputCls} style={iS} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {["sale", "purchase", "birth", "death"].includes(logForm.logType) && (
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>সংখ্যা</label>
                    <input type="number" value={logForm.quantity} onChange={(e) => setLogForm({ ...logForm, quantity: e.target.value })} placeholder="৫" className={inputCls} style={iS} />
                  </div>
                )}
                {["sale", "purchase"].includes(logForm.logType) && (
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>মাথাপিছু মূল্য (৳)</label>
                    <input type="number" value={logForm.pricePerHead} onChange={(e) => setLogForm({ ...logForm, pricePerHead: e.target.value })} placeholder="৫০০০০" className={inputCls} style={iS} />
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>খরচ (৳)</label>
                  <input type="number" value={logForm.cost} onChange={(e) => setLogForm({ ...logForm, cost: e.target.value })} placeholder="০" className={inputCls} style={iS} />
                </div>
                {["vaccination", "medicine"].includes(logForm.logType) && (
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পশু চিকিৎসক</label>
                    <input value={logForm.vetName} onChange={(e) => setLogForm({ ...logForm, vetName: e.target.value })} placeholder="ডা. নাম" className={inputCls} style={iS} />
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
                <button type="button" onClick={() => setLogModal(null)} className="flex-1 py-2.5 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
                <button type="submit" disabled={savingLog} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2" style={{ backgroundColor: G }}>
                  {savingLog ? <Loader2 size={14} className="animate-spin" /> : null} সেভ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
