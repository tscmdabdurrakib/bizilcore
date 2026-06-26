"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Code2, FolderKanban, FileText, Clock, AlertTriangle,
  Plus, TrendingUp, DollarSign,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "#6366F1",
};

const STATUS_LABELS: Record<string, string> = {
  proposal: "প্রস্তাব",
  in_progress: "চলমান",
  review: "রিভিউ",
  revision: "রিভিশন",
  completed: "সম্পন্ন",
  on_hold: "বিরতি",
  cancelled: "বাতিল",
};

type DashData = {
  activeProjects: number;
  monthRevenueBDT: number;
  pendingInvoiceTotal: number;
  overdueProjects: number;
  projectsByStatus: Record<string, number>;
  recentProjects: {
    id: string; projectNumber: string; title: string; status: string;
    deadline: string | null; totalAmountBDT: number; currency: string; totalAmount: number;
    client: { name: string };
    milestones: { id: string; status: string }[];
  }[];
  upcomingDeadlines: {
    id: string; projectNumber: string; title: string; deadline: string; status: string;
    client: { name: string };
  }[];
  usdMonthRevenue: number;
};

export default function DashboardFreelance() {
  const [data, setData] = useState<DashData | null>(null);

  useEffect(() => {
    fetch("/api/freelance/dashboard").then(r => r.json()).then(setData).catch(console.error);
  }, []);

  if (!data) return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "#E0E7FF", borderTopColor: S.primary }} />
    </div>
  );

  const statCards = [
    { label: "সক্রিয় প্রজেক্ট", value: String(data.activeProjects), sub: "in progress + review", icon: FolderKanban, color: S.primary, bg: "#EEF2FF" },
    { label: "এই মাসের আয়", value: formatBDT(data.monthRevenueBDT), sub: data.usdMonthRevenue > 0 ? `+ $${data.usdMonthRevenue.toFixed(0)} USD` : "BDT", icon: TrendingUp, color: "#10B981", bg: "#ECFDF5" },
    { label: "অপেক্ষমান ইনভয়েস", value: formatBDT(data.pendingInvoiceTotal), sub: "পাঠানো ও দেখা হয়েছে", icon: FileText, color: "#F59E0B", bg: "#FFFBEB" },
    { label: "Overdue প্রজেক্ট", value: String(data.overdueProjects), sub: "Deadline পেরিয়ে গেছে", icon: AlertTriangle, color: "#EF4444", bg: "#FEF2F2" },
  ];

  const statusOrder = ["proposal", "in_progress", "review", "revision", "completed"];

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-6">
      {/* Hero */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 55%, #3730A3 100%)" }}
      >
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10 bg-white" />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full opacity-10 bg-white" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
              <Code2 size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-white text-lg font-bold">IT / ফ্রিল্যান্স</h2>
              <p className="text-white/70 text-sm">প্রজেক্ট ম্যানেজমেন্ট</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/freelance/projects"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "rgba(255,255,255,0.2)" }}>
              <Plus size={14} /> প্রজেক্ট
            </Link>
            <Link href="/freelance/invoices"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "rgba(255,255,255,0.2)" }}>
              <Plus size={14} /> Invoice
            </Link>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="rounded-2xl border p-4" style={{ background: S.surface, borderColor: S.border }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: c.bg }}>
                  <Icon size={16} style={{ color: c.color }} />
                </div>
                <p className="text-xs font-medium leading-tight" style={{ color: S.muted }}>{c.label}</p>
              </div>
              <p className="text-xl font-bold" style={{ color: c.color }}>{c.value}</p>
              <p className="text-xs mt-0.5" style={{ color: S.muted }}>{c.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Overdue Alert */}
      {data.overdueProjects > 0 && (
        <div className="rounded-xl border border-red-200 p-3 flex items-center gap-3" style={{ background: "#FEF2F2" }}>
          <AlertTriangle size={18} style={{ color: "#DC2626" }} />
          <p className="text-sm font-semibold text-red-700">
            {data.overdueProjects}টি প্রজেক্টের deadline পেরিয়ে গেছে!
          </p>
          <Link href="/freelance/projects?status=in_progress" className="ml-auto text-sm font-bold text-red-700 underline">
            দেখুন
          </Link>
        </div>
      )}

      {/* USD income note */}
      {data.usdMonthRevenue > 0 && (
        <div className="rounded-xl border p-3 flex items-center gap-3" style={{ background: "#F0FDF4", borderColor: "#86EFAC" }}>
          <DollarSign size={16} style={{ color: "#059669" }} />
          <p className="text-sm font-medium text-green-800">
            এই মাসে USD আয়: <strong>${data.usdMonthRevenue.toLocaleString()}</strong>
          </p>
        </div>
      )}

      {/* Pipeline mini */}
      <div className="rounded-2xl border p-4" style={{ background: S.surface, borderColor: S.border }}>
        <h2 className="font-semibold mb-3" style={{ color: S.text }}>প্রজেক্ট পাইপলাইন</h2>
        <div className="grid grid-cols-5 gap-2">
          {statusOrder.map(status => {
            const count = data.projectsByStatus[status] ?? 0;
            const colors: Record<string, { bg: string; color: string }> = {
              proposal:    { bg: "#F9FAFB", color: "#6B7280" },
              in_progress: { bg: "#EFF6FF", color: "#3B82F6" },
              review:      { bg: "#F5F3FF", color: "#8B5CF6" },
              revision:    { bg: "#FFFBEB", color: "#F59E0B" },
              completed:   { bg: "#ECFDF5", color: "#10B981" },
            };
            const c = colors[status] ?? { bg: "#F9FAFB", color: "#6B7280" };
            return (
              <Link key={status} href={`/freelance/projects?status=${status}`}
                className="rounded-xl p-3 text-center border transition-all hover:shadow-sm"
                style={{ background: c.bg, borderColor: c.color + "30" }}>
                <p className="text-2xl font-bold" style={{ color: c.color }}>{count}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: S.muted }}>{STATUS_LABELS[status]}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Recent Projects */}
        <div className="rounded-2xl border p-4" style={{ background: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold" style={{ color: S.text }}>সাম্প্রতিক প্রজেক্ট</h2>
            <Link href="/freelance/projects" className="text-xs font-semibold" style={{ color: S.primary }}>সব দেখুন</Link>
          </div>
          {data.recentProjects.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: S.muted }}>কোনো প্রজেক্ট নেই</p>
          ) : (
            <div className="space-y-2">
              {data.recentProjects.map(p => {
                const done = p.milestones.filter(m => ["approved", "paid"].includes(m.status)).length;
                return (
                  <Link key={p.id} href={`/freelance/projects/${p.id}`}
                    className="block rounded-xl p-3 border hover:shadow-sm transition-all"
                    style={{ borderColor: S.border }}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-mono font-bold" style={{ color: S.primary }}>{p.projectNumber}</p>
                        <p className="font-medium text-sm truncate" style={{ color: S.text }}>{p.title}</p>
                        <p className="text-xs" style={{ color: S.muted }}>{p.client.name}</p>
                      </div>
                      <p className="text-sm font-bold whitespace-nowrap" style={{ color: S.text }}>
                        {p.currency !== "BDT" ? `${p.currency} ${p.totalAmount.toLocaleString()}` : formatBDT(p.totalAmountBDT)}
                      </p>
                    </div>
                    {p.milestones.length > 0 && (
                      <div className="mt-2">
                        <div className="h-1 rounded-full" style={{ background: "#E0E7FF" }}>
                          <div className="h-1 rounded-full" style={{
                            width: `${(done / p.milestones.length) * 100}%`,
                            background: S.primary
                          }} />
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="rounded-2xl border p-4" style={{ background: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold" style={{ color: S.text }}>আসন্ন Deadline (৭ দিন)</h2>
            <Clock size={16} style={{ color: S.muted }} />
          </div>
          {data.upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: S.muted }}>কোনো আসন্ন deadline নেই</p>
          ) : (
            <div className="space-y-2">
              {data.upcomingDeadlines.map(p => {
                const daysLeft = Math.ceil((new Date(p.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <Link key={p.id} href={`/freelance/projects/${p.id}`}
                    className="block rounded-xl p-3 border hover:shadow-sm transition-all"
                    style={{ borderColor: daysLeft <= 2 ? "#FECACA" : S.border, background: daysLeft <= 2 ? "#FEF2F2" : undefined }}>
                    <div className="flex justify-between items-center gap-2">
                      <div>
                        <p className="font-medium text-sm" style={{ color: S.text }}>{p.title}</p>
                        <p className="text-xs" style={{ color: S.muted }}>{p.client.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: daysLeft <= 2 ? "#DC2626" : "#F59E0B" }}>
                          {daysLeft}d
                        </p>
                        <p className="text-xs" style={{ color: S.muted }}>
                          {new Date(p.deadline).toLocaleDateString("bn-BD")}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { href: "/freelance/projects", icon: FolderKanban, label: "প্রজেক্ট" },
          { href: "/freelance/invoices", icon: FileText, label: "Invoice" },
          { href: "/freelance/timelog", icon: Clock, label: "টাইম লগ" },
          { href: "/freelance/reports", icon: TrendingUp, label: "রিপোর্ট" },
        ].map(a => {
          const Icon = a.icon;
          return (
            <Link key={a.href} href={a.href}
              className="rounded-xl border p-3 flex flex-col items-center gap-1.5 hover:shadow-sm transition-all"
              style={{ background: S.surface, borderColor: S.border }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#EEF2FF" }}>
                <Icon size={18} style={{ color: S.primary }} />
              </div>
              <p className="text-xs font-medium text-center" style={{ color: S.text }}>{a.label}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
