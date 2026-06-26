"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Scale, Calendar, Clock, DollarSign, AlertCircle, CheckCircle, Lock } from "lucide-react";
import { formatBDT } from "@/lib/utils";

const S = {
  surface: "var(--c-surface)",
  border:  "var(--c-border)",
  text:    "var(--c-text)",
  muted:   "var(--c-text-muted)",
  primary: "#1D4ED8",
};

const CASE_TYPE_LABELS: Record<string, string> = {
  civil: "দেওয়ানী",
  criminal: "ফৌজদারী",
  family: "পারিবারিক",
  property: "সম্পত্তি",
  labor: "শ্রম",
  business: "বাণিজ্যিক",
  constitutional: "সাংবিধানিক",
  other: "অন্যান্য",
};

const PURPOSE_LABELS: Record<string, string> = {
  argument: "যুক্তিতর্ক",
  witness: "সাক্ষ্য",
  judgement: "রায়",
  adjournment: "মুলতবি",
  order: "আদেশ",
};

type HearingItem = {
  id: string;
  hearingDate: string;
  court: string | null;
  purpose: string | null;
  attended: boolean;
  note: string | null;
  case: {
    id: string;
    title: string;
    court: string;
    client: { name: string; phone: string };
  };
};

type OverdueFeeCase = {
  id: string;
  caseNumber: string;
  title: string;
  dueFee: number;
  client: { name: string; phone: string };
};

type DashStats = {
  activeCases: number;
  todayHearings: number;
  weekHearings: number;
  pendingFeeSum: number;
  todayHearingList: HearingItem[];
  upcomingHearings: HearingItem[];
  overdueFees: OverdueFeeCase[];
};

