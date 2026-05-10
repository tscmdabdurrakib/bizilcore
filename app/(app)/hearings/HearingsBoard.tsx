"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Calendar, Clock, CheckCircle, Scale, Users } from "lucide-react";

const PURPOSE_LABELS: Record<string, string> = {
  argument: "যুক্তিতর্ক",
  witness: "সাক্ষ্য",
  judgement: "রায়",
  adjournment: "মুলতবি",
  order: "আদেশ",
};

const VIEW_TABS = [
  { value: "today",    label: "আজ" },
  { value: "week",     label: "এই সপ্তাহ" },
  { value: "month",    label: "এই মাস" },
  { value: "upcoming", label: "সব আসন্ন" },
];

type Hearing = {
  id: string;
  hearingDate: string;
  court: string | null;
  purpose: string | null;
  attended: boolean;
  note: string | null;
  case: {
    id: string;
    caseNumber: string;
    title: string;
    court: string;
    status: string;
    client: { id: string; name: string; phone: string };
  };
};

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  bg: "var(--c-bg)",
  primary: "#1D4ED8",
};

export default function HearingsBoard() {
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("week");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/legal/hearings?view=${view}`);
    const d = await r.json();
    setHearings(d.hearings ?? []);
    setLoading(false);
  }, [view]);

  useEffect(() => { load(); }, [load]);

  const grouped = hearings.reduce<Record<string, Hearing[]>>((acc, h) => {
    const day = new Date(h.hearingDate).toDateString();
    if (!acc[day]) acc[day] = [];
    acc[day].push(h);
    return acc;
  }, {});

  const sortedDays = Object.keys(grouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-6">

      <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium" style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}>
        <Scale size={13} />
        <span>এই তথ্য সম্পূর্ণ গোপনীয়। শুধুমাত্র আপনার জন্য সংরক্ষিত।</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>শুনানি সূচি</h1>
          <p className="text-sm" style={{ color: S.muted }}>{hearings.length}টি শুনানি</p>
        </div>
        <Link
          href="/cases"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: S.primary }}
        >
          <Scale size={14} /> মামলা তালিকা
        </Link>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {VIEW_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setView(t.value)}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={view === t.value
              ? { background: S.primary, color: "#fff" }
              : { background: S.surface, color: S.muted, border: `1px solid ${S.border}` }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : hearings.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <Calendar size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">এই সময়ে কোনো শুনানি নেই</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDays.map(day => {
            const d = new Date(day);
            const isToday = d.toDateString() === new Date().toDateString();
            const isTomorrow = d.toDateString() === new Date(Date.now() + 86400000).toDateString();
            const dayLabel = isToday ? "আজ" : isTomorrow ? "আগামীকাল"
              : d.toLocaleDateString("bn-BD", { weekday: "long", day: "numeric", month: "long" });

            return (
              <div key={day}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={isToday
                      ? { background: S.primary, color: "#fff" }
                      : { background: S.surface, color: S.text, border: `1px solid ${S.border}` }
                    }
                  >
                    {dayLabel}
                  </div>
                  <div className="flex-1 h-px" style={{ background: S.border }} />
                  <span className="text-xs" style={{ color: S.muted }}>{grouped[day].length}টি</span>
                </div>

                <div className="space-y-2">
                  {grouped[day].map(h => (
                    <div
                      key={h.id}
                      className="flex items-start gap-3 p-4 rounded-2xl"
                      style={{
                        background: h.attended ? "#F0FDF4" : S.surface,
                        border: `1px solid ${h.attended ? "#86EFAC" : S.border}`,
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: h.attended ? "#DCFCE7" : "#EFF6FF" }}
                      >
                        {h.attended
                          ? <CheckCircle size={18} style={{ color: "#16A34A" }} />
                          : <Calendar size={18} style={{ color: "#1D4ED8" }} />
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              href={`/cases/${h.case.id}`}
                              className="font-semibold text-sm hover:underline"
                              style={{ color: S.text }}
                            >
                              {h.case.title.length > 50 ? h.case.title.slice(0, 50) + "…" : h.case.title}
                            </Link>
                            <p className="text-xs mt-0.5" style={{ color: S.muted }}>
                              {h.case.caseNumber} • {h.case.client.name}
                            </p>
                          </div>
                          {h.attended && (
                            <span className="flex-shrink-0 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#DCFCE7", color: "#166534" }}>
                              <CheckCircle size={10} /> উপস্থিত
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {h.purpose && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
                              {PURPOSE_LABELS[h.purpose] ?? h.purpose}
                            </span>
                          )}
                          <span className="text-xs flex items-center gap-1" style={{ color: S.muted }}>
                            <Users size={10} /> {h.case.court}
                          </span>
                        </div>

                        {h.note && <p className="text-xs mt-1.5" style={{ color: S.muted }}>{h.note}</p>}
                      </div>

                      <Link
                        href={`/cases/${h.case.id}`}
                        className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium"
                        style={{ background: "#EFF6FF", color: "#1D4ED8" }}
                      >
                        বিস্তারিত
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
