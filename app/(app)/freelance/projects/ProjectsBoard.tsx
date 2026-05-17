"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderKanban, Plus, Search, ChevronDown, ExternalLink,
  Clock, AlertTriangle, CheckCircle, XCircle, Pause, RefreshCw, Eye,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";
import DatePicker from "@/components/ui/DatePicker";

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "#6366F1",
};

const PROJECT_TYPES = [
  { value: "web_development", label: "ওয়েব ডেভেলপমেন্ট" },
  { value: "app_development", label: "অ্যাপ ডেভেলপমেন্ট" },
  { value: "graphic_design", label: "গ্রাফিক ডিজাইন" },
  { value: "digital_marketing", label: "ডিজিটাল মার্কেটিং" },
  { value: "content_writing", label: "কন্টেন্ট রাইটিং" },
  { value: "seo", label: "SEO" },
  { value: "data_entry", label: "ডেটা এন্ট্রি" },
  { value: "other", label: "অন্যান্য" },
];

const PLATFORMS = [
  "Direct Client", "Fiverr", "Upwork", "Freelancer", "Other"
];

const CURRENCIES = ["BDT", "USD", "EUR", "GBP"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  proposal:    { label: "প্রস্তাব",       color: "#6B7280", bg: "#F9FAFB", icon: Eye },
  in_progress: { label: "চলমান",          color: "#3B82F6", bg: "#EFF6FF", icon: RefreshCw },
  review:      { label: "রিভিউ",          color: "#8B5CF6", bg: "#F5F3FF", icon: Eye },
  revision:    { label: "রিভিশন",         color: "#F59E0B", bg: "#FFFBEB", icon: RefreshCw },
  completed:   { label: "সম্পন্ন",        color: "#10B981", bg: "#ECFDF5", icon: CheckCircle },
  on_hold:     { label: "বিরতি",          color: "#F97316", bg: "#FFF7ED", icon: Pause },
  cancelled:   { label: "বাতিল",          color: "#EF4444", bg: "#FEF2F2", icon: XCircle },
};

type Project = {
  id: string;
  projectNumber: string;
  title: string;
  type: string;
  status: string;
  currency: string;
  totalAmount: number;
  totalAmountBDT: number;
  deadline: string | null;
  platform: string | null;
  client: { id: string; name: string };
  milestones: { id: string; status: string; amount: number }[];
  timeLogs: { id: string; hours: number; billable: boolean }[];
  _count: { invoices: number };
};

type Customer = { id: string; name: string; phone: string };