export default function DashboardLegal() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [marking, setMarking] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/legal/dashboard").then(r => r.json()).then(setStats).catch(console.error);
  }, []);

  const markAttended = async (caseId: string, hearingId: string) => {
    setMarking(hearingId);
    await fetch(`/api/legal/cases/${caseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_attended", hearingId }),
    });
    const fresh = await fetch("/api/legal/dashboard").then(r => r.json());
    setStats(fresh);
    setMarking(null);
  };

  if (!stats) return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  const today = new Date();
  const todayStr = today.toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-6">

      {/* Confidentiality Notice */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
        style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}
      >
        <Lock size={14} />
        <span>এই তথ্য সম্পূর্ণ গোপনীয়। শুধুমাত্র আপনার জন্য সংরক্ষিত।</span>
      </div>

      {/* Hero */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 60%, #2563EB 100%)" }}
      >
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-white/70 text-xs font-medium">{todayStr}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Scale size={20} className="text-white/80" />
              <h2 className="text-white text-xl font-bold">আইনি সেবা ড্যাশবোর্ড</h2>
            </div>
            <p className="text-white/70 text-sm mt-0.5">আজকের মামলা ও শুনানি পরিচালনা করুন</p>
          </div>

          <div className="flex gap-3">
            {[
              { label: "সক্রিয় মামলা", value: String(stats.activeCases), sub: "মামলা" },
              { label: "আজকের শুনানি", value: String(stats.todayHearings), sub: "শুনানি" },
              { label: "অপেক্ষমান ফি", value: formatBDT(stats.pendingFeeSum), sub: "বাকি" },
            ].map(c => (
              <div
                key={c.label}
                className="rounded-2xl px-4 py-3 text-center"
                style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
              >
                <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">{c.label}</p>
                <p className="text-white text-2xl font-bold leading-none">{c.value}</p>
                <p className="text-white/80 text-[11px] mt-1.5 font-medium">{c.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "সক্রিয় মামলা", value: stats.activeCases, icon: Scale, color: "#1D4ED8", bg: "#EFF6FF" },
          { label: "আজকের শুনানি", value: stats.todayHearings, icon: Calendar, color: "#7C3AED", bg: "#F5F3FF" },
          { label: "এই সপ্তাহে", value: stats.weekHearings, icon: Clock, color: "#0891B2", bg: "#ECFEFF" },
          { label: "অপেক্ষমান ফি", value: formatBDT(stats.pendingFeeSum), icon: DollarSign, color: "#DC2626", bg: "#FEF2F2", isStr: true },
        ].map(card => (
          <div
            key={card.label}
            className="rounded-2xl p-4"
            style={{ background: S.surface, border: `1px solid ${S.border}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium" style={{ color: S.muted }}>{card.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: card.bg }}>
                <card.icon size={15} style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: S.text }}>
              {card.isStr ? card.value : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[
          { href: "/cases",        label: "নতুন মামলা", color: "#1D4ED8", bg: "#EFF6FF" },
          { href: "/hearings",     label: "শুনানি সূচি", color: "#7C3AED", bg: "#F5F3FF" },
          { href: "/customers",   label: "ক্লায়েন্ট",   color: "#0891B2", bg: "#ECFEFF" },
          { href: "/hisab",        label: "হিসাব",        color: "#0F6E56", bg: "#E1F5EE" },
          { href: "/legal/reports",label: "রিপোর্ট",      color: "#D97706", bg: "#FEF3C7" },
          { href: "/settings",     label: "সেটিংস",       color: "#374151", bg: "#F3F4F6" },
        ].map(a => (
          <Link
            key={a.href}
            href={a.href}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: a.bg, color: a.color }}
          >
            {a.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Today's Hearings */}
        <div
          className="rounded-2xl p-5"
          style={{ background: S.surface, border: `1px solid ${S.border}` }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base" style={{ color: S.text }}>আজকের শুনানি</h3>
            <Link href="/hearings" className="text-xs font-medium" style={{ color: S.primary }}>সব দেখুন →</Link>
          </div>

          {stats.todayHearingList.length === 0 ? (
            <div className="text-center py-8" style={{ color: S.muted }}>
              <Calendar size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">আজ কোনো শুনানি নেই</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.todayHearingList.map(h => (
                <div
                  key={h.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl"
                  style={{ background: h.attended ? "#F0FDF4" : "#EFF6FF", border: `1px solid ${h.attended ? "#86EFAC" : "#BFDBFE"}` }}
                >
                  <div className="flex-1 min-w-0">
                    <Link href={`/cases/${h.case.id}`} className="font-semibold text-sm hover:underline truncate block" style={{ color: S.text }}>
                      {h.case.title.length > 40 ? h.case.title.slice(0, 40) + "…" : h.case.title}
                    </Link>
                    <p className="text-xs mt-0.5" style={{ color: S.muted }}>{h.case.client.name} • {h.case.court}</p>
                    {h.purpose && (
                      <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: "#DBEAFE", color: "#1E40AF" }}>
                        {PURPOSE_LABELS[h.purpose] ?? h.purpose}
                      </span>
                    )}
                  </div>
                  {h.attended ? (
                    <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg" style={{ background: "#DCFCE7", color: "#166534" }}>
                      <CheckCircle size={12} /> উপস্থিত
                    </span>
                  ) : (
                    <button
                      onClick={() => markAttended(h.case.id, h.id)}
                      disabled={marking === h.id}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50 flex-shrink-0"
                      style={{ background: "#1D4ED8", color: "#fff" }}
                    >
                      {marking === h.id ? "..." : "উপস্থিত হয়েছি"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming This Week */}
        <div
          className="rounded-2xl p-5"
          style={{ background: S.surface, border: `1px solid ${S.border}` }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base" style={{ color: S.text }}>এই সপ্তাহের শুনানি</h3>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
              {stats.upcomingHearings.length}টি
            </span>
          </div>

          {stats.upcomingHearings.length === 0 ? (
            <div className="text-center py-8" style={{ color: S.muted }}>
              <Clock size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">এই সপ্তাহে আর কোনো শুনানি নেই</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.upcomingHearings.map(h => {
                const d = new Date(h.hearingDate);
                const dayLabel = d.toLocaleDateString("bn-BD", { weekday: "short", day: "numeric", month: "short" });
                return (
                  <div
                    key={h.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "var(--c-bg)", border: `1px solid ${S.border}` }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-center"
                      style={{ background: "#EFF6FF", color: "#1D4ED8" }}
                    >
                      {dayLabel}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/cases/${h.case.id}`} className="font-medium text-sm hover:underline truncate block" style={{ color: S.text }}>
                        {h.case.title.length > 35 ? h.case.title.slice(0, 35) + "…" : h.case.title}
                      </Link>
                      <p className="text-xs" style={{ color: S.muted }}>{h.case.client.name} • {h.case.court ?? h.case.court}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Overdue Fees */}
      {stats.overdueFees.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: S.surface, border: `1px solid ${S.border}` }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={16} style={{ color: "#DC2626" }} />
            <h3 className="font-bold text-base" style={{ color: S.text }}>বকেয়া ফি (৩০ দিনের বেশি)</h3>
          </div>
          <div className="space-y-2">
            {stats.overdueFees.map(c => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl"
                style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
              >
                <div className="flex-1 min-w-0">
                  <Link href={`/cases/${c.id}`} className="font-semibold text-sm hover:underline truncate block" style={{ color: S.text }}>
                    {c.caseNumber} — {c.title.length > 40 ? c.title.slice(0, 40) + "…" : c.title}
                  </Link>
                  <p className="text-xs mt-0.5" style={{ color: S.muted }}>
                    {c.client.name} • {c.client.phone}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm" style={{ color: "#DC2626" }}>{formatBDT(c.dueFee)}</p>
                  <p className="text-xs" style={{ color: S.muted }}>বাকি</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
