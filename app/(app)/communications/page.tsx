"use client";

import { useEffect, useState } from "react";
import { Send, MessageCircle, Users, Phone, Search, CheckCircle2, RefreshCw, Clock, AlertCircle, ChevronLeft, ChevronRight, Keyboard } from "lucide-react";
import PlanGate from "@/components/PlanGate";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  group: string;
}

interface MessageLog {
  id: string;
  toPhone: string;
  message: string;
  status: string;
  errorMessage: string | null;
  sentAt: string;
  customer: { name: string } | null;
}

interface Shop { name: string; phone?: string }

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)", bg: "var(--c-bg)" };

const WA_TEMPLATES = [
  {
    key: "confirm",
    label: "অর্ডার নিশ্চিতকরণ",
    icon: "✅",
    text: (shop: string) => `আস্সালামু আলাইকুম!\n\nআপনার অর্ডারটি নিশ্চিত হয়েছে। শীঘ্রই পণ্য পাঠানো হবে।\n\nধন্যবাদ আমাদের সাথে থাকার জন্য! 🛍️\n\n— ${shop}`,
  },
  {
    key: "shipped",
    label: "পণ্য পাঠানো হয়েছে",
    icon: "📦",
    text: (shop: string) => `আস্সালামু আলাইকুম!\n\nআপনার পণ্য courier-এ পাঠানো হয়েছে। ২-৩ কার্যদিবসের মধ্যে পৌঁছাবে।\n\nযেকোনো সমস্যায় আমাদের সাথে যোগাযোগ করুন। 😊\n\n— ${shop}`,
  },
  {
    key: "delivered",
    label: "পণ্য পৌঁছেছে",
    icon: "🎉",
    text: (shop: string) => `আস্সালামু আলাইকুম!\n\nআশা করি আপনার পণ্য পেয়েছেন এবং পছন্দ হয়েছে! ❤️\n\nরিভিউ দিলে আমরা উৎসাহিত হই।\n\nধন্যবাদ! — ${shop}`,
  },
  {
    key: "promo",
    label: "প্রমোশনাল অফার",
    icon: "🎁",
    text: (shop: string) => `আস্সালামু আলাইকুম!\n\nবিশেষ অফার চলছে! এখনই অর্ডার করুন এবং বিশেষ ছাড় পান। 🛒\n\nঅফার সীমিত সময়ের জন্য।\n\n— ${shop}`,
  },
  {
    key: "due",
    label: "বাকি পরিশোধের অনুরোধ",
    icon: "💰",
    text: (shop: string) => `আস্সালামু আলাইকুম!\n\nআপনার কাছে কিছু বাকি আছে। সুবিধামতো পরিশোধ করে দিলে উপকৃত হতাম। 🙏\n\nযোগাযোগ করুন যেকোনো সময়।\n\n— ${shop}`,
  },
];

const GROUP_LABEL: Record<string, string> = { all: "সব কাস্টমার", vip: "VIP", wholesale: "Wholesale", regular: "Regular" };
const GROUP_COLOR: Record<string, string> = { vip: "#F59E0B", wholesale: "#7C3AED", regular: S.primary };

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  sent:    { label: "✅ সফল",        bg: "#DCFCE7", color: "#16A34A" },
  failed:  { label: "❌ ব্যর্থ",      bg: "#FEE2E2", color: "#DC2626" },
  pending: { label: "⏳ পাঠানো হচ্ছে", bg: "#FEF9C3", color: "#854D0E" },
};

