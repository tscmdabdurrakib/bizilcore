"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Search, Plus, Download, ChevronLeft, ChevronRight, Upload, X, Send, Users, RefreshCw, MessageCircle } from "lucide-react";
import { formatBDT, formatRelativeDate } from "@/lib/utils";
import { downloadExcel } from "@/lib/excel";
import Papa from "papaparse";

interface Customer {
  id: string; name: string; phone: string | null; address: string | null;
  dueAmount: number; group: string; loyaltyPoints: number; _count: { orders: number };
}

interface SegmentMember {
  id: string; name: string; phone: string | null;
  totalOrders: number; totalSpend: number; lastOrderAt: string | null;
}

interface Segment {
  key: string; label: string; description: string;
  color: string; bg: string; count: number; phoneCount: number;
  customers: SegmentMember[];
}

interface CampaignLog {
  id: string; segment: string; channel: string; message: string;
  recipientCount: number; sentAt: string;
}

const PAGE_SIZE = 30;
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)" };

const GROUP_META: Record<string, { label: string; bg: string; color: string }> = {
  vip:       { label: "VIP",       bg: "var(--group-vip-bg)",       color: "var(--group-vip-text)" },
  wholesale: { label: "Wholesale", bg: "var(--group-wholesale-bg)",  color: "var(--group-wholesale-text)" },
  regular:   { label: "Regular",   bg: "var(--c-bg)",               color: "var(--c-text-sub)" },
};

const GROUP_TABS = [
  { key: "all",       label: "সব" },
  { key: "vip",       label: "⭐ VIP" },
  { key: "wholesale", label: "🏪 Wholesale" },
  { key: "regular",   label: "Regular" },
  { key: "due",       label: "💰 বাকি আছে" },
];

const SEGMENT_LABEL: Record<string, string> = {
  vip: "VIP", new: "নতুন", active: "সক্রিয়", at_risk: "ঝুঁকিতে", dormant: "নিষ্ক্রিয়",
};

const WA_TEMPLATES: Record<string, (label: string) => string> = {
  vip: (label) => `আস্সালামু আলাইকুম!\n\nআপনি আমাদের মূল্যবান ${label} কাস্টমার। আপনার জন্য বিশেষ অফার রয়েছে! শীঘ্রই যোগাযোগ করুন। 🎁`,
  new: (label) => `আস্সালামু আলাইকুম!\n\nআমাদের সাথে প্রথম অর্ডারের জন্য ধন্যবাদ! পরবর্তী অর্ডারে বিশেষ ছাড় পাবেন। 🛍️`,
  active: (label) => `আস্সালামু আলাইকুম!\n\nআপনার জন্য নতুন পণ্য এসেছে! দেখুন এবং অর্ডার করুন। 😊`,
  at_risk: (label) => `আস্সালামু আলাইকুম!\n\nআপনাকে অনেকদিন দেখা যাচ্ছে না! আপনার জন্য বিশেষ অফার নিয়ে আসুন। 🙏`,
  dormant: (label) => `আস্সালামু আলাইকুম!\n\nআমরা আপনাকে মিস করছি! ফিরে আসুন এবং বিশেষ ছাড় উপভোগ করুন। ❤️`,
};

interface CsvRow { name: string; phone?: string; address?: string; group?: string }

interface CampaignModalProps {
  segment: Segment;
  onClose: () => void;
  onSent: () => void;
}

