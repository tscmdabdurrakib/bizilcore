"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, BedDouble, TrendingUp, Clock, Stethoscope, Loader2, AlertTriangle } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface DoctorStat { id: string; name: string; specialization: string; waiting: number; withDoctor: number; done: number }
interface WardInfo { total: number; occupied: number }
interface Stats {
  todayOPD: number;
  admittedIPD: number;
  waitingOPD: number;
  totalRevenue: number;
  doctorStats: DoctorStat[];
  wardMap: Record<string, WardInfo>;
  totalBeds: number;
  occupiedBeds: number;
  todayAdmissions: { admissionNumber: string; patient: { name: string }; ward: string; bedNumber: string }[];
  todayDischarges: { admissionNumber: string; patient: { name: string }; ward: string }[];
}

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", bg: "var(--c-bg)" };

export default function DashboardHospital() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hospital/dashboard-stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: "#378ADD" }} />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: "আজকের OPD রোগী", value: `${stats.todayOPD}জন`, color: "#378ADD", bg: "#EFF6FF", icon: Activity, href: "/hospital/opd" },
    { label: "ভর্তি রোগী", value: `${stats.admittedIPD}জন`, color: "#7C3AED", bg: "#F5F3FF", icon: BedDouble, href: "/hospital/ipd" },
    { label: "আজকের আয়", value: formatBDT(stats.totalRevenue), color: "#0F6E56", bg: "#E1F5EE", icon: TrendingUp, href: "/hospital/billing" },
    { label: "অপেক্ষমাণ রোগী", value: `${stats.waitingOPD}জন`, color: "#F59E0B", bg: "#FFFBEB", icon: Clock, href: "/hospital/opd" },
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-6">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope size={15} style={{ color: "#378ADD" }} />
            <h3 className="text-sm font-semibold" style={{ color: S.text }}>আজকের ডাক্তার OPD</h3>
          </div>
          {stats.doctorStats.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: S.muted }}>কোনো ডাক্তার নেই</p>
          ) : (
            <div className="space-y-2">
              {stats.doctorStats.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: S.border }}>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: S.text }}>{d.name}</p>
                    <p className="text-[11px]" style={{ color: S.muted }}>{d.specialization}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#FAEEDA", color: "#633806" }}>অপেক্ষা: {d.waiting}</span>
                    <span className="px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#E1F5EE", color: "#085041" }}>সম্পন্ন: {d.done}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center gap-2 mb-3">
            <BedDouble size={15} style={{ color: "#7C3AED" }} />
            <h3 className="text-sm font-semibold" style={{ color: S.text }}>বেড অকুপেন্সি</h3>
          </div>
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: S.muted }}>মোট: {stats.totalBeds} বেড</span>
              <span className="text-xs font-semibold" style={{ color: "#7C3AED" }}>{stats.occupiedBeds} ভর্তি</span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ backgroundColor: S.border }}>
              <div className="h-2 rounded-full transition-all" style={{ width: `${stats.totalBeds > 0 ? (stats.occupiedBeds / stats.totalBeds) * 100 : 0}%`, backgroundColor: "#7C3AED" }} />
            </div>
          </div>
          <div className="space-y-1.5">
            {Object.entries(stats.wardMap).map(([ward, info]) => (
              <div key={ward} className="flex items-center justify-between text-xs">
                <span style={{ color: S.text }}>{ward}</span>
                <div className="flex items-center gap-1">
                  <div className="w-16 h-1.5 rounded-full" style={{ backgroundColor: S.border }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${info.total > 0 ? (info.occupied / info.total) * 100 : 0}%`, backgroundColor: "#378ADD" }} />
                  </div>
                  <span style={{ color: S.muted }}>{info.occupied}/{info.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(stats.todayAdmissions.length > 0 || stats.todayDischarges.length > 0) && (
        <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: S.text }}>আজকের ভর্তি ও ছাড়পত্র</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.todayAdmissions.length > 0 && (
              <div>
                <p className="text-[11px] font-medium mb-1.5" style={{ color: "#378ADD" }}>নতুন ভর্তি ({stats.todayAdmissions.length})</p>
                {stats.todayAdmissions.slice(0, 3).map((a) => (
                  <div key={a.admissionNumber} className="text-xs py-1 border-b last:border-0" style={{ borderColor: S.border, color: S.text }}>
                    <span className="font-medium">{a.patient.name}</span>
                    <span style={{ color: S.muted }}> · {a.ward} · বেড {a.bedNumber}</span>
                  </div>
                ))}
              </div>
            )}
            {stats.todayDischarges.length > 0 && (
              <div>
                <p className="text-[11px] font-medium mb-1.5" style={{ color: "#0F6E56" }}>ছাড়পত্র ({stats.todayDischarges.length})</p>
                {stats.todayDischarges.slice(0, 3).map((a) => (
                  <div key={a.admissionNumber} className="text-xs py-1 border-b last:border-0" style={{ borderColor: S.border, color: S.text }}>
                    <span className="font-medium">{a.patient.name}</span>
                    <span style={{ color: S.muted }}> · {a.ward}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {stats.admittedIPD === 0 && stats.todayOPD === 0 && (
        <div className="rounded-2xl border p-6 text-center" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <AlertTriangle size={20} className="mx-auto mb-2" style={{ color: S.muted }} />
          <p className="text-sm font-medium" style={{ color: S.text }}>আজকে কোনো রোগী নেই</p>
          <div className="flex gap-2 justify-center mt-3">
            <Link href="/hospital/opd" className="px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: "#378ADD" }}>OPD শুরু করুন</Link>
            <Link href="/hospital/ipd" className="px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: "#7C3AED" }}>রোগী ভর্তি করুন</Link>
          </div>
        </div>
      )}
    </div>
  );
}
