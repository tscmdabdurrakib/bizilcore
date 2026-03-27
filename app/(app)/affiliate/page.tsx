"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, MousePointer, Users, DollarSign, Clock,
  CheckCircle, AlertCircle, ExternalLink, Copy, Crown,
  Edit2, X, Send, ChevronRight, Wallet
} from "lucide-react";

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)", bg: "var(--c-bg)" };

interface DailyStat { date: string; clicks: number; signups: number; earnings: number; }
interface Payout { id: string; amount: number; status: string; bkashNumber: string; paidAt: string | null; createdAt: string; }
interface Conversion { plan: string | null; commission: number | null; date: string; }

interface AffiliateData {
  affiliate: {
    id: string; slug: string; status: string; commissionRate: number;
    totalClicks: number; totalSignups: number; totalEarnings: number; pendingPayout: number;
    bkashNumber: string | null; approvedAt: string | null; rejectedReason: string | null;
    payouts: Payout[];
  } | null;
  dailyStats: DailyStat[];
  commissionRates: { pro: number; business: number };
  recentConversions: Conversion[];
}

export default function AffiliatePage() {
  const [data, setData] = useState<AffiliateData | null>(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [showBkashEdit, setShowBkashEdit] = useState(false);
  const [bkash, setBkash] = useState("");
  const [copied, setCopied] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  function load() {
    fetch("/api/affiliate")
      .then(r => r.json())
      .then(d => {
        if (d.locked) { setLocked(true); return; }
        setData(d);
        if (d.affiliate?.bkashNumber) setBkash(d.affiliate.bkashNumber);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function affiliateLink() {
    // Uses the tracking endpoint so every click is recorded before redirecting to signup
    return typeof window !== "undefined" ? `${window.location.origin}/api/affiliate/track?ref=${data?.affiliate?.slug}` : "";
  }

  function copyLink() {
    navigator.clipboard.writeText(affiliateLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    const msg = encodeURIComponent(`আমি BizilCore দিয়ে আমার Facebook business অনেক সহজে manage করছি! তুমিও try করো। আমার link দিয়ে sign up করলে special discount পাবে: ${affiliateLink()}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  function shareFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(affiliateLink())}`, "_blank");
  }

  async function apply() {
    if (!bkash.trim()) { showToast("error", "bKash নম্বর দিন"); return; }
    setApplying(true);
    const res = await fetch("/api/affiliate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bkashNumber: bkash }),
    });
    const d = await res.json();
    setApplying(false);
    if (!res.ok) { showToast("error", d.error ?? "সমস্যা হয়েছে"); return; }
    showToast("success", "আবেদন জমা হয়েছে! Admin approval-এর জন্য অপেক্ষা করুন।");
    setShowApplyForm(false);
    load();
  }

  async function updateBkash() {
    if (!bkash.trim()) { showToast("error", "bKash নম্বর দিন"); return; }
    const res = await fetch("/api/affiliate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bkashNumber: bkash }),
    });
    if (!res.ok) { showToast("error", "আপডেট সমস্যা"); return; }
    showToast("success", "bKash নম্বর আপডেট হয়েছে");
    setShowBkashEdit(false);
    load();
  }

  async function requestPayout() {
    setRequestingPayout(true);
    const res = await fetch("/api/affiliate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "requestPayout" }),
    });
    const d = await res.json();
    setRequestingPayout(false);
    if (!res.ok) { showToast("error", d.error ?? "সমস্যা হয়েছে"); return; }
    showToast("success", "Payout request পাঠানো হয়েছে! Admin process করবেন।");
    load();
  }

  if (loading) return (
    <div className="animate-pulse space-y-4 max-w-2xl">
      {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl bg-gray-100" />)}
    </div>
  );

  if (locked) return (
    <div className="max-w-md">
      <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#F0FBF6" }}>
          <TrendingUp size={28} style={{ color: S.primary }} />
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: S.text }}>Affiliate Program</h2>
        <p className="text-sm mb-6" style={{ color: S.secondary }}>
          Affiliate program শুধুমাত্র Pro বা Business plan-এ পাওয়া যায়।
        </p>
        <div className="space-y-2 text-left rounded-2xl p-4 mb-6" style={{ backgroundColor: S.bg }}>
          {["প্রতি Pro signup — ৳৫০ commission", "প্রতি Business signup — ৳১৫০ commission", "Minimum payout ৳৫০০ via bKash", "Real-time tracking dashboard"].map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm" style={{ color: S.text }}>
              <span style={{ color: S.primary }}>✓</span> {f}
            </div>
          ))}
        </div>
        <a href="/settings?tab=subscription" className="block w-full py-3 rounded-xl text-white font-medium text-center flex items-center justify-center gap-2" style={{ backgroundColor: S.primary }}>
          <Crown size={16} /> Pro-তে Upgrade করুন
        </a>
      </div>
    </div>
  );

  const aff = data?.affiliate;
  const cr = data?.commissionRates ?? { pro: 50, business: 150 };

  return (
    <div className="max-w-2xl space-y-5">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg" style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>{toast.msg}</div>}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>Affiliate Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: S.muted }}>আপনার link share করে income করুন</p>
        </div>
        <button onClick={() => { setLoading(true); load(); }} disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 disabled:opacity-50"
          style={{ borderColor: S.border, color: S.muted }}>
          <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
      </div>

      {/* Commission Info Card */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: "#F0FBF6", border: "1px solid #A7F3D0" }}>
        <h3 className="font-semibold text-sm mb-3" style={{ color: "#0F6E56" }}>Commission Rates</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center"><p className="text-2xl font-bold" style={{ color: "#0F6E56" }}>৳{cr.pro}</p><p className="text-xs mt-0.5" style={{ color: "#065F46" }}>Pro Signup</p></div>
          <div className="text-center"><p className="text-2xl font-bold" style={{ color: "#0F6E56" }}>৳{cr.business}</p><p className="text-xs mt-0.5" style={{ color: "#065F46" }}>Business Signup</p></div>
        </div>
      </div>

      {/* No affiliate yet */}
      {!aff && (
        <div className="rounded-2xl p-6" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
          <h3 className="font-semibold mb-3" style={{ color: S.text }}>Affiliate Program-এ যোগ দিন</h3>
          {!showApplyForm ? (
            <button onClick={() => setShowApplyForm(true)} className="w-full py-3 rounded-xl text-white font-medium text-sm" style={{ backgroundColor: S.primary }}>
              আবেদন করুন
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: S.text }}>bKash নম্বর (payout-এর জন্য) *</label>
                <input type="tel" value={bkash} onChange={e => setBkash(e.target.value)} placeholder="01XXXXXXXXX"
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowApplyForm(false)} className="flex-1 py-2.5 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.secondary }}>বাতিল</button>
                <button onClick={apply} disabled={applying} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ backgroundColor: S.primary }}>
                  {applying ? "জমা হচ্ছে..." : "আবেদন করুন"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {aff && (
        <>
          {/* Status */}
          <div className="rounded-2xl p-4 flex items-start gap-3" style={{
            backgroundColor: aff.status === "approved" ? "#E1F5EE" : aff.status === "pending" ? "#FFF8E7" : "#FEE2E2",
            border: `1px solid ${aff.status === "approved" ? "#A7F3D0" : aff.status === "pending" ? "#FDE68A" : "#FCA5A5"}`
          }}>
            {aff.status === "approved" ? <CheckCircle size={18} style={{ color: "#059669" }} /> :
              aff.status === "pending" ? <Clock size={18} style={{ color: "#D97706" }} /> :
                <AlertCircle size={18} style={{ color: "#DC2626" }} />}
            <div>
              <p className="font-medium text-sm" style={{ color: aff.status === "approved" ? "#065F46" : aff.status === "pending" ? "#92600A" : "#7F1D1D" }}>
                {aff.status === "approved" ? "✓ Affiliate Account Active — share করুন এবং earn করুন!" :
                  aff.status === "pending" ? "আবেদন পর্যালোচনা হচ্ছে (১-৩ কার্যদিবস)" :
                    "আবেদন প্রত্যাখ্যান করা হয়েছে"}
              </p>
              {aff.rejectedReason && <p className="text-xs mt-0.5" style={{ color: "#7F1D1D" }}>{aff.rejectedReason}</p>}
            </div>
          </div>

          {aff.status === "approved" && (
            <>
              {/* Affiliate Link */}
              <div className="rounded-2xl p-5" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
                <p className="text-sm font-semibold mb-3" style={{ color: S.text }}>আপনার Affiliate Link</p>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 h-10 rounded-xl px-3 text-xs flex items-center overflow-hidden" style={{ backgroundColor: S.bg, color: S.secondary }}>
                    <span className="truncate">{affiliateLink()}</span>
                  </div>
                  <button onClick={copyLink} className="h-10 px-4 rounded-xl text-white text-sm font-medium flex items-center gap-1.5 flex-shrink-0" style={{ backgroundColor: S.primary }}>
                    <Copy size={14} /> {copied ? "Copied!" : "Copy"}
                  </button>
                  <a href={affiliateLink()} target="_blank" rel="noopener noreferrer"
                    className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: S.bg }}>
                    <ExternalLink size={15} style={{ color: S.secondary }} />
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={shareWhatsApp} className="py-2.5 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2" style={{ backgroundColor: "#25D366" }}>
                    <Send size={14} /> WhatsApp
                  </button>
                  <button onClick={shareFacebook} className="py-2.5 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2" style={{ backgroundColor: "#1877F2" }}>
                    <ChevronRight size={14} /> Facebook
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: MousePointer, label: "মোট Click", value: aff.totalClicks },
                  { icon: Users, label: "মোট Signup", value: aff.totalSignups },
                  { icon: DollarSign, label: "মোট Earnings", value: `৳${aff.totalEarnings.toFixed(0)}` },
                  { icon: Clock, label: "Pending Payout", value: `৳${aff.pendingPayout.toFixed(0)}` },
                ].map(stat => (
                  <div key={stat.label} className="rounded-2xl p-5" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon size={15} style={{ color: S.primary }} />
                      <span className="text-xs" style={{ color: S.muted }}>{stat.label}</span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: S.text }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Daily Click Chart (last 14 days) */}
              {data?.dailyStats && data.dailyStats.length > 0 && (
                <div className="rounded-2xl p-5" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
                  <p className="text-sm font-semibold mb-4" style={{ color: S.text }}>শেষ ১৪ দিনের Clicks</p>
                  <div className="flex items-end gap-1 h-24">
                    {data.dailyStats.slice(-14).map((d, i) => {
                      const maxClicks = Math.max(...data.dailyStats.slice(-14).map(x => x.clicks), 1);
                      const height = Math.max((d.clicks / maxClicks) * 100, 2);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full rounded-t" style={{ height: `${height}%`, backgroundColor: d.signups > 0 ? "#0F6E56" : "#D1FAE5", minHeight: "4px" }} title={`${d.date}: ${d.clicks} clicks, ${d.signups} signups`} />
                          {i % 2 === 0 && <span className="text-[8px]" style={{ color: S.muted }}>{d.date.slice(5)}</span>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: S.muted }}>
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: "#D1FAE5" }} /> Click
                    </div>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: S.muted }}>
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: "#0F6E56" }} /> Signup (conversion)
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Conversions */}
              {data?.recentConversions && data.recentConversions.length > 0 && (
                <div className="rounded-2xl" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
                  <p className="px-5 pt-5 pb-3 text-sm font-semibold" style={{ color: S.text }}>সাম্প্রতিক Conversion</p>
                  <div className="divide-y" style={{ borderColor: S.border }}>
                    {data.recentConversions.map((c, i) => (
                      <div key={i} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: c.plan === "business" ? "#FFF3DC" : "#E1F5EE", color: c.plan === "business" ? "#EF9F27" : "#0F6E56" }}>
                            {c.plan ?? "—"} plan
                          </span>
                          <p className="text-xs mt-0.5" style={{ color: S.muted }}>{new Date(c.date).toLocaleDateString("bn-BD")}</p>
                        </div>
                        <p className="font-semibold text-sm" style={{ color: "#0F6E56" }}>+৳{(c.commission ?? 0).toFixed(0)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payout Section */}
              <div className="rounded-2xl p-5" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold" style={{ color: S.text }}>Payout তথ্য</p>
                  {!showBkashEdit && (
                    <button onClick={() => setShowBkashEdit(true)} className="flex items-center gap-1 text-xs" style={{ color: S.primary }}>
                      <Edit2 size={12} /> bKash পরিবর্তন
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ backgroundColor: S.bg }}>
                  <Wallet size={16} style={{ color: S.primary }} />
                  {showBkashEdit ? (
                    <div className="flex-1 flex gap-2">
                      <input type="tel" value={bkash} onChange={e => setBkash(e.target.value)} placeholder="01XXXXXXXXX"
                        className="flex-1 h-9 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                      <button onClick={updateBkash} className="px-3 rounded-xl text-white text-sm" style={{ backgroundColor: S.primary }}>সেভ</button>
                      <button onClick={() => setShowBkashEdit(false)} className="p-1.5"><X size={14} style={{ color: S.muted }} /></button>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: S.text }}>{aff.bkashNumber ?? "bKash নম্বর দেওয়া হয়নি"}</p>
                      <p className="text-xs" style={{ color: S.muted }}>bKash নম্বর</p>
                    </div>
                  )}
                </div>

                {aff.pendingPayout >= 500 ? (
                  <button onClick={requestPayout} disabled={requestingPayout}
                    className="w-full py-3 rounded-xl text-white font-medium text-sm disabled:opacity-60" style={{ backgroundColor: S.primary }}>
                    {requestingPayout ? "Request পাঠানো হচ্ছে..." : `৳${aff.pendingPayout.toFixed(0)} Payout Request করুন`}
                  </button>
                ) : (
                  <p className="text-xs text-center" style={{ color: S.muted }}>
                    Minimum ৳৫০০ pending থাকলে payout request করা যাবে। এখন: <strong>৳{aff.pendingPayout.toFixed(0)}</strong>
                  </p>
                )}

                {/* Payout History */}
                {aff.payouts && aff.payouts.length > 0 && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: S.border }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: S.muted }}>Payout ইতিহাস</p>
                    <div className="space-y-2">
                      {aff.payouts.map(p => (
                        <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ backgroundColor: S.bg }}>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: S.text }}>৳{p.amount.toFixed(0)}</p>
                            <p className="text-xs" style={{ color: S.muted }}>{p.bkashNumber} · {new Date(p.createdAt).toLocaleDateString("bn-BD")}</p>
                          </div>
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{
                            backgroundColor: p.status === "paid" ? "#E1F5EE" : "#FFF8E7",
                            color: p.status === "paid" ? "#059669" : "#D97706"
                          }}>
                            {p.status === "paid" ? "✓ পরিশোধিত" : "Processing"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Pending status tips */}
          {aff.status === "pending" && (
            <div className="rounded-2xl p-5" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
              <h3 className="font-semibold text-sm mb-3" style={{ color: S.text }}>অপেক্ষার সময়ে কী করবেন?</h3>
              <div className="space-y-2">
                {["আপনার bKash নম্বর সঠিক আছে কিনা নিশ্চিত করুন", "বন্ধুদের বলুন যে আপনি affiliate program-এ যোগ দিচ্ছেন", "Approval পেলে email এবং SMS পাবেন"].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm" style={{ color: S.secondary }}>
                    <span style={{ color: S.primary }}>•</span> {tip}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t" style={{ borderColor: S.border }}>
                <p className="text-xs font-medium mb-1.5" style={{ color: S.text }}>আপনার bKash নম্বর:</p>
                {!showBkashEdit ? (
                  <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: S.bg }}>
                    <span className="text-sm font-mono" style={{ color: S.text }}>{aff.bkashNumber ?? "দেওয়া হয়নি"}</span>
                    <button onClick={() => setShowBkashEdit(true)} className="text-xs" style={{ color: S.primary }}>পরিবর্তন করুন</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input type="tel" value={bkash} onChange={e => setBkash(e.target.value)} placeholder="01XXXXXXXXX"
                      className="flex-1 h-9 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                    <button onClick={updateBkash} className="px-3 rounded-xl text-white text-sm" style={{ backgroundColor: S.primary }}>সেভ</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