function CampaignModal({ segment, onClose, onSent }: CampaignModalProps) {
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [message, setMessage] = useState(WA_TEMPLATES[segment.key]?.(segment.label) ?? "");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const r = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segment: segment.key,
          channel,
          message,
        }),
      });
      const d = await r.json();
      if (r.ok) {
        setResult({ type: "success", msg: `✓ ${d.sentCount} জনকে ${channel === "whatsapp" ? "WhatsApp" : "SMS"} পাঠানো হয়েছে!` });
        setTimeout(() => { onSent(); onClose(); }, 1500);
      } else {
        setResult({ type: "error", msg: d.error ?? "কিছু একটা সমস্যা হয়েছে।" });
      }
    } catch {
      setResult({ type: "error", msg: "নেটওয়ার্ক সমস্যা।" });
    }
    setSending(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "var(--c-surface-raised)" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg" style={{ color: S.text }}>ক্যাম্পেইন পাঠান</h3>
            <p className="text-xs mt-0.5" style={{ color: S.muted }}>
              <span className="font-medium px-2 py-0.5 rounded-full mr-1" style={{ backgroundColor: segment.bg, color: segment.color }}>{segment.label}</span>
              {segment.count} জন · {segment.phoneCount} জনের ফোন নম্বর আছে
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} style={{ color: S.muted }} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: S.secondary }}>চ্যানেল</label>
            <div className="flex gap-2">
              <button onClick={() => setChannel("whatsapp")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors"
                style={{ backgroundColor: channel === "whatsapp" ? "#25D366" : "transparent", color: channel === "whatsapp" ? "#fff" : S.secondary, borderColor: channel === "whatsapp" ? "#25D366" : S.border }}>
                <MessageCircle size={14} /> WhatsApp
              </button>
              <button onClick={() => setChannel("sms")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors"
                style={{ backgroundColor: channel === "sms" ? S.primary : "transparent", color: channel === "sms" ? "#fff" : S.secondary, borderColor: channel === "sms" ? S.primary : S.border }}>
                <Send size={14} /> SMS
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: S.secondary }}>বার্তা (সম্পাদনযোগ্য)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value.slice(0, 1000))} rows={6}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
              style={{ borderColor: S.border, color: S.text, backgroundColor: "var(--c-bg)" }} />
            <p className="text-xs text-right mt-1" style={{ color: message.length > 900 ? "#DC2626" : S.muted }}>{message.length}/1000</p>
          </div>

          {result && (
            <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: result.type === "success" ? "var(--bg-success-soft)" : "var(--bg-danger-soft)", color: result.type === "success" ? "var(--bg-success-text)" : "var(--bg-danger-text)" }}>
              {result.msg}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
            <button onClick={handleSend} disabled={sending || !message.trim() || segment.phoneCount === 0}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: channel === "whatsapp" ? "#25D366" : S.primary }}>
              {sending ? <><RefreshCw size={14} className="animate-spin" /> পাঠানো হচ্ছে...</> : <><Send size={14} /> পাঠান ({segment.phoneCount} জন)</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [tab, setTab] = useState("all");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showCsv, setShowCsv] = useState(false);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [mainTab, setMainTab] = useState<"list" | "segments">("list");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [campaignModal, setCampaignModal] = useState<Segment | null>(null);
  const [campaignLogs, setCampaignLogs] = useState<CampaignLog[]>([]);
  const [campaignLogsLoading, setCampaignLogsLoading] = useState(false);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (tab === "due") params.set("dueOnly", "1");
    else if (tab !== "all") params.set("group", tab);
    const r = await fetch(`/api/customers?${params}`);
    const data = await r.json();
    setCustomers(data.customers ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, debouncedSearch, tab]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  useEffect(() => { setPage(1); }, [tab]);

  const fetchSegments = useCallback(async () => {
    setSegmentsLoading(true);
    try {
      const r = await fetch("/api/customers/segments");
      const d = await r.json();
      setSegments(d.segments ?? []);
    } catch {}
    setSegmentsLoading(false);
  }, []);

  const fetchCampaignLogs = useCallback(async () => {
    setCampaignLogsLoading(true);
    try {
      const r = await fetch("/api/campaigns?page=1");
      const d = await r.json();
      setCampaignLogs(d.logs ?? []);
    } catch {}
    setCampaignLogsLoading(false);
  }, []);

  useEffect(() => {
    if (mainTab === "segments") {
      fetchSegments();
      fetchCampaignLogs();
    }
  }, [mainTab, fetchSegments, fetchCampaignLogs]);

  async function exportToExcel() {
    const r = await fetch(`/api/customers?all=1${tab === "due" ? "&dueOnly=1" : tab !== "all" ? `&group=${tab}` : ""}`);
    const data = await r.json();
    const rows = (data as Customer[]).map(c => ({
      "নাম": c.name, "ফোন": c.phone ?? "", "ঠিকানা": c.address ?? "",
      "Group": GROUP_META[c.group]?.label ?? c.group,
      "পয়েন্ট": c.loyaltyPoints,
      "মোট অর্ডার": c._count.orders, "বাকি (৳)": c.dueAmount,
    }));
    downloadExcel(rows, "customers.xlsx", "কাস্টমার");
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<CsvRow>(file, {
      header: true, skipEmptyLines: true,
      complete: (result) => {
        setCsvRows(result.data.filter((r: CsvRow) => r.name?.trim()));
        setShowCsv(true);
      },
    });
    e.target.value = "";
  }

  async function handleImport() {
    if (!csvRows.length) return;
    setImporting(true);
    const r = await fetch("/api/customers/import", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: csvRows }),
    });
    const d = await r.json();
    setImporting(false);
    setShowCsv(false);
    setCsvRows([]);
    if (r.ok) { showToast("success", `${d.imported}জন কাস্টমার import হয়েছে ✓`); fetchCustomers(); }
    else showToast("error", "Import ব্যর্থ হয়েছে।");
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg" style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>{toast.msg}</div>}

      {campaignModal && (
        <CampaignModal segment={campaignModal} onClose={() => setCampaignModal(null)} onSent={() => {
          showToast("success", "ক্যাম্পেইন পাঠানো হয়েছে ✓");
          fetchCampaignLogs();
        }} />
      )}

      {showCsv && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 max-w-lg w-full" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: S.text }}>CSV Import — {csvRows.length}টি কাস্টমার</h3>
              <button onClick={() => { setShowCsv(false); setCsvRows([]); }}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <p className="text-xs mb-3" style={{ color: S.muted }}>CSV কলাম: name, phone, address, group (vip/wholesale/regular)</p>
            <div className="max-h-60 overflow-y-auto rounded-xl border mb-4" style={{ borderColor: S.border }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ backgroundColor: "var(--c-surface)" }}>
                    {["নাম", "ফোন", "Group"].map(h => <th key={h} className="text-left px-3 py-2 font-semibold" style={{ color: S.muted }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {csvRows.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: S.border }}>
                      <td className="px-3 py-1.5" style={{ color: S.text }}>{r.name}</td>
                      <td className="px-3 py-1.5" style={{ color: S.muted }}>{r.phone ?? "—"}</td>
                      <td className="px-3 py-1.5" style={{ color: S.secondary }}>{r.group ?? "regular"}</td>
                    </tr>
                  ))}
                  {csvRows.length > 50 && <tr><td colSpan={3} className="px-3 py-1.5 text-center" style={{ color: S.muted }}>...আরো {csvRows.length - 50}টি</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowCsv(false); setCsvRows([]); }}
                className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={handleImport} disabled={importing}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                style={{ backgroundColor: S.primary }}>
                {importing ? "Import হচ্ছে..." : `${csvRows.length}টি Import করুন`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)" }}>
            <Users size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>কাস্টমার</h1>
            <p className="text-xs" style={{ color: S.muted }}>ক্রেতাদের তথ্য ও বাকি পরিচালনা করুন</p>
          </div>
        </div>
        <Link href="/customers/new" className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-semibold flex-shrink-0" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
          <Plus size={16} /> কাস্টমার যোগ করুন
        </Link>
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor: S.border }}>
        <button onClick={() => setMainTab("list")}
          className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
          style={{ borderColor: mainTab === "list" ? S.primary : "transparent", color: mainTab === "list" ? S.primary : S.secondary }}>
          কাস্টমার তালিকা
        </button>
        <button onClick={() => setMainTab("segments")}
          className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2"
          style={{ borderColor: mainTab === "segments" ? S.primary : "transparent", color: mainTab === "segments" ? S.primary : S.secondary }}>
          <Users size={14} /> সেগমেন্ট
        </button>
      </div>

      {mainTab === "list" && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
              <input type="text" placeholder="কাস্টমার খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 h-10 rounded-xl border text-sm outline-none"
                style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCsvFile} />
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-3 h-10 rounded-xl border text-sm font-medium flex-shrink-0 hover:bg-gray-50 transition-colors"
              style={{ borderColor: S.border, color: S.secondary }}>
              <Upload size={15} /> CSV Import
            </button>
            <button onClick={exportToExcel} disabled={loading || total === 0}
              className="flex items-center gap-2 px-3 h-10 rounded-xl border text-sm font-medium flex-shrink-0 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              style={{ borderColor: S.border, color: S.secondary }}>
              <Download size={15} /> Excel
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {GROUP_TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="px-4 py-1.5 rounded-full text-sm font-medium border flex-shrink-0 transition-colors"
                style={{
                  backgroundColor: tab === t.key ? S.primary : S.surface,
                  color: tab === t.key ? "#fff" : S.secondary,
                  borderColor: tab === t.key ? S.primary : S.border,
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">{[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <p className="text-sm mb-3" style={{ color: S.muted }}>
                {tab === "due" ? "কোনো বাকি নেই। সবাই সময়মতো দিয়েছে!" : "কোনো কাস্টমার নেই।"}
              </p>
              {tab === "all" && <Link href="/customers/new" className="text-sm font-medium" style={{ color: S.primary }}>+ কাস্টমার যোগ করুন</Link>}
            </div>
          ) : (
            <>
              <div className="text-xs mb-3" style={{ color: S.muted }}>মোট {total} জন কাস্টমার</div>
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
                {customers.map((c, i) => {
                  const gm = GROUP_META[c.group] ?? GROUP_META.regular;
                  return (
                    <Link key={c.id} href={`/customers/${c.id}`}
                      className="flex items-center gap-4 px-5 py-4 border-b last:border-0 hover:bg-gray-50 transition-colors"
                      style={{ borderColor: S.border }}>
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 relative" style={{ backgroundColor: S.primary }}>
                        {c.name[0].toUpperCase()}
                        {c.group === "vip" && <span className="absolute -top-1 -right-1 text-[10px]">⭐</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm" style={{ color: S.text }}>{c.name}</p>
                          {c.group !== "regular" && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: gm.bg, color: gm.color }}>{gm.label}</span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: S.muted }}>
                          {c.phone ?? "ফোন নেই"} · {c._count.orders}টি অর্ডার
                          {c.loyaltyPoints > 0 && <span className="ml-2 text-yellow-600 font-medium">⭐ {c.loyaltyPoints} pts</span>}
                        </p>
                      </div>
                      {c.dueAmount > 0 && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs" style={{ color: S.muted }}>বাকি</p>
                          <p className="font-bold text-sm" style={{ color: "#E24B4A" }}>{formatBDT(c.dueAmount)}</p>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>

              {pages > 1 && (
                <div className="flex items-center justify-between mt-4 px-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl border text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    style={{ borderColor: S.border, color: S.secondary }}>
                    <ChevronLeft size={15} /> আগে
                  </button>
                  <span className="text-sm" style={{ color: S.muted }}>{page} / {pages}</span>
                  <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl border text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    style={{ borderColor: S.border, color: S.secondary }}>
                    পরে <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {mainTab === "segments" && (
        <div className="space-y-5">
          {segmentsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
              {[1,2,3,4,5].map(i => <div key={i} className="h-40 bg-gray-100 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {segments.map(seg => (
                <div key={seg.key} className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2" style={{ backgroundColor: seg.bg, color: seg.color }}>
                        {seg.label}
                      </span>
                      <p className="text-xs" style={{ color: S.muted }}>{seg.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: S.text }}>{seg.count}</p>
                      <p className="text-xs" style={{ color: S.muted }}>জন</p>
                    </div>
                  </div>
                  <p className="text-xs mb-3" style={{ color: S.muted }}>
                    📱 {seg.phoneCount} জনের ফোন নম্বর আছে
                  </p>
                  <button
                    onClick={() => setCampaignModal(seg)}
                    disabled={seg.phoneCount === 0}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-colors"
                    style={{ backgroundColor: S.primary }}>
                    <Send size={14} /> ক্যাম্পেইন পাঠান
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <h3 className="font-semibold text-sm" style={{ color: S.text }}>ক্যাম্পেইন ইতিহাস</h3>
              <button onClick={fetchCampaignLogs} className="text-xs" style={{ color: S.primary }}>
                <RefreshCw size={12} className={campaignLogsLoading ? "animate-spin inline" : "inline"} /> Refresh
              </button>
            </div>
            {campaignLogsLoading ? (
              <div className="p-4 space-y-2 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
              </div>
            ) : campaignLogs.length === 0 ? (
              <div className="text-center py-12">
                <Send size={32} className="mx-auto mb-3" style={{ color: S.border }} />
                <p className="text-sm" style={{ color: S.muted }}>এখনো কোনো ক্যাম্পেইন পাঠানো হয়নি।</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: S.surface, borderBottom: `1px solid ${S.border}` }}>
                      {["তারিখ", "সেগমেন্ট", "চ্যানেল", "প্রাপক", "বার্তা"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: S.muted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campaignLogs.map((log, i) => (
                      <tr key={log.id} style={{ borderBottom: `1px solid ${S.border}`, backgroundColor: i % 2 === 0 ? S.surface : "var(--c-bg)" }}>
                        <td className="px-4 py-3 text-xs" style={{ color: S.muted }}>{formatRelativeDate(log.sentAt)}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--c-primary-light)", color: "var(--c-primary)" }}>
                            {SEGMENT_LABEL[log.segment] ?? log.segment}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium" style={{ color: log.channel === "whatsapp" ? "#16A34A" : S.primary }}>
                          {log.channel === "whatsapp" ? "WhatsApp" : "SMS"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-xs" style={{ color: S.text }}>{log.recipientCount} জন</td>
                        <td className="px-4 py-3 text-xs max-w-xs truncate" style={{ color: S.secondary }}>{log.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
