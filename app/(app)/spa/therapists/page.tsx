"use client";

import { useEffect, useState, useCallback } from "react";
import { UserCog, Loader2, RefreshCw, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import Link from "next/link";

interface Therapist {
  id: string;
  name: string;
  email: string;
  jobTitle: string | null;
  phone: string | null;
  isActive: boolean;
  monthSessions: number;
  monthRevenue: number;
  todaySessions: number;
  status: "in_session" | "available";
  todaySchedule: { time: string; status: string }[];
}

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)",
  text: "var(--c-text)", muted: "var(--c-text-muted)",
};
const SPA_COLOR = "#9333EA";
const SPA_BG = "#FAF5FF";

const SPECIALIZATIONS = [
  "Swedish Massage", "Deep Tissue", "Aromatherapy",
  "Reflexology", "Facial", "Waxing", "Body Treatment", "Stone Massage",
];

export default function SpaTherapistsPage() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/spa/therapists");
    const data = await res.json();
    setTherapists(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const inSession = therapists.filter(t => t.status === "in_session").length;
  const available = therapists.filter(t => t.status === "available").length;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${SPA_COLOR} 0%, #7E22CE 100%)` }}>
            <UserCog size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>থেরাপিস্ট</h1>
            <p className="text-xs" style={{ color: S.muted }}>সেশন ও পারফরম্যান্স পর্যালোচনা</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl border" style={{ borderColor: S.border }}>
            <RefreshCw size={16} style={{ color: S.muted }} />
          </button>
          <Link href="/hr"
            className="flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-semibold border"
            style={{ borderColor: SPA_COLOR, color: SPA_COLOR, backgroundColor: SPA_BG }}>
            <UserCog size={15} /> স্টাফ ম্যানেজমেন্ট
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "মোট থেরাপিস্ট", value: therapists.length, color: SPA_COLOR, bg: SPA_BG },
          { label: "সেশনে আছেন", value: inSession, color: "#F59E0B", bg: "#FFFBEB" },
          { label: "উপলব্ধ", value: available, color: "#10B981", bg: "#ECFDF5" },
        ].map(c => (
          <div key={c.label} className="rounded-2xl border p-4 text-center" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
            <p className="text-xs mt-1" style={{ color: S.muted }}>{c.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 size={28} className="animate-spin" style={{ color: SPA_COLOR }} />
        </div>
      ) : therapists.length === 0 ? (
        <div className="py-16 flex flex-col items-center rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: SPA_BG }}>
            <UserCog size={28} style={{ color: SPA_COLOR }} />
          </div>
          <p className="font-semibold text-sm mb-1" style={{ color: S.text }}>কোনো থেরাপিস্ট নেই</p>
          <p className="text-xs mb-4" style={{ color: S.muted }}>HR সেকশনে গিয়ে স্টাফ যোগ করুন</p>
          <Link href="/hr"
            className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ background: `linear-gradient(135deg, ${SPA_COLOR} 0%, #7E22CE 100%)` }}>
            স্টাফ যোগ করুন
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {therapists.map(t => (
            <div key={t.id} className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${SPA_COLOR} 0%, #7E22CE 100%)` }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: S.text }}>{t.name}</p>
                    <p className="text-xs" style={{ color: S.muted }}>{t.jobTitle ?? "থেরাপিস্ট"}</p>
                    {t.phone && <p className="text-xs" style={{ color: S.muted }}>{t.phone}</p>}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                  style={{
                    backgroundColor: t.status === "in_session" ? "#FFFBEB" : "#ECFDF5",
                    color: t.status === "in_session" ? "#D97706" : "#10B981",
                  }}>
                  {t.status === "in_session" ? "সেশনে আছেন" : "উপলব্ধ"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: "এই মাসের সেশন", value: `${t.monthSessions}টি`, icon: CheckCircle2, color: SPA_COLOR },
                  { label: "মাসের আয়", value: formatBDT(t.monthRevenue), icon: TrendingUp, color: "#0891B2" },
                  { label: "আজকের সেশন", value: `${t.todaySessions}টি`, icon: Clock, color: "#D97706" },
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl p-2.5 text-center"
                    style={{ backgroundColor: "var(--c-bg)" }}>
                    <stat.icon size={14} className="mx-auto mb-1" style={{ color: stat.color }} />
                    <p className="text-sm font-bold" style={{ color: S.text }}>{stat.value}</p>
                    <p className="text-[10px]" style={{ color: S.muted }}>{stat.label}</p>
                  </div>
                ))}
              </div>

              {t.todaySchedule.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium mb-1.5" style={{ color: S.muted }}>আজকের সূচি</p>
                  <div className="flex flex-wrap gap-1.5">
                    {t.todaySchedule.map((s, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor:
                            s.status === "in_progress" ? "#FFFBEB" :
                            s.status === "completed" ? "#F3F4F6" : SPA_BG,
                          color:
                            s.status === "in_progress" ? "#D97706" :
                            s.status === "completed" ? "#6B7280" : SPA_COLOR,
                        }}>
                        {s.time}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h3 className="font-semibold text-sm mb-3" style={{ color: S.text }}>থেরাপিস্ট স্পেশালাইজেশন</h3>
        <div className="flex flex-wrap gap-2">
          {SPECIALIZATIONS.map(s => (
            <span key={s} className="text-xs px-3 py-1.5 rounded-full border"
              style={{ borderColor: S.border, color: S.muted }}>
              {s}
            </span>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: S.muted }}>
          স্টাফের জব টাইটেল আপডেট করতে <Link href="/hr" className="font-semibold" style={{ color: SPA_COLOR }}>HR সেকশন</Link> এ যান।
        </p>
      </div>
    </div>
  );
}
