"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Receipt, CalendarCheck2, BookOpenCheck, Users, TrendingUp, Loader2, AlertTriangle } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface BatchStat { id: string; name: string; studentCount: number; presentToday: number; feePaidCount: number; feeTotalCount: number; feePct: number }
interface Stats {
  totalStudents: number;
  attendancePct: number | null;
  totalTakenToday: number;
  dueStudentCount: number;
  totalDueAmount: number;
  thisMonthCollected: number;
  batchStats: BatchStat[];
  currentMonth: string;
}

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  bg: "var(--c-bg)",
};

export default function DashboardSchool() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/school/dashboard-stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: "#2563EB" }} />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: "মোট শিক্ষার্থী",     value: `${stats.totalStudents}জন`,                 color: "#2563EB", bg: "#EFF6FF", icon: GraduationCap, href: "/school/students"   },
    { label: "আজকের উপস্থিতি",     value: stats.attendancePct !== null ? `${stats.attendancePct}%` : "নেওয়া হয়নি", color: "#0F6E56", bg: "#E1F5EE", icon: CalendarCheck2, href: "/school/attendance" },
    { label: "ফি বাকি (এই মাস)",   value: `${stats.dueStudentCount}জন`,                color: "#EF4444", bg: "#FEE2E2", icon: Receipt,      href: "/school/fees"       },
    { label: "এই মাসের আয়",       value: formatBDT(stats.thisMonthCollected),          color: "#7C3AED", bg: "#F5F3FF", icon: TrendingUp,   href: "/school/fees"       },
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-2xl p-4 border flex flex-col gap-2 hover:opacity-90 transition-opacity" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: c.bg }}>
                <c.icon size={15} style={{ color: c.color }} />
              </div>
              <p className="text-[11px] font-medium" style={{ color: S.muted }}>{c.label}</p>
            </div>
            <p className="text-xl font-bold" style={{ color: c.color }}>{c.value}</p>
          </Link>
        ))}
      </div>

      {/* Fee Alert */}
      {stats.dueStudentCount > 0 && (
        <div className="rounded-2xl p-4 border flex items-start gap-3" style={{ backgroundColor: "#FFF7ED", borderColor: "#FED7AA" }}>
          <AlertTriangle size={18} style={{ color: "#EA580C" }} className="mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#9A3412" }}>
              এই মাসে {stats.dueStudentCount} জনের ফি বাকি (৳{stats.totalDueAmount.toLocaleString("bn-BD")})
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#C2410C" }}>দ্রুত ফি সংগ্রহ করুন</p>
          </div>
          <Link href="/school/fees" className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: "#EA580C" }}>
            ফি দেখুন
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/school/students?new=1",   label: "শিক্ষার্থী ভর্তি", icon: GraduationCap, color: "#2563EB" },
          { href: "/school/fees",             label: "ফি সংগ্রহ",        icon: Receipt,       color: "#0F6E56" },
          { href: "/school/attendance",       label: "উপস্থিতি নিন",     icon: CalendarCheck2, color: "#7C3AED" },
          { href: "/school/exams",            label: "পরীক্ষার ফলাফল",  icon: BookOpenCheck, color: "#EF9F27" },
        ].map((action) => (
          <Link key={action.label} href={action.href} className="rounded-2xl p-4 border flex flex-col items-center gap-2 text-center hover:opacity-90 transition-opacity" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${action.color}15` }}>
              <action.icon size={18} style={{ color: action.color }} />
            </div>
            <p className="text-xs font-semibold" style={{ color: S.text }}>{action.label}</p>
          </Link>
        ))}
      </div>

      {/* Batch Summary */}
      {stats.batchStats.length > 0 && (
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold" style={{ color: S.text }}>ব্যাচ ওভারভিউ</h2>
            <Link href="/school/batches" className="text-xs font-semibold" style={{ color: "#2563EB" }}>সব দেখুন →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ color: S.muted }}>
                  <th className="text-left pb-2 font-medium">ব্যাচ</th>
                  <th className="text-center pb-2 font-medium">শিক্ষার্থী</th>
                  <th className="text-center pb-2 font-medium">আজ উপস্থিত</th>
                  <th className="text-right pb-2 font-medium">ফি %</th>
                </tr>
              </thead>
              <tbody>
                {stats.batchStats.map((b) => (
                  <tr key={b.id} className="border-t" style={{ borderColor: S.border }}>
                    <td className="py-2 font-semibold" style={{ color: S.text }}>{b.name}</td>
                    <td className="py-2 text-center" style={{ color: S.muted }}>{b.studentCount}</td>
                    <td className="py-2 text-center">
                      <span className="font-semibold" style={{ color: b.presentToday > 0 ? "#0F6E56" : S.muted }}>
                        {b.presentToday}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{
                          backgroundColor: b.feePct >= 80 ? "#E1F5EE" : b.feePct >= 50 ? "#FFF3DC" : "#FEE2E2",
                          color: b.feePct >= 80 ? "#085041" : b.feePct >= 50 ? "#633806" : "#791F1F",
                        }}
                      >
                        {b.feePct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats.batchStats.length === 0 && (
        <div className="rounded-2xl p-8 border text-center" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <Users size={32} className="mx-auto mb-3" style={{ color: "#2563EB" }} />
          <p className="font-semibold mb-1" style={{ color: S.text }}>এখনো কোনো ব্যাচ তৈরি হয়নি</p>
          <p className="text-xs mb-4" style={{ color: S.muted }}>প্রথমে একটি ব্যাচ তৈরি করুন, তারপর শিক্ষার্থী ভর্তি করুন</p>
          <Link href="/school/batches" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: "#2563EB" }}>
            <GraduationCap size={15} /> ব্যাচ তৈরি করুন
          </Link>
        </div>
      )}
    </div>
  );
}
