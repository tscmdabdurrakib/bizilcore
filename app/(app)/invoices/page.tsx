"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Plus, X, FileText, ChevronDown, ChevronUp, Check, Clock, Send,
  Trash2, Copy, Printer, MessageCircle, MessageSquare, AlertTriangle,
  Search, Download, Loader2, Save, Users, BadgeDollarSign,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface Customer { id: string; name: string; phone: string | null }

interface InvoiceItem {
  id: string; description: string; quantity: number; unitPrice: number; subtotal: number;
}

interface Invoice {
  id: string; invoiceNumber: string; status: string;
  subtotal: number; discount: number; total: number;
  notes: string | null; dueDate: string | null; paidAt: string | null; createdAt: string;
  customer: Customer | null; items: InvoiceItem[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  draft:   { label: "খসড়া",         color: "#6B7280", bg: "#F3F4F6",  dot: "#9CA3AF" },
  sent:    { label: "পাঠানো",        color: "#2563EB", bg: "#EFF6FF",  dot: "#3B82F6" },
  paid:    { label: "পরিশোধিত",      color: "#059669", bg: "#ECFDF5",  dot: "#10B981" },
  overdue: { label: "বকেয়া",         color: "#DC2626", bg: "#FEF2F2",  dot: "#EF4444" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: cfg.dot, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}

const AVATAR_COLORS = ["#0F6E56","#2563EB","#7C3AED","#D97706","#DC2626","#059669","#0891B2"];
function avatarBg(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(h)];
}
function Avatar({ name, size = 10 }: { name: string; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold`}
      style={{ backgroundColor: avatarBg(name), width: size * 4, height: size * 4, fontSize: size < 10 ? 11 : 13 }}>
      {initials}
    </div>
  );
}

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return new Date(0);
  const dt = new Date(y, m - 1, d); dt.setHours(0, 0, 0, 0); return dt;
}
function todayMidnight(): Date { const t = new Date(); t.setHours(0, 0, 0, 0); return t; }
function isPastDue(dueDate: string | null): boolean {
  if (!dueDate) return false; return parseLocalDate(dueDate) < todayMidnight();
}
function daysUntilDue(dueDate: string): number {
  return Math.round((parseLocalDate(dueDate).getTime() - todayMidnight().getTime()) / (1000 * 60 * 60 * 24));
}
function DueDateChip({ dueDate, status }: { dueDate: string | null; status: string }) {
  if (!dueDate || status === "paid") return null;
  const diff = daysUntilDue(dueDate);
  if (diff < 0) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">{Math.abs(diff)} দিন অতিক্রান্ত</span>;
  if (diff === 0) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">আজ ডেডলাইন</span>;
  if (diff <= 7) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">{diff} দিন বাকি</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{diff} দিন বাকি</span>;
}

function esc(s: string) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function printInvoice(inv: Invoice, shopName: string) {
  const itemsHtml = inv.items.map(item => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(item.description)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${esc(String(item.quantity))}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">৳${esc(item.unitPrice.toLocaleString("bn-BD"))}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">৳${esc(item.subtotal.toLocaleString("bn-BD"))}</td>
    </tr>`).join("");
  const dueDateHtml = inv.dueDate ? `<p style="margin:4px 0;font-size:13px;color:#6b7280;">পেমেন্ট ডেডলাইন: ${esc(new Date(inv.dueDate).toLocaleDateString("bn-BD"))}</p>` : "";
  const notesHtml = inv.notes ? `<p style="margin:12px 0 0;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:12px;">নোট: ${esc(inv.notes)}</p>` : "";
  const discountHtml = inv.discount > 0 ? `<tr><td style="padding:6px 12px;text-align:right;color:#6b7280;" colspan="3">ছাড়:</td><td style="padding:6px 12px;text-align:right;color:#6b7280;">- ৳${esc(inv.discount.toLocaleString("bn-BD"))}</td></tr>` : "";
  const customerHtml = inv.customer ? `<div style="margin-bottom:20px;"><p style="font-size:12px;font-weight:700;color:#0F6E56;text-transform:uppercase;margin:0 0 4px;">বিল করা হয়েছে</p><p style="font-size:15px;font-weight:600;margin:0;">${esc(inv.customer.name)}</p>${inv.customer.phone ? `<p style="font-size:13px;color:#6b7280;margin:2px 0;">${esc(inv.customer.phone)}</p>` : ""}</div>` : "";
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(inv.invoiceNumber)}</title>
<style>body{font-family:'Hind Siliguri',Arial,sans-serif;margin:0;padding:32px;color:#111827;max-width:680px;margin:0 auto;}
h1{font-size:28px;font-weight:800;color:#0F6E56;margin:0;}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #0F6E56;}
table{width:100%;border-collapse:collapse;margin:20px 0;}
th{background:#f0fdf4;padding:10px 12px;text-align:left;font-size:12px;font-weight:700;color:#0F6E56;text-transform:uppercase;}
th:last-child,th:nth-child(3){text-align:right;}th:nth-child(2){text-align:center;}
.total-row td{font-weight:700;font-size:15px;color:#111827;padding:10px 12px;border-top:2px solid #0F6E56;}
.footer{margin-top:32px;text-align:center;font-size:12px;color:#9ca3af;}
@media print{@page{margin:1cm}}</style></head><body>
<div class="header"><div><h1>${esc(shopName)}</h1><p style="margin:4px 0;font-size:13px;color:#6b7280;">ইনভয়েস</p></div>
<div style="text-align:right;"><p style="font-size:18px;font-weight:700;color:#0F6E56;margin:0;">${esc(inv.invoiceNumber)}</p>
<p style="margin:4px 0;font-size:13px;color:#6b7280;">তারিখ: ${esc(new Date(inv.createdAt).toLocaleDateString("bn-BD"))}</p>${dueDateHtml}</div></div>
${customerHtml}<table><thead><tr><th>বিবরণ</th><th>পরিমাণ</th><th>একক মূল্য</th><th>মোট</th></tr></thead>
<tbody>${itemsHtml}</tbody><tfoot>
<tr><td colspan="3" style="padding:6px 12px;text-align:right;color:#6b7280;">সাবটোটাল:</td><td style="padding:6px 12px;text-align:right;color:#6b7280;">৳${esc(inv.subtotal.toLocaleString("bn-BD"))}</td></tr>
${discountHtml}<tr class="total-row"><td colspan="3" style="text-align:right;">মোট:</td><td style="text-align:right;">৳${esc(inv.total.toLocaleString("bn-BD"))}</td></tr>
</tfoot></table>${notesHtml}<div class="footer"><p>BizilCore দ্বারা তৈরি • ধন্যবাদ!</p></div></body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 400);
}

const fieldCls = "w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 bg-white outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400";
const selectCls = "w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 bg-white outline-none focus:border-gray-400 transition-colors appearance-none";

function CreatePanel({ onClose, onSave, isDesktop }: { onClose: () => void; onSave: () => void; isDesktop: boolean }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [recentItems, setRecentItems] = useState<{ description: string; unitPrice: number; quantity: number }[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
    fetch("/api/customers?limit=100").then(r => r.json()).then(d => setCustomers(d.customers ?? []));
  }, []);

  useEffect(() => {
    if (!customerId) { setRecentItems([]); return; }
    setLoadingRecent(true);
    fetch(`/api/customers/${customerId}/recent-invoice-items`)
      .then(r => r.json()).then(d => setRecentItems(d.items ?? []))
      .catch(() => setRecentItems([])).finally(() => setLoadingRecent(false));
  }, [customerId]);

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const total = subtotal - discount;

  function close() { setVisible(false); setTimeout(onClose, 300); }
  function addItem() { setItems(p => [...p, { description: "", quantity: 1, unitPrice: 0 }]); }
  function updateItem(idx: number, field: string, val: string | number) {
    setItems(p => p.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  }
  function removeItem(idx: number) { setItems(p => p.filter((_, i) => i !== idx)); }
  function addRecentItem(ri: { description: string; unitPrice: number; quantity: number }) {
    const exists = items.some(i => i.description.toLowerCase() === ri.description.toLowerCase());
    if (exists) return;
    const blank = items.findIndex(i => !i.description);
    if (blank !== -1) { updateItem(blank, "description", ri.description); updateItem(blank, "unitPrice", ri.unitPrice); }
    else setItems(p => [...p, { description: ri.description, quantity: ri.quantity, unitPrice: ri.unitPrice }]);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (items.some(i => !i.description)) return;
    setLoading(true);
    await fetch("/api/invoices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: customerId || null, items, discount, notes, dueDate: dueDate || null }),
    });
    setLoading(false);
    onSave(); close();
  }

  return (
    <>
      <div onClick={close} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }} />
      <div className="fixed z-50 bg-white flex flex-col"
        style={isDesktop ? {
          top: 0, right: 0, bottom: 0, width: 520,
          borderLeft: "1px solid #F3F4F6",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
        } : {
          left: 0, right: 0, bottom: 0, height: "94svh",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
        }}>

        {!isDesktop && <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full" />}

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#0F6E56,#065E48)" }}>
              <FileText size={18} color="#fff" />
            </div>
            <div>
              <p className="font-bold text-gray-900">নতুন ইনভয়েস</p>
              <p className="text-xs text-gray-400">Create invoice entry</p>
            </div>
          </div>
          <button onClick={close} className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* Customer */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">কাস্টমার (ঐচ্ছিক)</label>
              <select value={customerId} onChange={e => setCustomerId(e.target.value)} className={selectCls}>
                <option value="">— কাস্টমার বেছে নিন —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Recent items quick-add */}
            {customerId && (
              <div>
                {loadingRecent ? (
                  <p className="text-xs text-gray-400 flex items-center gap-1.5"><Loader2 size={11} className="animate-spin" /> সাম্প্রতিক পণ্য লোড হচ্ছে...</p>
                ) : recentItems.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-2">⚡ সাম্প্রতিক পণ্য — এক ক্লিকে যোগ করুন</p>
                    <div className="flex flex-wrap gap-2">
                      {recentItems.map((ri, idx) => {
                        const added = items.some(i => i.description.toLowerCase() === ri.description.toLowerCase() && i.description !== "");
                        return (
                          <button key={idx} type="button" onClick={() => addRecentItem(ri)} disabled={added}
                            className="text-xs px-3 py-1.5 rounded-xl border font-bold transition-all"
                            style={{ color: added ? "#9CA3AF" : "#0F6E56", backgroundColor: added ? "#F9FAFB" : "#ECFDF5", borderColor: added ? "#E5E7EB" : "#A7F3D0", cursor: added ? "not-allowed" : "pointer" }}>
                            {added ? "✓ " : "+ "}{ri.description} (৳{ri.unitPrice.toLocaleString()})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-700">আইটেম সমূহ *</label>
                <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"><Plus size={12} /> আইটেম যোগ</button>
              </div>
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="rounded-2xl border border-gray-100 bg-gray-50 p-3 space-y-2">
                    <div className="flex gap-2">
                      <input placeholder="পণ্য/সেবার বিবরণ *" value={item.description}
                        onChange={e => updateItem(idx, "description", e.target.value)} required
                        className="flex-1 h-10 border border-gray-200 rounded-xl px-3 text-sm bg-white outline-none focus:border-gray-400 placeholder:text-gray-400" />
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} className="w-10 h-10 rounded-xl hover:bg-red-50 flex items-center justify-center flex-shrink-0 transition-colors">
                          <X size={14} className="text-red-400" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">পরিমাণ</label>
                        <input type="number" min="1" value={item.quantity}
                          onChange={e => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                          className="w-full h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white outline-none focus:border-gray-400" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">একক মূল্য (৳)</label>
                        <input type="number" min="0" value={item.unitPrice || ""}
                          onChange={e => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="w-full h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white outline-none focus:border-gray-400" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">সাবটোটাল</label>
                        <div className="h-9 flex items-center px-3 rounded-xl bg-white border border-gray-100 text-sm font-bold text-gray-700">
                          ৳{(item.quantity * item.unitPrice).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Discount + Due date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">ছাড় (৳)</label>
                <input type="number" min="0" value={discount || ""} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} placeholder="০" className={fieldCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">পেমেন্ট ডেডলাইন</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={fieldCls} />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">নোট</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="ঐচ্ছিক মন্তব্য..." className={fieldCls} />
            </div>

            {/* Summary box */}
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 space-y-2">
              <div className="flex justify-between text-sm text-emerald-700">
                <span>সাবটোটাল</span><span className="font-semibold">{formatBDT(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-700">
                  <span>ছাড়</span><span className="font-semibold">− {formatBDT(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-emerald-800 pt-2 border-t border-emerald-200">
                <span>মোট</span><span>{formatBDT(total)}</span>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4 flex gap-3 bg-white">
            <button type="button" onClick={close} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">বাতিল</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg,#0F6E56,#065E48)" }}>
              {loading ? <><Loader2 size={15} className="animate-spin" /> তৈরি হচ্ছে...</> : <><Save size={15} /> ইনভয়েস তৈরি</>}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function InvoiceCard({
  inv, isExpanded, onToggle, onChangeStatus, onDeleteRequest, onDuplicate, onPrint,
  onSendWA, onSendSMS, sendingWA, sendingSMS,
}: {
  inv: Invoice; isExpanded: boolean; onToggle: () => void;
  onChangeStatus: (id: string, s: string) => void;
  onDeleteRequest: (inv: Invoice) => void;
  onDuplicate: (inv: Invoice) => void;
  onPrint: (inv: Invoice) => void;
  onSendWA: (id: string) => void;
  onSendSMS: (id: string) => void;
  sendingWA: boolean; sendingSMS: boolean;
}) {
  const hasPhone = !!inv.customer?.phone && (inv.status === "sent" || inv.status === "overdue");
  const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.draft;

  return (
    <div className="border-b border-gray-50 last:border-0">
      {/* Main row */}
      <div className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50/40 transition-colors">
        {inv.customer
          ? <Avatar name={inv.customer.name} />
          : <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0"><Users size={16} /></div>
        }

        <div className="flex-1 min-w-0">
          {/* Top row: invoice number + total */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-black text-emerald-700">{inv.invoiceNumber}</span>
              <StatusBadge status={inv.status} />
              <DueDateChip dueDate={inv.dueDate} status={inv.status} />
            </div>
            <p className="font-black text-gray-900 text-base">{formatBDT(inv.total)}</p>
          </div>

          {/* Customer + date */}
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-sm text-gray-700 font-medium">{inv.customer?.name ?? "অতিথি কাস্টমার"}</span>
            {inv.customer?.phone && <span className="text-xs text-gray-400">• {inv.customer.phone}</span>}
            <span className="text-xs text-gray-400">• {new Date(inv.createdAt).toLocaleDateString("bn-BD")}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {/* WhatsApp / SMS */}
            {hasPhone && (
              <>
                <button onClick={() => onSendWA(inv.id)} disabled={sendingWA}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 bg-green-50 text-green-700 hover:bg-green-100">
                  <MessageCircle size={12} /> {sendingWA ? "পাঠানো..." : "WhatsApp"}
                </button>
                <button onClick={() => onSendSMS(inv.id)} disabled={sendingSMS}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 bg-blue-50 text-blue-700 hover:bg-blue-100">
                  <MessageSquare size={12} /> {sendingSMS ? "..." : "SMS"}
                </button>
                <span className="w-px h-4 bg-gray-200" />
              </>
            )}

            {/* Status actions */}
            {inv.status === "draft" && (
              <button onClick={() => onChangeStatus(inv.id, "sent")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                <Send size={11} /> পাঠান
              </button>
            )}
            {(inv.status === "sent" || inv.status === "overdue") && (
              <button onClick={() => onChangeStatus(inv.id, "paid")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                <Check size={11} /> পরিশোধিত
              </button>
            )}
            {inv.status === "sent" && isPastDue(inv.dueDate) && (
              <button onClick={() => onChangeStatus(inv.id, "overdue")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                বকেয়া চিহ্নিত
              </button>
            )}

            <span className="w-px h-4 bg-gray-200" />

            {/* Utility actions */}
            <button onClick={() => onDuplicate(inv)} title="অনুলিপি"
              className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-400">
              <Copy size={13} />
            </button>
            <button onClick={() => onPrint(inv)} title="প্রিন্ট"
              className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-400">
              <Printer size={13} />
            </button>
            <button onClick={() => onDeleteRequest(inv)} title="মুছুন"
              className="p-1.5 rounded-xl hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Expand toggle */}
        <button onClick={onToggle} className="flex-shrink-0 w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors mt-0.5">
          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Expanded items */}
      {isExpanded && (
        <div className="px-5 pb-5 bg-gray-50/60">
          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">পণ্য / সেবা</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500">পরিমাণ</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">একক মূল্য</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">মোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {inv.items.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-gray-800 font-medium">{item.description}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{formatBDT(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">{formatBDT(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-100">
                {inv.discount > 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-xs text-gray-500">ছাড়:</td>
                    <td className="px-4 py-2 text-right text-xs text-gray-500">− {formatBDT(inv.discount)}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-700">মোট:</td>
                  <td className="px-4 py-3 text-right font-black text-emerald-700 text-base">{formatBDT(inv.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {inv.notes && (
            <p className="mt-2 text-xs text-gray-500 px-1">📝 {inv.notes}</p>
          )}
          {inv.paidAt && (
            <p className="mt-1 text-xs text-emerald-600 font-semibold px-1">✓ পরিশোধিত: {new Date(inv.paidAt).toLocaleDateString("bn-BD")}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [sendingWA, setSendingWA] = useState<string | null>(null);
  const [sendingSMS, setSendingSMS] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [shopName, setShopName] = useState("আমার দোকান");
  const [isDesktop, setIsDesktop] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => { if (d.shop?.name) setShopName(d.shop.name); }).catch(() => {});
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", h); return () => mq.removeEventListener("change", h);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const q = filterStatus ? `?status=${filterStatus}&limit=100` : "?limit=100";
    const res = await fetch(`/api/invoices${q}`);
    const data = await res.json();
    setInvoices(data.invoices ?? []);
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  }

  async function changeStatus(id: string, status: string) {
    await fetch(`/api/invoices/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    showToast(status === "paid" ? "পরিশোধিত চিহ্নিত হয়েছে ✓" : "Status আপডেট হয়েছে ✓", "success");
    load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/invoices/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    showToast("ইনভয়েস মুছে দেওয়া হয়েছে ✓", "success");
    load();
  }

  async function duplicateInvoice(inv: Invoice) {
    setDuplicating(inv.id);
    const res = await fetch("/api/invoices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: null, items: inv.items.map(i => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })), discount: inv.discount, notes: inv.notes || "", dueDate: null }),
    });
    setDuplicating(null);
    if (res.ok) { showToast("ইনভয়েসের অনুলিপি তৈরি হয়েছে!", "success"); load(); }
    else showToast("অনুলিপি তৈরি করা যায়নি", "error");
  }

  async function sendWhatsApp(id: string) {
    setSendingWA(id);
    const res = await fetch(`/api/invoices/${id}/send-whatsapp`, { method: "POST" });
    const data = await res.json();
    setSendingWA(null);
    if (res.ok) showToast("WhatsApp বার্তা পাঠানো হয়েছে!", "success");
    else showToast(data.error ?? "WhatsApp পাঠানো যায়নি", "error");
  }

  async function sendSMSReminder(id: string) {
    setSendingSMS(id);
    const res = await fetch(`/api/invoices/${id}/send-sms`, { method: "POST" });
    const data = await res.json();
    setSendingSMS(null);
    if (res.ok) showToast("SMS পাঠানো হয়েছে!", "success");
    else showToast(data.error ?? "SMS পাঠানো যায়নি", "error");
  }

  async function markAllOverdue() {
    const toMark = invoices.filter(inv => inv.status === "sent" && isPastDue(inv.dueDate));
    await Promise.all(toMark.map(inv => fetch(`/api/invoices/${inv.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "overdue" }) })));
    setDismissedBanner(true);
    showToast(`${toMark.length}টি ইনভয়েস বকেয়া চিহ্নিত হয়েছে`, "success");
    load();
  }

  function handleExport() {
    setExporting(true);
    try {
      const rows = [["ইনভয়েস নং", "কাস্টমার", "ফোন", "তারিখ", "স্ট্যাটাস", "সাবটোটাল", "ছাড়", "মোট"]];
      for (const inv of filtered) {
        rows.push([
          inv.invoiceNumber, inv.customer?.name ?? "অতিথি", inv.customer?.phone ?? "",
          new Date(inv.createdAt).toLocaleDateString("bn-BD"),
          STATUS_CONFIG[inv.status]?.label ?? inv.status,
          String(inv.subtotal), String(inv.discount), String(inv.total),
        ]);
      }
      const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "invoices.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch { showToast("Export ব্যর্থ", "error"); }
    setExporting(false);
  }

  const overdueCount = invoices.filter(inv => inv.status === "sent" && isPastDue(inv.dueDate)).length;
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const totalPending = invoices.filter(i => i.status !== "paid" && i.status !== "draft").reduce((s, i) => s + i.total, 0);
  const overdueTotal = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.total, 0);

  const filtered = useMemo(() => {
    if (!search.trim()) return invoices;
    const q = search.toLowerCase();
    return invoices.filter(inv =>
      inv.invoiceNumber.toLowerCase().includes(q) ||
      (inv.customer?.name ?? "").toLowerCase().includes(q) ||
      (inv.customer?.phone ?? "").includes(q)
    );
  }, [invoices, search]);

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-8">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl flex items-center gap-2"
          style={{ backgroundColor: toast.type === "success" ? "#059669" : "#DC2626" }}>
          {toast.type === "success" ? <Check size={14} /> : <X size={14} />} {toast.msg}
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4"><Trash2 size={22} className="text-red-500" /></div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">ইনভয়েস মুছবেন?</h3>
            <p className="text-sm text-gray-500 mb-1"><span className="font-semibold text-gray-800">{deleteTarget.invoiceNumber}</span> — {formatBDT(deleteTarget.total)}</p>
            <p className="text-xs text-gray-400 mb-6">এই ইনভয়েসটি স্থায়ীভাবে মুছে যাবে।</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">বাতিল</button>
              <button onClick={handleDelete} className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">মুছে দিন</button>
            </div>
          </div>
        </div>
      )}

      {/* Slide Panel */}
      {showPanel && <CreatePanel onClose={() => setShowPanel(false)} onSave={load} isDesktop={isDesktop} />}

      {duplicating && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl flex items-center gap-2"
          style={{ backgroundColor: "#0F6E56" }}>
          <Loader2 size={14} className="animate-spin" /> অনুলিপি তৈরি হচ্ছে...
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg,#0F6E56,#065E48)" }}>
            <FileText size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ইনভয়েস</h1>
            <p className="text-xs text-gray-500">কাস্টমারদের ইনভয়েস তৈরি ও ট্র্যাক করুন</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <Download size={14} /> {exporting ? "..." : "CSV"}
          </button>
          <button onClick={() => setShowPanel(true)}
            className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg,#0F6E56,#065E48)" }}>
            <Plus size={16} /> নতুন ইনভয়েস
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          Array(4).fill(0).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-24" />)
        ) : [
          { label: "মোট ইনভয়েস", value: `${invoices.length}টি`, icon: FileText, bg: "#ECFDF5", fg: "#059669" },
          { label: "পরিশোধিত", value: formatBDT(totalPaid), icon: Check, bg: "#ECFDF5", fg: "#059669" },
          { label: "পাওনা (sent)", value: formatBDT(totalPending), icon: Clock, bg: "#EFF6FF", fg: "#2563EB" },
          { label: "বকেয়া", value: formatBDT(overdueTotal), icon: BadgeDollarSign, bg: overdueTotal > 0 ? "#FEF2F2" : "#F3F4F6", fg: overdueTotal > 0 ? "#DC2626" : "#9CA3AF" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ backgroundColor: s.bg }}>
              <s.icon size={16} style={{ color: s.fg }} />
            </div>
            <p className="text-2xl font-black text-gray-900 truncate">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Overdue Banner ── */}
      {overdueCount > 0 && !dismissedBanner && (
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-red-50 border border-red-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={17} className="text-red-500 flex-shrink-0" />
            <p className="text-sm font-bold text-red-700">{overdueCount}টি ইনভয়েসের পেমেন্ট ডেডলাইন পার হয়ে গেছে</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={markAllOverdue} className="text-xs font-bold px-3 py-1.5 rounded-xl text-white bg-red-500 hover:bg-red-600 transition-colors">
              বকেয়া চিহ্নিত করুন
            </button>
            <button onClick={() => setDismissedBanner(true)} className="p-1 rounded-lg hover:bg-red-100 transition-colors"><X size={14} className="text-red-500" /></button>
          </div>
        </div>
      )}

      {/* ── List Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="ইনভয়েস নং বা কাস্টমার..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-800 outline-none focus:border-gray-400 transition-colors" />
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {[{ value: "", label: "সব" }, ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))].map(tab => (
              <button key={tab.value} onClick={() => setFilterStatus(tab.value)}
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                style={{ backgroundColor: filterStatus === tab.value ? "#0F6E56" : "#F3F4F6", color: filterStatus === tab.value ? "#fff" : "#6B7280" }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-5 animate-pulse">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-48" /><div className="h-3 bg-gray-100 rounded w-64" /><div className="h-8 bg-gray-100 rounded w-56 mt-2" /></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><FileText size={28} className="text-emerald-600" /></div>
            <p className="font-semibold text-gray-700 mb-1">কোনো ইনভয়েস পাওয়া যায়নি</p>
            <p className="text-xs text-gray-400 mb-4">প্রথম ইনভয়েসটি এখনই তৈরি করুন</p>
            <button onClick={() => setShowPanel(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold mx-auto"
              style={{ background: "linear-gradient(135deg,#0F6E56,#065E48)" }}>
              <Plus size={14} /> নতুন ইনভয়েস
            </button>
          </div>
        ) : (
          <>
            {filtered.map(inv => (
              <InvoiceCard
                key={inv.id}
                inv={inv}
                isExpanded={expandedId === inv.id}
                onToggle={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                onChangeStatus={changeStatus}
                onDeleteRequest={setDeleteTarget}
                onDuplicate={duplicateInvoice}
                onPrint={(i) => printInvoice(i, shopName)}
                onSendWA={sendWhatsApp}
                onSendSMS={sendSMSReminder}
                sendingWA={sendingWA === inv.id}
                sendingSMS={sendingSMS === inv.id}
              />
            ))}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">{filtered.length}টি ইনভয়েস</span>
              <span className="font-black text-gray-900 text-base">{formatBDT(filtered.reduce((s, i) => s + i.total, 0))}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
