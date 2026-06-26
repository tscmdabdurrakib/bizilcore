"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Search, User, Clock, ChevronLeft, ChevronRight, RefreshCw, ActivityIcon } from "lucide-react";
import { PageShell, StatCard, Card, Badge, Button, Input, EmptyState } from "@/components/ui";

const S = {
  bg: "var(--c-bg)", surface: "var(--c-surface)", border: "var(--c-border)",
  text: "var(--c-text)", secondary: "var(--c-text-sub)", muted: "var(--c-text-muted)",
  primary: "var(--c-primary)", primaryLight: "var(--c-primary-light)",
};

interface LogEntry {
  id: string;
  action: string;
  detail: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

const ACTION_META: Record<string, { bg: string; color: string; label: string }> = {
  order:    { bg: "#E8F5F0", color: "#0F6E56", label: "অর্ডার" },
  product:  { bg: "#EEF3FF", color: "#2D5FBF", label: "পণ্য" },
  customer: { bg: "#FFF3DC", color: "#92600A", label: "কাস্টমার" },
  payment:  { bg: "#E8F9EF", color: "#1D7A4A", label: "পেমেন্ট" },
  supplier: { bg: "#F5E8FF", color: "#7A2E9A", label: "সাপ্লায়ার" },
  purchase: { bg: "#FFE8E8", color: "#9A2E2E", label: "ক্রয়" },
  settings: { bg: "#F0F0F0", color: "#555555", label: "সেটিংস" },
  staff:    { bg: "#E8F0FF", color: "#2E5F9A", label: "স্টাফ" },
  default:  { bg: "#F3F4F6", color: "#6B7280", label: "অন্যান্য" },
};

function getActionMeta(action: string) {
  const key = Object.keys(ACTION_META).find(k => action.toLowerCase().includes(k));
  return ACTION_META[key ?? "default"];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("bn-BD", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "এইমাত্র";
  if (mins < 60) return `${mins} মিনিট আগে`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ঘণ্টা আগে`;
  return `${Math.floor(hrs / 24)} দিন আগে`;
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("action", search);
    const r = await fetch(`/api/activity-log?${params}`);
    const d = await r.json();
    setLogs(d.logs ?? []);
    setTotal(d.total ?? 0);
    setPages(d.pages ?? 1);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <PageShell
      title="Activity Log"
      subtitle="কে কখন কী করেছে — সম্পূর্ণ Audit Trail"
      actions={
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={load} aria-label="রিফ্রেশ" />
      }
      stats={
        <StatCard label="মোট রেকর্ড" value={total} icon={ClipboardList} accent="green" />
      }
    >
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: S.muted }} />
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Action-এ খুঁজুন... (যেমন: order, product, customer)"
          className="pl-10"
        />
      </div>

      <Card padding="none">
        {loading ? (
          <div className="divide-y" style={{ borderColor: S.border }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex items-start gap-4 px-5 py-4 animate-pulse" style={{ backgroundColor: S.surface }}>
                <div className="w-9 h-9 rounded-xl flex-shrink-0" style={{ backgroundColor: S.border }} />
                <div className="flex-1 space-y-2 py-0.5">
                  <div className="h-3.5 rounded-lg w-1/4" style={{ backgroundColor: S.border }} />
                  <div className="h-3 rounded-lg w-2/3" style={{ backgroundColor: S.bg }} />
                  <div className="h-3 rounded-lg w-1/3" style={{ backgroundColor: S.bg }} />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState icon={ClipboardList} title="কোনো Activity Log নেই" description="অর্ডার, পণ্য, কাস্টমার সম্পর্কিত কাজ করলে এখানে দেখাবে" />
        ) : (
          <div className="divide-y" style={{ borderColor: S.border }}>
            {logs.map((log) => {
              const meta = getActionMeta(log.action);
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-4 px-5 py-4 transition-colors"
                  style={{ backgroundColor: S.surface, borderLeft: `3px solid ${meta.color}20` }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = S.bg)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = S.surface)}
                >
                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: meta.bg }}
                  >
                    <ActivityIcon size={15} style={{ color: meta.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="info">{log.action}</Badge>
                    </div>
                    {log.detail && (
                      <p className="text-sm leading-relaxed" style={{ color: S.text }}>{log.detail}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: S.secondary }}>
                        <User size={11} />
                        {log.user.name || log.user.email}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: S.muted }}>
                        <Clock size={11} />
                        {timeAgo(log.createdAt)}
                      </span>
                      <span className="text-xs" style={{ color: S.muted }}>
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs" style={{ color: S.muted }}>
            পৃষ্ঠা {page}/{pages} · মোট {total} রেকর্ড
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium disabled:opacity-40 transition-opacity"
              style={{ borderColor: S.border, backgroundColor: S.surface, color: S.secondary }}
            >
              <ChevronLeft size={14} /> পূর্ববর্তী
            </button>
            <span className="text-xs px-3 py-2 rounded-xl font-bold" style={{ backgroundColor: S.primaryLight, color: S.primary }}>
              {page}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium disabled:opacity-40 transition-opacity"
              style={{ borderColor: S.border, backgroundColor: S.surface, color: S.secondary }}
            >
              পরবর্তী <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
