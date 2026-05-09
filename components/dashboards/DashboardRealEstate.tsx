"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, Users, HandCoins, TrendingUp, Phone, AlertCircle, Plus, ChevronRight } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface FollowUp { id: string; clientName: string; clientPhone: string; stage: string; followUpDate: string | null; requirement?: string | null; }

interface Stats {
  activeProperties: number; monthLeads: number; activeDeals: number; monthCommission: number;
  leadsByStage: { stage: string; count: number }[];
  propsByStatus: { status: string; count: number }[];
  followUpDue: FollowUp[];
}

const RE_COLOR = "#0891B2";
const RE_LIGHT = "#E0F2FE";
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };

const STAGE_META: Record<string, { label: string; color: string }> = {
  new:             { label: "নতুন",          color: "#6B7280" },
  contacted:       { label: "যোগাযোগ হয়েছে", color: "#3B82F6" },
  site_visit_done: { label: "Site Visit",    color: "#8B5CF6" },
  negotiating:     { label: "আলোচনায়",      color: "#F59E0B" },
  deal_done:       { label: "Deal হয়েছে",   color: "#10B981" },
  lost:            { label: "Lost",          color: "#EF4444" },
};

function daysAgo(dateStr: string | null) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  return d;
}

export default function DashboardRealEstate({ shopName, userName, userGender }: {
  shopName: string; userName: string; userGender?: string | null;
}) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/realestate/dashboard").then(r => r.json()).then(setStats).catch(console.error);
  }, []);

  const greeting = userGender === "আপু" ? "আপু, স্বাগতম!" : userGender === "ভাই" ? "ভাইয়া, স্বাগতম!" : "স্বাগতম!";

  const statCards = [
    { label: "সক্রিয় Property",      value: stats?.activeProperties ?? 0,               icon: Home,       color: RE_COLOR,  bg: RE_LIGHT },
    { label: "নতুন Lead (এই মাস)",    value: stats?.monthLeads ?? 0,                     icon: Users,      color: "#8B5CF6", bg: "#F5F3FF" },
    { label: "চলমান Deal",            value: stats?.activeDeals ?? 0,                    icon: HandCoins,  color: "#F59E0B", bg: "#FFFBEB" },
    { label: "এই মাসের কমিশন",        value: formatBDT(stats?.monthCommission ?? 0),     icon: TrendingUp, color: "#10B981", bg: "#ECFDF5" },
  ];

  const STAGES = ["new", "contacted", "site_visit_done", "negotiating", "deal_done"];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-6">
      {/* Hero Banner */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${RE_COLOR} 0%, #0369A1 55%, #075985 100%)` }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10 bg-white" />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full opacity-10 bg-white" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-white/70 text-xs font-medium">রিয়েল এস্টেট ড্যাশবোর্ড</p>
            <h2 className="text-white text-xl font-bold mt-0.5">{greeting}</h2>
            <p className="text-white/80 text-sm mt-0.5">{userName} — {shopName}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/realestate/properties?new=1"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "#fff" }}>
              <Plus size={15} /> নতুন Property
            </Link>
            <Link href="/realestate/leads?new=1"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: "rgba(255,255,255,0.13)", color: "#fff" }}>
              <Plus size={15} /> নতুন Lead
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl p-4 border shadow-sm" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: s.bg }}>
                <Icon size={18} style={{ color: s.color }} />
              </div>
              <p className="text-xl font-black" style={{ color: S.text }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: S.muted }}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Lead Pipeline */}
      <div className="rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm" style={{ color: S.text }}>Lead Pipeline</h3>
          <Link href="/realestate/leads" className="text-xs font-semibold" style={{ color: RE_COLOR }}>সব দেখুন →</Link>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {STAGES.map(stage => {
            const meta = STAGE_META[stage];
            const count = stats?.leadsByStage.find(r => r.stage === stage)?.count ?? 0;
            return (
              <Link key={stage} href={`/realestate/leads?stage=${stage}`}
                className="text-center p-3 rounded-xl transition-all hover:opacity-80"
                style={{ backgroundColor: `${meta.color}15` }}>
                <p className="text-2xl font-black" style={{ color: meta.color }}>{count}</p>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: meta.color }}>{meta.label}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Property Status */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: S.text }}>Property Status</h3>
          <div className="space-y-2">
            {[
              { key: "available",         label: "Available",          color: "#10B981" },
              { key: "under_negotiation", label: "Under Negotiation",  color: "#F59E0B" },
              { key: "sold",              label: "Sold",               color: "#6B7280" },
              { key: "rented",            label: "Rented",             color: "#3B82F6" },
            ].map(ps => {
              const count = stats?.propsByStatus.find(r => r.status === ps.key)?.count ?? 0;
              return (
                <div key={ps.key} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: S.text }}>{ps.label}</span>
                  <span className="text-sm font-bold px-3 py-0.5 rounded-full" style={{ backgroundColor: `${ps.color}15`, color: ps.color }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: S.text }}>Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/realestate/properties", label: "সব Property",   color: RE_COLOR,  bg: RE_LIGHT },
              { href: "/realestate/leads",      label: "সব Lead",       color: "#8B5CF6", bg: "#F5F3FF" },
              { href: "/realestate/deals",      label: "Deal তৈরি",     color: "#F59E0B", bg: "#FFFBEB" },
              { href: "/realestate/owners",     label: "Owner তালিকা",  color: "#10B981", bg: "#ECFDF5" },
            ].map(q => (
              <Link key={q.href} href={q.href}
                className="rounded-xl p-3 text-center text-xs font-bold border transition-all hover:shadow-sm"
                style={{ backgroundColor: q.bg, borderColor: q.color + "40", color: q.color }}>
                {q.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Follow-up Due */}
      {(stats?.followUpDue?.length ?? 0) > 0 && (
        <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: S.border }}>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} style={{ color: "#F59E0B" }} />
              <h3 className="font-bold text-sm" style={{ color: S.text }}>Follow-up বাকি</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: "#FFFBEB", color: "#F59E0B" }}>
                {stats?.followUpDue.length}টি
              </span>
            </div>
            <Link href="/realestate/leads" className="text-xs font-semibold" style={{ color: RE_COLOR }}>সব দেখুন →</Link>
          </div>
          <div className="divide-y" style={{ borderColor: S.border }}>
            {stats?.followUpDue.slice(0, 5).map(lead => {
              const days = daysAgo(lead.followUpDate);
              const overdue = days !== null && days > 0;
              return (
                <div key={lead.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: STAGE_META[lead.stage]?.color + "15", color: STAGE_META[lead.stage]?.color }}>
                        {STAGE_META[lead.stage]?.label ?? lead.stage}
                      </span>
                      {overdue && <span className="text-xs font-bold text-red-500">{days}d overdue</span>}
                    </div>
                    <p className="text-sm font-bold mt-0.5" style={{ color: S.text }}>{lead.clientName}</p>
                    {lead.requirement && <p className="text-xs truncate" style={{ color: S.muted }}>{lead.requirement}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a href={`tel:${lead.clientPhone}`}
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: RE_LIGHT }}>
                      <Phone size={13} style={{ color: RE_COLOR }} />
                    </a>
                    <Link href={`/realestate/leads`}
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: RE_LIGHT }}>
                      <ChevronRight size={13} style={{ color: RE_COLOR }} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