export default function ProjectsBoard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [clients, setClients] = useState<Customer[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "", type: "web_development", clientId: "", clientName: "", clientPhone: "",
    platform: "Direct Client", description: "", startDate: "", deadline: "",
    currency: "BDT", totalAmount: "", exchangeRate: "1", advancePaid: "", notes: "",
  });

  useEffect(() => { loadProjects(); }, [statusFilter, typeFilter]);

  async function loadProjects() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (search) params.set("search", search);
    const r = await fetch(`/api/freelance/projects?${params}`);
    const data = await r.json();
    setProjects(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function loadClients() {
    const r = await fetch("/api/customers?limit=200");
    const data = await r.json();
    setClients(Array.isArray(data) ? data : (data.customers ?? []));
  }

  function openModal() {
    loadClients();
    setForm({
      title: "", type: "web_development", clientId: "", clientName: "", clientPhone: "",
      platform: "Direct Client", description: "", startDate: "", deadline: "",
      currency: "BDT", totalAmount: "", exchangeRate: "1", advancePaid: "", notes: "",
    });
    setShowModal(true);
  }

  async function saveProject(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const r = await fetch("/api/freelance/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        totalAmount: parseFloat(form.totalAmount) || 0,
        exchangeRate: parseFloat(form.exchangeRate) || 1,
        advancePaid: parseFloat(form.advancePaid) || 0,
      }),
    });
    if (r.ok) {
      setShowModal(false);
      loadProjects();
    }
    setSaving(false);
  }

  const filtered = projects.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.client.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmountBDT = form.currency === "BDT"
    ? parseFloat(form.totalAmount) || 0
    : (parseFloat(form.totalAmount) || 0) * (parseFloat(form.exchangeRate) || 1);
  const dueAmount = totalAmountBDT - (parseFloat(form.advancePaid) || 0);

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderKanban size={22} style={{ color: S.primary }} />
          <h1 className="text-xl font-bold" style={{ color: S.text }}>প্রজেক্ট</h1>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: S.primary }}
        >
          <Plus size={16} /> নতুন প্রজেক্ট
        </button>
      </div>

      {/* Pipeline mini summary */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = projects.filter(p => p.status === key).length;
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
              className="rounded-xl p-3 text-center border transition-all"
              style={{
                background: statusFilter === key ? cfg.bg : S.surface,
                borderColor: statusFilter === key ? cfg.color : S.border,
              }}
            >
              <Icon size={14} style={{ color: cfg.color, margin: "0 auto 4px" }} />
              <div className="text-lg font-bold" style={{ color: cfg.color }}>{count}</div>
              <div className="text-[10px] font-medium" style={{ color: S.muted }}>{cfg.label}</div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && loadProjects()}
            placeholder="প্রজেক্ট বা ক্লায়েন্ট খুঁজুন..."
            className="w-full pl-8 pr-3 py-2 rounded-xl border text-sm"
            style={{ background: S.surface, borderColor: S.border, color: S.text }}
          />
        </div>
        <div className="relative">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="pl-3 pr-8 py-2 rounded-xl border text-sm appearance-none"
            style={{ background: S.surface, borderColor: S.border, color: S.text }}
          >
            <option value="all">সব ধরন</option>
            {PROJECT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: S.muted }} />
        </div>
      </div>

      {/* Project cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "#E0E7FF", borderTopColor: S.primary }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ background: S.surface, borderColor: S.border }}>
          <FolderKanban size={40} className="mx-auto mb-3" style={{ color: S.muted }} />
          <p className="font-medium" style={{ color: S.muted }}>কোনো প্রজেক্ট নেই</p>
          <button onClick={openModal} className="mt-3 text-sm font-semibold" style={{ color: S.primary }}>
            + নতুন প্রজেক্ট যোগ করুন
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(p => {
            const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.in_progress;
            const Icon = cfg.icon;
            const isOverdue = p.deadline && new Date(p.deadline) < new Date() && !["completed", "cancelled"].includes(p.status);
            const doneMilestones = p.milestones.filter(m => ["approved", "paid"].includes(m.status)).length;
            const totalHours = p.timeLogs.reduce((s, l) => s + l.hours, 0);
            const typeLabel = PROJECT_TYPES.find(t => t.value === p.type)?.label ?? p.type;

            return (
              <Link
                key={p.id}
                href={`/freelance/projects/${p.id}`}
                className="block rounded-2xl border p-4 hover:shadow-md transition-all"
                style={{ background: S.surface, borderColor: S.border }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono font-bold" style={{ color: S.primary }}>{p.projectNumber}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#EEF2FF", color: S.primary }}>{typeLabel}</span>
                      {p.platform && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#F9FAFB", color: S.muted }}>{p.platform}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-base truncate" style={{ color: S.text }}>{p.title}</h3>
                    <p className="text-sm mt-0.5" style={{ color: S.muted }}>{p.client.name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
                      <Icon size={11} /> {cfg.label}
                    </span>
                    <span className="text-sm font-bold" style={{ color: S.text }}>
                      {p.currency !== "BDT" ? `${p.currency} ${p.totalAmount.toLocaleString()}` : formatBDT(p.totalAmountBDT)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  {p.milestones.length > 0 && (
                    <div className="flex-1 min-w-[100px]">
                      <div className="flex justify-between text-xs mb-1" style={{ color: S.muted }}>
                        <span>মাইলস্টোন</span>
                        <span>{doneMilestones}/{p.milestones.length}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "#E0E7FF" }}>
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${p.milestones.length ? (doneMilestones / p.milestones.length) * 100 : 0}%`, background: S.primary }}
                        />
                      </div>
                    </div>
                  )}
                  {totalHours > 0 && (
                    <div className="flex items-center gap-1 text-xs" style={{ color: S.muted }}>
                      <Clock size={12} />
                      <span>{totalHours.toFixed(1)} hrs</span>
                    </div>
                  )}
                  {p._count.invoices > 0 && (
                    <div className="text-xs" style={{ color: S.muted }}>{p._count.invoices} invoice</div>
                  )}
                  {isOverdue && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-red-600">
                      <AlertTriangle size={12} /> Overdue
                    </div>
                  )}
                  {p.deadline && (
                    <div className="text-xs ml-auto" style={{ color: isOverdue ? "#DC2626" : S.muted }}>
                      Deadline: {new Date(p.deadline).toLocaleDateString("bn-BD")}
                    </div>
                  )}
                  <ExternalLink size={13} style={{ color: S.muted }} className="ml-auto" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: S.surface }}>
            <div className="p-5 border-b" style={{ borderColor: S.border }}>
              <h2 className="text-lg font-bold" style={{ color: S.text }}>নতুন প্রজেক্ট</h2>
            </div>
            <form onSubmit={saveProject} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: S.muted }}>প্রজেক্ট শিরোনাম *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}
                  placeholder="যেমন: E-commerce Website for XYZ" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: S.muted }}>প্রজেক্ট ধরন *</label>
                  <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}>
                    {PROJECT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: S.muted }}>প্ল্যাটফর্ম</label>
                  <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}>
                    {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Client */}
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: S.muted }}>ক্লায়েন্ট *</label>
                {clients.length > 0 ? (
                  <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value, clientName: "" }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}>
                    <option value="">-- বিদ্যমান ক্লায়েন্ট বেছে নিন --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</option>)}
                  </select>
                ) : null}
                {!form.clientId && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                      required={!form.clientId}
                      className="px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}
                      placeholder="নতুন ক্লায়েন্টের নাম *" />
                    <input value={form.clientPhone} onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))}
                      className="px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}
                      placeholder="ফোন নম্বর" />
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: S.muted }}>বিবরণ</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}
                  placeholder="প্রজেক্টের বিস্তারিত..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: S.muted }}>শুরুর তারিখ</label>
                  <DatePicker
  value={form.startDate}
  onChange={v => setForm(f => ({ ...f, startDate: v }))}
  className="w-full px-3 py-2 rounded-xl border text-sm"
  style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}
