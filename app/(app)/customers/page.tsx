"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search, Plus, Download, ChevronLeft, ChevronRight, Upload, X,
  Send, Users, RefreshCw, MessageCircle, Pencil, Trash2, Save,
  Loader2, Star, AlertCircle, Phone, MapPin, Facebook,
  TrendingUp, ShieldCheck, BadgeDollarSign, UserPlus,
} from "lucide-react";
import { formatBDT, formatRelativeDate } from "@/lib/utils";
import { downloadExcel } from "@/lib/excel";
import Papa from "papaparse";

interface Customer {
  id: string; name: string; phone: string | null; address: string | null;
  fbProfile: string | null; dueAmount: number; group: string;
  loyaltyPoints: number; _count: { orders: number };
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

interface CsvRow { name: string; phone?: string; address?: string; group?: string }

const PAGE_SIZE = 30;

const AVATAR_COLORS: [string, string][] = [
  ["#EFF6FF", "#1D4ED8"], ["#F0FDF4", "#15803D"], ["#FFF7ED", "#C2410C"],
  ["#FDF4FF", "#7E22CE"], ["#FFF1F2", "#BE123C"], ["#F0FDFA", "#0F766E"],
];
function avatarColor(name: string): [string, string] {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

const GROUP_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  vip:       { label: "VIP",       bg: "#FEF3C7", color: "#92400E" },
  wholesale: { label: "Wholesale", bg: "#E0E7FF", color: "#3730A3" },
  regular:   { label: "Regular",   bg: "#F3F4F6", color: "#6B7280" },
};

const GROUP_TABS = [
  { key: "all",       label: "সব" },
  { key: "vip",       label: "⭐ VIP" },
  { key: "wholesale", label: "🏪 Wholesale" },
  { key: "regular",   label: "Regular" },
  { key: "due",       label: "💰 বাকি" },
];

const SEGMENT_LABEL: Record<string, string> = {
  vip: "VIP", new: "নতুন", active: "সক্রিয়", at_risk: "ঝুঁকিতে", dormant: "নিষ্ক্রিয়",
};

const WA_TEMPLATES: Record<string, (label: string) => string> = {
  vip:     () => `আস্সালামু আলাইকুম!\n\nআপনি আমাদের মূল্যবান VIP কাস্টমার। আপনার জন্য বিশেষ অফার রয়েছে! শীঘ্রই যোগাযোগ করুন। 🎁`,
  new:     () => `আস্সালামু আলাইকুম!\n\nআমাদের সাথে প্রথম অর্ডারের জন্য ধন্যবাদ! পরবর্তী অর্ডারে বিশেষ ছাড় পাবেন। 🛍️`,
  active:  () => `আস্সালামু আলাইকুম!\n\nআপনার জন্য নতুন পণ্য এসেছে! দেখুন এবং অর্ডার করুন। 😊`,
  at_risk: () => `আস্সালামু আলাইকুম!\n\nআপনাকে অনেকদিন দেখা যাচ্ছে না! আপনার জন্য বিশেষ অফার নিয়ে আসুন। 🙏`,
  dormant: () => `আস্সালামু আলাইকুম!\n\nআমরা আপনাকে মিস করছি! ফিরে আসুন এবং বিশেষ ছাড় উপভোগ করুন। ❤️`,
};

function CampaignModal({ segment, onClose, onSent }: { segment: Segment; onClose: () => void; onSent: () => void }) {
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [message, setMessage] = useState(WA_TEMPLATES[segment.key]?.(segment.label) ?? "");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true); setResult(null);
    try {
      const r = await fetch("/api/campaigns", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segment: segment.key, channel, message }),
      });
      const d = await r.json();
      if (r.ok) {
        setResult({ type: "success", msg: `✓ ${d.sentCount} জনকে ${channel === "whatsapp" ? "WhatsApp" : "SMS"} পাঠানো হয়েছে!` });
        setTimeout(() => { onSent(); onClose(); }, 1500);
      } else {
        setResult({ type: "error", msg: d.error ?? "কিছু একটা সমস্যা হয়েছে।" });
      }
    } catch { setResult({ type: "error", msg: "নেটওয়ার্ক সমস্যা।" }); }
    setSending(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">ক্যাম্পেইন পাঠান</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              <span className="font-semibold px-2 py-0.5 rounded-full mr-1 text-xs" style={{ backgroundColor: segment.bg, color: segment.color }}>{segment.label}</span>
              {segment.count} জন · {segment.phoneCount} জনের ফোন আছে
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"><X size={18} className="text-gray-400" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">চ্যানেল</label>
            <div className="flex gap-2">
              <button onClick={() => setChannel("whatsapp")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                style={{ backgroundColor: channel === "whatsapp" ? "#25D366" : "#fff", color: channel === "whatsapp" ? "#fff" : "#6B7280", borderColor: channel === "whatsapp" ? "#25D366" : "#E5E7EB" }}>
                <MessageCircle size={14} /> WhatsApp
              </button>
              <button onClick={() => setChannel("sms")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                style={{ backgroundColor: channel === "sms" ? "#1D4ED8" : "#fff", color: channel === "sms" ? "#fff" : "#6B7280", borderColor: channel === "sms" ? "#1D4ED8" : "#E5E7EB" }}>
                <Send size={14} /> SMS
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">বার্তা</label>
            <textarea value={message} onChange={e => setMessage(e.target.value.slice(0, 1000))} rows={6}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-gray-400 resize-none text-gray-800" />
            <p className={`text-xs text-right mt-1 ${message.length > 900 ? "text-red-500" : "text-gray-400"}`}>{message.length}/1000</p>
          </div>

          {result && (
            <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${result.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
              {result.msg}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">বাতিল</button>
            <button onClick={handleSend} disabled={sending || !message.trim() || segment.phoneCount === 0}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: channel === "whatsapp" ? "#25D366" : "#1D4ED8" }}>
              {sending ? <><RefreshCw size={14} className="animate-spin" /> পাঠানো হচ্ছে...</> : <><Send size={14} /> পাঠান ({segment.phoneCount})</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const fieldCls = "w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 bg-white outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400";

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

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", address: "", fbProfile: "", group: "regular", loyaltyPoints: 0 });
  const [saving, setSaving] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", h); return () => mq.removeEventListener("change", h);
  }, []);

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
    try { const r = await fetch("/api/customers/segments"); const d = await r.json(); setSegments(d.segments ?? []); } catch {}
    setSegmentsLoading(false);
  }, []);

  const fetchCampaignLogs = useCallback(async () => {
    setCampaignLogsLoading(true);
    try { const r = await fetch("/api/campaigns?page=1"); const d = await r.json(); setCampaignLogs(d.logs ?? []); } catch {}
    setCampaignLogsLoading(false);
  }, []);

  useEffect(() => {
    if (mainTab === "segments") { fetchSegments(); fetchCampaignLogs(); }
  }, [mainTab, fetchSegments, fetchCampaignLogs]);

  function openEdit(c: Customer) {
    setEditCustomer(c);
    setEditForm({ name: c.name, phone: c.phone || "", address: c.address || "", fbProfile: c.fbProfile || "", group: c.group, loyaltyPoints: c.loyaltyPoints });
    setEditPanelOpen(true);
  }
  function closeEdit() { setEditPanelOpen(false); setTimeout(() => setEditCustomer(null), 320); }

  async function handleSave() {
    if (!editCustomer || !editForm.name.trim()) return;
    setSaving(true);
    const r = await fetch(`/api/customers/${editCustomer.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editForm.name.trim(), phone: editForm.phone.trim() || null, address: editForm.address.trim() || null, fbProfile: editForm.fbProfile.trim() || null, group: editForm.group, loyaltyPoints: Number(editForm.loyaltyPoints) }),
    });
    setSaving(false);
    if (r.ok) {
      const updated = await r.json();
      setCustomers(cs => cs.map(c => c.id === updated.id ? { ...c, ...updated } : c));
      showToast("success", "কাস্টমার আপডেট হয়েছে ✓"); closeEdit();
    } else showToast("error", "আপডেট করা যায়নি।");
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const r = await fetch(`/api/customers/${deleteId}`, { method: "DELETE" });
    setDeleting(false); setDeleteId(null);
    if (r.ok) { setCustomers(cs => cs.filter(c => c.id !== deleteId)); setTotal(t => t - 1); showToast("success", "কাস্টমার মুছে দেওয়া হয়েছে।"); }
    else showToast("error", "মুছতে ব্যর্থ হয়েছে।");
  }

  async function exportToExcel() {
    const r = await fetch(`/api/customers?all=1${tab === "due" ? "&dueOnly=1" : tab !== "all" ? `&group=${tab}` : ""}`);
    const data = await r.json();
    const rows = (data as Customer[]).map(c => ({
      "নাম": c.name, "ফোন": c.phone ?? "", "ঠিকানা": c.address ?? "",
      "Group": GROUP_STYLES[c.group]?.label ?? c.group,
      "পয়েন্ট": c.loyaltyPoints, "মোট অর্ডার": c._count.orders, "বাকি (৳)": c.dueAmount,
    }));
    downloadExcel(rows, "customers.xlsx", "কাস্টমার");
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    Papa.parse<CsvRow>(file, {
      header: true, skipEmptyLines: true,
      complete: (result) => { setCsvRows(result.data.filter((r: CsvRow) => r.name?.trim())); setShowCsv(true); },
    });
    e.target.value = "";
  }

  async function handleImport() {
    if (!csvRows.length) return;
    setImporting(true);
    const r = await fetch("/api/customers/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows: csvRows }) });
    const d = await r.json();
    setImporting(false); setShowCsv(false); setCsvRows([]);
    if (r.ok) { showToast("success", `${d.imported}জন কাস্টমার import হয়েছে ✓`); fetchCustomers(); }
    else showToast("error", "Import ব্যর্থ হয়েছে।");
  }

  const vipCount = customers.filter(c => c.group === "vip").length;
  const dueCount = customers.filter(c => c.dueAmount > 0).length;
  const totalDue = customers.reduce((s, c) => s + c.dueAmount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-8">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl"
          style={{ backgroundColor: toast.type === "success" ? "#10B981" : "#EF4444" }}>
          {toast.msg}
        </div>
      )}

      {/* Campaign Modal */}
      {campaignModal && (
        <CampaignModal segment={campaignModal} onClose={() => setCampaignModal(null)} onSent={() => { showToast("success", "ক্যাম্পেইন পাঠানো হয়েছে ✓"); fetchCampaignLogs(); }} />
      )}

      {/* CSV Import Modal */}
      {showCsv && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">CSV Import</h3>
                <p className="text-xs text-gray-500 mt-0.5">{csvRows.length}টি কাস্টমার পাওয়া গেছে</p>
              </div>
              <button onClick={() => { setShowCsv(false); setCsvRows([]); }} className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"><X size={18} className="text-gray-400" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-3 p-3 bg-gray-50 rounded-xl border border-gray-100">CSV কলাম: <code className="font-mono">name, phone, address, group</code> (group: vip/wholesale/regular)</p>
            <div className="max-h-60 overflow-y-auto rounded-2xl border border-gray-100 mb-4">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>{["নাম", "ফোন", "Group"].map(h => <th key={h} className="text-left px-4 py-2.5 font-bold text-gray-500">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {csvRows.slice(0, 50).map((r, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-gray-800 font-medium">{r.name}</td>
                      <td className="px-4 py-2 text-gray-500">{r.phone ?? "—"}</td>
                      <td className="px-4 py-2 text-gray-500">{r.group ?? "regular"}</td>
                    </tr>
                  ))}
                  {csvRows.length > 50 && <tr><td colSpan={3} className="px-4 py-2 text-center text-gray-400">...আরো {csvRows.length - 50}টি</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowCsv(false); setCsvRows([]); }} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">বাতিল</button>
              <button onClick={handleImport} disabled={importing}
                className="flex-1 py-3 rounded-2xl text-white text-sm font-bold disabled:opacity-60 transition-opacity"
                style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}>
                {importing ? "Import হচ্ছে..." : `${csvRows.length}টি Import করুন`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">কাস্টমার মুছবেন?</h3>
            <p className="text-sm text-gray-500 mb-6">অর্ডার ইতিহাস এবং সব তথ্য মুছে যাবে। এই কাজ undo করা যাবে না।</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">বাতিল</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-60">
                {deleting ? "মুছছে..." : "মুছে দিন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Panel Backdrop */}
      {editCustomer && (
        <div onClick={closeEdit} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          style={{ opacity: editPanelOpen ? 1 : 0 }} />
      )}

      {/* Edit Panel */}
      {editCustomer && (
        <div className="fixed z-50 bg-white flex flex-col"
          style={isDesktop ? {
            top: 0, right: 0, bottom: 0, width: 480,
            borderLeft: "1px solid #F3F4F6",
            boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
            transform: editPanelOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
          } : {
            left: 0, right: 0, bottom: 0, height: "88svh",
            borderRadius: "24px 24px 0 0",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
            transform: editPanelOpen ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
          }}>
          {!isDesktop && <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full" />}
          {/* Panel Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              {(() => { const [bg, fg] = avatarColor(editCustomer.name); return (
                <div style={{ width: 38, height: 38, borderRadius: "50%", backgroundColor: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                  {editCustomer.name.charAt(0).toUpperCase()}
                </div>
              ); })()}
              <div>
                <p className="font-bold text-gray-900 text-sm">{editCustomer.name}</p>
                <p className="text-xs text-gray-400">{editCustomer._count.orders}টি অর্ডার · {GROUP_STYLES[editCustomer.group]?.label}</p>
              </div>
            </div>
            <button onClick={closeEdit} className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"><X size={18} /></button>
          </div>

          {/* Panel Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">নাম *</label>
              <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="কাস্টমারের নাম" className={fieldCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">ফোন নম্বর</label>
              <input type="tel" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="০১XXXXXXXXX" className={fieldCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">ঠিকানা</label>
              <textarea value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} placeholder="কাস্টমারের ঠিকানা..." rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Facebook Profile URL</label>
              <input type="text" value={editForm.fbProfile} onChange={e => setEditForm(f => ({ ...f, fbProfile: e.target.value }))} placeholder="https://facebook.com/..." className={fieldCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Group</label>
              <div className="flex gap-2">
                {["regular", "wholesale", "vip"].map(g => (
                  <button key={g} type="button" onClick={() => setEditForm(f => ({ ...f, group: g }))}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all"
                    style={{
                      backgroundColor: editForm.group === g ? GROUP_STYLES[g].bg : "#fff",
                      color: editForm.group === g ? GROUP_STYLES[g].color : "#9CA3AF",
                      borderColor: editForm.group === g ? GROUP_STYLES[g].color : "#E5E7EB",
                    }}>
                    {GROUP_STYLES[g].label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loyalty Points ⭐</label>
              <input type="number" min={0} value={editForm.loyaltyPoints} onChange={e => setEditForm(f => ({ ...f, loyaltyPoints: Number(e.target.value) }))} className={fieldCls} />
            </div>
            {editCustomer.dueAmount > 0 && (
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-700">বাকি আছে: {formatBDT(editCustomer.dueAmount)}</p>
                  <p className="text-xs text-red-500">বাকি অর্ডারে গিয়ে পরিবর্তন করুন</p>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Link href={`/customers/${editCustomer.id}`} onClick={closeEdit}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-center">
                বিস্তারিত দেখুন →
              </Link>
              <button onClick={() => { closeEdit(); setDeleteId(editCustomer.id); }}
                className="py-2.5 px-4 rounded-xl border border-red-100 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1.5">
                <Trash2 size={14} /> মুছুন
              </button>
            </div>
          </div>

          {/* Panel Footer */}
          <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4 flex gap-3 bg-white">
            <button onClick={closeEdit} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">বাতিল</button>
            <button onClick={handleSave} disabled={saving || !editForm.name.trim()}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}>
              {saving ? <><Loader2 size={15} className="animate-spin" /> সেভ হচ্ছে...</> : <><Save size={15} /> সেভ করুন</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg,#7C3AED,#5B21B6)" }}>
            <Users size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">কাস্টমার</h1>
            <p className="text-xs text-gray-500">ক্রেতাদের তথ্য ও বাকি পরিচালনা</p>
          </div>
        </div>
        <Link href="/customers/new"
          className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-bold flex-shrink-0 shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg,#0F6E56,#0A5442)" }}>
          <Plus size={16} /> কাস্টমার যোগ করুন
        </Link>
      </div>

      {/* ── Stats Cards ── */}
      {mainTab === "list" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "মোট কাস্টমার", value: total, sub: "রেজিস্টার্ড", icon: Users, bg: "#EFF6FF", fg: "#1D4ED8" },
            { label: "VIP কাস্টমার", value: vipCount, sub: "এই পেজে", icon: Star, bg: "#FEF3C7", fg: "#92400E" },
            { label: "বাকি আছে", value: dueCount, sub: "জন কাস্টমার", icon: AlertCircle, bg: "#FFF1F2", fg: "#BE123C" },
            { label: "মোট বাকি", value: formatBDT(totalDue), sub: "আদায়যোগ্য", icon: BadgeDollarSign, bg: "#F0FDF4", fg: "#15803D" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: s.bg }}>
                <s.icon size={17} style={{ color: s.fg }} />
              </div>
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label} · {s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Main Tabs ── */}
      <div className="flex gap-1 border-b border-gray-100">
        {[{ key: "list", label: "কাস্টমার তালিকা" }, { key: "segments", label: "সেগমেন্ট ও ক্যাম্পেইন" }].map(t => (
          <button key={t.key} onClick={() => setMainTab(t.key as "list" | "segments")}
            className="px-5 py-3 text-sm font-bold border-b-2 transition-colors"
            style={{ borderColor: mainTab === t.key ? "#7C3AED" : "transparent", color: mainTab === t.key ? "#7C3AED" : "#6B7280" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ════ LIST TAB ════ */}
      {mainTab === "list" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-50">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="নাম বা ফোন দিয়ে খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-800 outline-none focus:border-gray-400 transition-colors" />
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCsvFile} />
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0">
              <Upload size={14} /> CSV
            </button>
            <button onClick={exportToExcel} disabled={loading || total === 0}
              className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors flex-shrink-0">
              <Download size={14} /> Excel
            </button>
            <p className="text-xs text-gray-400 font-medium flex-shrink-0 ml-auto">{total} জন</p>
          </div>

          {/* Group Tabs */}
          <div className="flex gap-1 px-5 py-3 border-b border-gray-50 overflow-x-auto">
            {GROUP_TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0"
                style={{ backgroundColor: tab === t.key ? "#111827" : "transparent", color: tab === t.key ? "#fff" : "#6B7280" }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="divide-y divide-gray-50">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-40" /><div className="h-3 bg-gray-100 rounded w-56" /></div>
                  <div className="h-6 w-16 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Users size={28} className="text-gray-400" /></div>
              <p className="text-gray-500 text-sm font-medium">{tab === "due" ? "কোনো বাকি নেই। সবাই সময়মতো দিয়েছে! 🎉" : "কোনো কাস্টমার নেই।"}</p>
              {tab === "all" && <Link href="/customers/new" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-purple-600 hover:underline"><Plus size={14} /> কাস্টমার যোগ করুন</Link>}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["কাস্টমার", "ফোন", "অর্ডার", "Loyalty", "বাকি", "Group", ""].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {customers.map(c => {
                      const [bg, fg] = avatarColor(c.name);
                      const gm = GROUP_STYLES[c.group] ?? GROUP_STYLES.regular;
                      return (
                        <tr key={c.id} className="hover:bg-purple-50/20 transition-colors group">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div style={{ width: 38, height: 38, borderRadius: "50%", backgroundColor: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0, position: "relative" }}>
                                {c.name[0].toUpperCase()}
                                {c.group === "vip" && <span style={{ position: "absolute", top: -4, right: -4, fontSize: 10 }}>⭐</span>}
                              </div>
                              <div>
                                <Link href={`/customers/${c.id}`} className="font-semibold text-gray-900 text-sm hover:text-purple-700 transition-colors">{c.name}</Link>
                                {c.address && <p className="text-xs text-gray-400 truncate max-w-[160px]">{c.address}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-gray-600">
                            {c.phone ? <div className="flex items-center gap-1"><Phone size={12} className="text-gray-400" />{c.phone}</div> : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-5 py-3.5 text-sm font-semibold text-gray-700">{c._count.orders}</td>
                          <td className="px-5 py-3.5 text-sm text-yellow-600 font-semibold">
                            {c.loyaltyPoints > 0 ? `⭐ ${c.loyaltyPoints}` : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-5 py-3.5">
                            {c.dueAmount > 0
                              ? <span className="text-sm font-bold text-red-600">{formatBDT(c.dueAmount)}</span>
                              : <span className="text-xs text-emerald-500 font-semibold">পরিশোধিত</span>}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: gm.bg, color: gm.color }}>{gm.label}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="সম্পাদনা"><Pencil size={14} className="text-gray-500" /></button>
                              <button onClick={() => setDeleteId(c.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors" title="মুছুন"><Trash2 size={14} className="text-red-400" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile/Tablet Cards */}
              <div className="lg:hidden divide-y divide-gray-50">
                {customers.map(c => {
                  const [bg, fg] = avatarColor(c.name);
                  const gm = GROUP_STYLES[c.group] ?? GROUP_STYLES.regular;
                  return (
                    <div key={c.id} className="flex items-start gap-3 px-4 py-4">
                      <Link href={`/customers/${c.id}`}>
                        <div style={{ width: 42, height: 42, borderRadius: "50%", backgroundColor: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0, position: "relative" }}>
                          {c.name[0].toUpperCase()}
                          {c.group === "vip" && <span style={{ position: "absolute", top: -4, right: -4, fontSize: 10 }}>⭐</span>}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link href={`/customers/${c.id}`} className="font-bold text-gray-900 text-sm">{c.name}</Link>
                            <p className="text-xs text-gray-500">{c.phone ?? "ফোন নেই"} · {c._count.orders}টি অর্ডার</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: gm.bg, color: gm.color }}>{gm.label}</span>
                            {c.dueAmount > 0 && <span className="text-xs font-bold text-red-600">{formatBDT(c.dueAmount)}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <button onClick={() => openEdit(c)} className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:underline"><Pencil size={11} /> সম্পাদনা</button>
                          <button onClick={() => setDeleteId(c.id)} className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:underline"><Trash2 size={11} /> মুছুন</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-50">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                    <ChevronLeft size={15} /> আগে
                  </button>
                  <span className="text-sm text-gray-500 font-medium">{page} / {pages} পেজ</span>
                  <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                    পরে <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ════ SEGMENTS TAB ════ */}
      {mainTab === "segments" && (
        <div className="space-y-5">
          {segmentsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
              {[1,2,3,4,5].map(i => <div key={i} className="h-44 bg-gray-100 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {segments.map(seg => (
                <div key={seg.key} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-2" style={{ backgroundColor: seg.bg, color: seg.color }}>{seg.label}</span>
                      <p className="text-xs text-gray-500">{seg.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-gray-900">{seg.count}</p>
                      <p className="text-xs text-gray-400">জন</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
                    <Phone size={11} className="text-gray-400" /> {seg.phoneCount} জনের ফোন নম্বর আছে
                  </p>
                  <button onClick={() => setCampaignModal(seg)} disabled={seg.phoneCount === 0}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
                    style={{ background: "linear-gradient(135deg,#7C3AED,#5B21B6)" }}>
                    <Send size={14} /> ক্যাম্পেইন পাঠান
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Campaign History */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h3 className="font-bold text-gray-900">ক্যাম্পেইন ইতিহাস</h3>
              <button onClick={fetchCampaignLogs} className="flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:underline">
                <RefreshCw size={13} className={campaignLogsLoading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
            {campaignLogsLoading ? (
              <div className="p-4 space-y-3 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}</div>
            ) : campaignLogs.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><Send size={24} className="text-gray-400" /></div>
                <p className="text-sm text-gray-400">এখনো কোনো ক্যাম্পেইন পাঠানো হয়নি।</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["তারিখ", "সেগমেন্ট", "চ্যানেল", "প্রাপক", "বার্তা"].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {campaignLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">{formatRelativeDate(log.sentAt)}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">{SEGMENT_LABEL[log.segment] ?? log.segment}</span>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-bold" style={{ color: log.channel === "whatsapp" ? "#16A34A" : "#1D4ED8" }}>
                          {log.channel === "whatsapp" ? "WhatsApp" : "SMS"}
                        </td>
                        <td className="px-5 py-3.5 text-sm font-bold text-gray-700">{log.recipientCount} জন</td>
                        <td className="px-5 py-3.5 text-xs text-gray-500 max-w-xs truncate">{log.message}</td>
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