export default function CommunicationsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [waConnected, setWaConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  /* WhatsApp tab state */
  const [activeTab, setActiveTab] = useState<"whatsapp" | "bulk">("whatsapp");

  /* WhatsApp Message Composer */
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [manualPhone, setManualPhone] = useState(false);
  const [toPhone, setToPhone] = useState("");
  const [useCustomMsg, setUseCustomMsg] = useState(false);
  const [template, setTemplate] = useState(WA_TEMPLATES[0].key);
  const [customMsg, setCustomMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  /* History */
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsLoading, setLogsLoading] = useState(false);

  /* Bulk WhatsApp (old feature) */
  const [group, setGroup] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTemplate, setBulkTemplate] = useState(WA_TEMPLATES[0].key);
  const [bulkCustom, setBulkCustom] = useState("");
  const [bulkUseCustom, setBulkUseCustom] = useState(false);
  const [sent, setSent] = useState<string[]>([]);
  const [bulkSending, setBulkSending] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/customers?all=1").then(r => r.json()),
      fetch("/api/settings").then(r => r.json()),
      fetch("/api/settings/whatsapp").then(r => r.json()),
    ]).then(([cData, sData, waData]) => {
      const list: Customer[] = Array.isArray(cData.customers) ? cData.customers : (Array.isArray(cData) ? cData : []);
      setCustomers(list);
      setShop(sData.shop ?? null);
      setWaConnected(waData.isConnected ?? false);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function loadLogs(page = 1) {
    setLogsLoading(true);
    fetch(`/api/communications/whatsapp/history?page=${page}`)
      .then(r => r.json())
      .then(d => {
        setLogs(d.logs ?? []);
        setLogsTotalPages(d.totalPages ?? 1);
        setLogsPage(page);
      })
      .catch(() => {})
      .finally(() => setLogsLoading(false));
  }

  useEffect(() => {
    if (waConnected) loadLogs(1);
  }, [waConnected]);

  /* Computed */
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const resolvedPhone = manualPhone ? toPhone : (selectedCustomer?.phone ?? "");

  function getMessage() {
    if (useCustomMsg) return customMsg;
    const tmpl = WA_TEMPLATES.find(t => t.key === template);
    return tmpl ? tmpl.text(shop?.name ?? "আমাদের শপ") : "";
  }

  const msgLength = getMessage().length;

  async function handleSend() {
    if (!resolvedPhone.trim() || !getMessage().trim()) return;
    setSending(true);
    setSendResult(null);
    const r = await fetch("/api/communications/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to_phone: resolvedPhone.trim(),
        message: getMessage().trim(),
        customer_id: !manualPhone && selectedCustomerId ? selectedCustomerId : undefined,
      }),
    });
    const d = await r.json();
    setSending(false);
    if (r.ok) {
      setSendResult({ type: "success", msg: "✅ Message পাঠানো হয়েছে!" });
      setSelectedCustomerId(""); setToPhone(""); setCustomMsg("");
      loadLogs(1);
    } else {
      setSendResult({ type: "error", msg: d.error ?? "❌ Message পাঠানো যায়নি" });
    }
  }

  /* Bulk helpers */
  const filtered = customers.filter(c => {
    if (!c.phone) return false;
    if (group !== "all" && c.group !== group) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !(c.phone ?? "").includes(search)) return false;
    return true;
  });
  const toggleAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(c => c.id)));
  };
  const toggleOne = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const bulkMsg = () => {
    if (bulkUseCustom) return bulkCustom;
    const tmpl = WA_TEMPLATES.find(t => t.key === bulkTemplate);
    return tmpl ? tmpl.text(shop?.name ?? "আমাদের শপ") : "";
  };
  const openWhatsApp = (c: Customer) => {
    if (!c.phone) return;
    const phone = c.phone.replace(/[^0-9]/g, "");
    const intlPhone = phone.startsWith("0") ? `88${phone}` : phone;
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(bulkMsg())}`, "_blank");
    setSent(prev => [...prev, c.id]);
  };
  const sendAll = async () => {
    setBulkSending(true);
    const list = customers.filter(c => selectedIds.has(c.id) && c.phone).slice(0, 20);
    for (const c of list) { openWhatsApp(c); await new Promise(r => setTimeout(r, 600)); }
    setBulkSending(false);
    showToast("success", `${list.length} জনকে WhatsApp পাঠানো শুরু হয়েছে ✓`);
  };

  return (
    <PlanGate feature="sms">
    <div className="max-w-5xl mx-auto">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>যোগাযোগ কেন্দ্র</h1>
          <p className="text-sm mt-0.5" style={{ color: S.muted }}>কাস্টমারদের message পাঠান</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setActiveTab("whatsapp")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
          style={{ backgroundColor: activeTab === "whatsapp" ? "#25D366" : S.surface, color: activeTab === "whatsapp" ? "#fff" : S.secondary, borderColor: activeTab === "whatsapp" ? "#25D366" : S.border }}>
          <MessageCircle size={14} /> WhatsApp API
        </button>
        <button
          onClick={() => setActiveTab("bulk")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
          style={{ backgroundColor: activeTab === "bulk" ? S.primary : S.surface, color: activeTab === "bulk" ? "#fff" : S.secondary, borderColor: activeTab === "bulk" ? S.primary : S.border }}>
          <Users size={14} /> Bulk WhatsApp (Manual)
        </button>
      </div>

      {/* ─── WHATSAPP API TAB ─── */}
      {activeTab === "whatsapp" && (
        <>
          {/* Not connected banner */}
          {waConnected === false && !loading && (
            <div className="rounded-2xl px-5 py-4 mb-5 flex items-center justify-between" style={{ backgroundColor: "#FEF9C3", border: "1px solid #FDE047" }}>
              <div className="flex items-center gap-3">
                <AlertCircle size={18} style={{ color: "#854D0E" }} />
                <p className="text-sm font-medium" style={{ color: "#854D0E" }}>⚠️ WhatsApp সংযুক্ত নেই।</p>
              </div>
              <Link href="/settings?tab=whatsapp"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                style={{ backgroundColor: "#854D0E" }}>
                Settings এ যান →
              </Link>
            </div>
          )}

          {/* Message composer + history */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left: Composer */}
            <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="flex items-center gap-2">
                <Send size={15} style={{ color: "#25D366" }} />
                <h2 className="font-semibold text-sm" style={{ color: S.text }}>Message পাঠান</h2>
              </div>

              {/* Recipient */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium" style={{ color: S.secondary }}>প্রাপক নির্বাচন করুন</label>
                  <button
                    onClick={() => { setManualPhone(p => !p); setSelectedCustomerId(""); setToPhone(""); }}
                    className="flex items-center gap-1 text-xs"
                    style={{ color: S.primary }}>
                    <Keyboard size={11} /> {manualPhone ? "Customer list থেকে" : "Manual নম্বর দিন"}
                  </button>
                </div>
                {manualPhone ? (
                  <input
                    type="tel"
                    value={toPhone}
                    onChange={e => setToPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full text-sm rounded-xl border outline-none px-3"
                    style={{ height: "42px", borderColor: S.border, color: S.text, backgroundColor: S.bg }}
                  />
                ) : (
                  <select
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    className="w-full text-sm rounded-xl border outline-none px-3 cursor-pointer"
                    style={{ height: "42px", borderColor: S.border, color: selectedCustomerId ? S.text : S.muted, backgroundColor: S.bg }}>
                    <option value="">— Customer বেছে নিন —</option>
                    {customers.filter(c => c.phone).map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                )}
                {resolvedPhone && (
                  <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "#16A34A" }}>
                    <Phone size={10} /> {resolvedPhone}
                  </p>
                )}
              </div>

              {/* Message type toggle */}
              <div className="flex gap-2">
                <button onClick={() => setUseCustomMsg(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium border transition-colors"
                  style={{ backgroundColor: !useCustomMsg ? "#25D366" : S.surface, color: !useCustomMsg ? "#fff" : S.secondary, borderColor: !useCustomMsg ? "#25D366" : S.border }}>
                  Ready Template
                </button>
                <button onClick={() => setUseCustomMsg(true)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium border transition-colors"
                  style={{ backgroundColor: useCustomMsg ? "#25D366" : S.surface, color: useCustomMsg ? "#fff" : S.secondary, borderColor: useCustomMsg ? "#25D366" : S.border }}>
                  কাস্টম বার্তা
                </button>
              </div>

              {!useCustomMsg ? (
                <div className="space-y-2">
                  {WA_TEMPLATES.map(t => (
                    <label key={t.key}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-colors"
                      style={{ borderColor: template === t.key ? "#25D366" : S.border, backgroundColor: template === t.key ? "#F0FDF4" : S.bg }}>
                      <input type="radio" name="waTemplate" value={t.key} checked={template === t.key} onChange={() => setTemplate(t.key)} className="accent-green-600" />
                      <span style={{ fontSize: "16px" }}>{t.icon}</span>
                      <span className="text-sm font-medium" style={{ color: S.text }}>{t.label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div>
                  <textarea
                    value={customMsg}
                    onChange={e => setCustomMsg(e.target.value.slice(0, 1000))}
                    placeholder="বার্তা লিখুন... (সর্বোচ্চ ১০০০ অক্ষর)"
                    rows={5}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                    style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }}
                  />
                  <p className="text-xs mt-1 text-right" style={{ color: customMsg.length > 900 ? "#DC2626" : S.muted }}>{customMsg.length}/1000</p>
                </div>
              )}

              {/* Preview */}
              <div className="rounded-xl p-3" style={{ backgroundColor: "#F0FDF4" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "#16A34A" }}>প্রিভিউ:</p>
                <p className="text-xs whitespace-pre-wrap" style={{ color: S.text }}>{getMessage() || "—"}</p>
                <p className="text-xs mt-1 text-right" style={{ color: S.muted }}>{msgLength} অক্ষর</p>
              </div>

              {/* Result banner */}
              {sendResult && (
                <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: sendResult.type === "success" ? "#DCFCE7" : "#FEE2E2", color: sendResult.type === "success" ? "#16A34A" : "#DC2626" }}>
                  {sendResult.msg}
                </div>
              )}

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={sending || !resolvedPhone.trim() || !getMessage().trim() || waConnected === false}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold disabled:opacity-60"
                style={{ backgroundColor: "#25D366" }}>
                {sending ? <><RefreshCw size={15} className="animate-spin" /> পাঠানো হচ্ছে...</> : <><Send size={15} /> WhatsApp Message পাঠান 📤</>}
              </button>
              {waConnected === false && (
                <p className="text-xs text-center" style={{ color: "#DC2626" }}>WhatsApp সংযুক্ত করুন Settings এ</p>
              )}
            </div>

            {/* Right: History */}
            <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock size={15} style={{ color: S.primary }} />
                  <h2 className="font-semibold text-sm" style={{ color: S.text }}>Message History</h2>
                </div>
                <button onClick={() => loadLogs(logsPage)} className="text-xs" style={{ color: S.primary }}>
                  <RefreshCw size={12} className={logsLoading ? "animate-spin inline" : "inline"} /> Refresh
                </button>
              </div>

              {logsLoading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ backgroundColor: S.bg }} />)}
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle size={32} className="mx-auto mb-3" style={{ color: S.border }} />
                  <p className="text-sm" style={{ color: S.muted }}>এখনো কোনো message পাঠানো হয়নি।</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {logs.map(log => {
                      const badge = STATUS_BADGE[log.status] ?? STATUS_BADGE.pending;
                      return (
                        <div key={log.id} className="rounded-xl p-3 border" style={{ backgroundColor: S.bg, borderColor: S.border }}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate" style={{ color: S.text }}>
                                {log.customer?.name ?? log.toPhone}
                              </p>
                              <p className="text-xs truncate mt-0.5" style={{ color: S.muted }}>{log.toPhone}</p>
                              <p className="text-xs mt-1 line-clamp-2" style={{ color: S.secondary }}>{log.message}</p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: badge.bg, color: badge.color }}>
                                {badge.label}
                              </span>
                              <p className="text-xs mt-1" style={{ color: S.muted }}>
                                {new Date(log.sentAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                          {log.status === "failed" && log.errorMessage && (
                            <p className="text-xs mt-1 px-2 py-1 rounded-lg" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>{log.errorMessage}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {logsTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: S.border }}>
                      <button onClick={() => loadLogs(logsPage - 1)} disabled={logsPage <= 1}
                        className="flex items-center gap-1 text-xs disabled:opacity-40" style={{ color: S.primary }}>
                        <ChevronLeft size={12} /> আগে
                      </button>
                      <span className="text-xs" style={{ color: S.muted }}>{logsPage}/{logsTotalPages}</span>
                      <button onClick={() => loadLogs(logsPage + 1)} disabled={logsPage >= logsTotalPages}
                        className="flex items-center gap-1 text-xs disabled:opacity-40" style={{ color: S.primary }}>
                        পরে <ChevronRight size={12} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── BULK WHATSAPP TAB (manual wa.me links) ─── */}
      {activeTab === "bulk" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: Customer Selection */}
          <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center gap-2">
              <Users size={16} style={{ color: S.primary }} />
              <h2 className="font-semibold text-sm" style={{ color: S.text }}>কাস্টমার বেছে নিন</h2>
              {selectedIds.size > 0 && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "var(--c-primary-light)", color: S.primary }}>
                  {selectedIds.size} জন নির্বাচিত
                </span>
              )}
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {Object.entries(GROUP_LABEL).map(([k, label]) => (
                <button key={k} onClick={() => { setGroup(k); setSelectedIds(new Set()); }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                  style={{ backgroundColor: group === k ? S.primary : S.bg, color: group === k ? "#fff" : S.secondary }}>
                  {label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="নাম বা ফোন নম্বর দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-3 h-10 rounded-xl border text-sm outline-none"
                style={{ borderColor: S.border, color: S.text }}
              />
            </div>

            <div className="flex items-center justify-between py-1 border-b" style={{ borderColor: S.border }}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filtered.length > 0 && selectedIds.size === filtered.length}
                  onChange={toggleAll} className="w-4 h-4 accent-green-700" />
                <span className="text-xs font-medium" style={{ color: S.secondary }}>সব নির্বাচন করুন ({filtered.length})</span>
              </label>
              {selectedIds.size > 0 && (
                <button onClick={() => setSelectedIds(new Set())} className="text-xs" style={{ color: "#E24B4A" }}>বাতিল</button>
              )}
            </div>

            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
              {loading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 rounded-xl animate-pulse" style={{ backgroundColor: S.bg }} />)}</div>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: S.muted }}>কোনো কাস্টমার পাওয়া যায়নি।</p>
              ) : filtered.map(c => (
                <label key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-gray-50"
                  style={{ backgroundColor: selectedIds.has(c.id) ? "#F0FBF6" : "transparent" }}>
                  <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleOne(c.id)}
                    className="w-4 h-4 accent-green-700 flex-shrink-0" />
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                    style={{ backgroundColor: GROUP_COLOR[c.group] ?? S.primary }}>
                    {c.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: S.text }}>{c.name}</p>
                    <p className="text-xs flex items-center gap-1" style={{ color: S.muted }}>
                      <Phone size={10} /> {c.phone ?? "ফোন নেই"}
                    </p>
                  </div>
                  {sent.includes(c.id) && <CheckCircle2 size={14} style={{ color: "var(--c-primary)" }} className="flex-shrink-0" />}
                </label>
              ))}
            </div>
          </div>

          {/* Right: Message Composer */}
          <div className="space-y-4">
            <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle size={16} style={{ color: S.primary }} />
                <h2 className="font-semibold text-sm" style={{ color: S.text }}>মেসেজ টেমপ্লেট</h2>
              </div>

              <div className="flex gap-2 mb-4">
                <button onClick={() => setBulkUseCustom(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium border transition-colors"
                  style={{ backgroundColor: !bulkUseCustom ? S.primary : S.surface, color: !bulkUseCustom ? "#fff" : S.secondary, borderColor: !bulkUseCustom ? S.primary : S.border }}>
                  Ready Template
                </button>
                <button onClick={() => setBulkUseCustom(true)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium border transition-colors"
                  style={{ backgroundColor: bulkUseCustom ? S.primary : S.surface, color: bulkUseCustom ? "#fff" : S.secondary, borderColor: bulkUseCustom ? S.primary : S.border }}>
                  কাস্টম মেসেজ
                </button>
              </div>

              {!bulkUseCustom ? (
                <div className="space-y-2 mb-4">
                  {WA_TEMPLATES.map(t => (
                    <label key={t.key}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-colors"
                      style={{ borderColor: bulkTemplate === t.key ? S.primary : S.border, backgroundColor: bulkTemplate === t.key ? "#F0FBF6" : S.bg }}>
                      <input type="radio" name="bulkTemplate" value={t.key} checked={bulkTemplate === t.key} onChange={() => setBulkTemplate(t.key)} className="accent-green-700" />
                      <span style={{ fontSize: "18px" }}>{t.icon}</span>
                      <span className="text-sm font-medium" style={{ color: S.text }}>{t.label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  value={bulkCustom} onChange={e => setBulkCustom(e.target.value)}
                  placeholder="আপনার মেসেজ লিখুন..."
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none mb-4"
                  style={{ borderColor: S.border, color: S.text }}
                />
              )}

              <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: "#E8F5E9" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "#2E7D32" }}>প্রিভিউ:</p>
                <p className="text-xs whitespace-pre-wrap" style={{ color: "var(--c-text)" }}>{bulkMsg()}</p>
              </div>

              {selectedIds.size > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-center" style={{ color: S.muted }}>
                    {selectedIds.size} জন নির্বাচিত (শুধু ফোন আছে এমন)
                  </p>
                  <button
                    onClick={sendAll}
                    disabled={bulkSending || !bulkMsg().trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold disabled:opacity-60"
                    style={{ backgroundColor: "#25D366" }}>
                    {bulkSending ? (
                      <><RefreshCw size={15} className="animate-spin" /> পাঠানো হচ্ছে...</>
                    ) : (
                      <><Send size={15} /> WhatsApp এ পাঠান ({selectedIds.size} জন)</>
                    )}
                  </button>
                  <p className="text-xs text-center" style={{ color: S.muted }}>
                    একসাথে সর্বোচ্চ ২০ জনকে পাঠানো যাবে। Browser popup block থাকলে allow করুন।
                  </p>
                </div>
              ) : (
                <div className="py-4 text-center rounded-xl" style={{ backgroundColor: S.bg }}>
                  <p className="text-sm" style={{ color: S.muted }}>বাম দিক থেকে কাস্টমার নির্বাচন করুন</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </PlanGate>
  );
}