/>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: S.muted }}>Deadline</label>
                  <DatePicker
  value={form.deadline}
  onChange={v => setForm(f => ({ ...f, deadline: v }))}
  className="w-full px-3 py-2 rounded-xl border text-sm"
  style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}
/>
                </div>
              </div>

              {/* Pricing */}
              <div className="rounded-xl border p-3 space-y-3" style={{ borderColor: S.border }}>
                <p className="text-sm font-semibold" style={{ color: S.text }}>মূল্য ও Currency</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>Currency *</label>
                    <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}>
                      {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>মোট পরিমাণ *</label>
                    <input required type="number" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}
                      placeholder="0" />
                  </div>
                </div>
                {form.currency !== "BDT" && (
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>
                      Exchange Rate (1 {form.currency} = ৳?)
                    </label>
                    <input type="number" value={form.exchangeRate} onChange={e => setForm(f => ({ ...f, exchangeRate: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}
                      placeholder="134" />
                    <p className="text-xs mt-1" style={{ color: S.primary }}>
                      BDT সমতুল্য: ৳{totalAmountBDT.toLocaleString()}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>অগ্রিম পেমেন্ট</label>
                    <input type="number" value={form.advancePaid} onChange={e => setForm(f => ({ ...f, advancePaid: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}
                      placeholder="0" />
                  </div>
                  <div className="flex flex-col justify-end pb-1">
                    <p className="text-xs" style={{ color: S.muted }}>বাকি পরিমাণ</p>
                    <p className="text-lg font-bold" style={{ color: dueAmount > 0 ? "#EF4444" : "#10B981" }}>
                      ৳{dueAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border text-sm font-semibold" style={{ borderColor: S.border, color: S.muted }}>
                  বাতিল
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: S.primary }}>
                  {saving ? "সেভ হচ্ছে..." : "প্রজেক্ট তৈরি করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
