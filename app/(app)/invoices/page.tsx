"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, X, FileText, ChevronDown, ChevronUp, Check, Clock, Send,
  Trash2, Copy, Printer, MessageCircle, MessageSquare, AlertTriangle,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  notes: string | null;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
  customer: Customer | null;
  items: InvoiceItem[];
}

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  sub: "var(--c-text-sub)",
  primary: "var(--c-primary)",
  primaryLight: "var(--c-primary-light)",
  bg: "var(--c-bg)",
};

const inp = (f: boolean) => ({
  height: "40px",
  border: `1px solid ${f ? "var(--c-primary)" : "var(--c-border)"}`,
  borderRadius: "8px",
  color: "var(--c-text)",
  backgroundColor: "var(--c-surface)",
  padding: "0 12px",
  fontSize: "14px",
  outline: "none",
  width: "100%",
});

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:   { label: "খসড়া",           color: "#6B7280", bg: "#F3F4F6" },
  sent:    { label: "পাঠানো হয়েছে",   color: "#3B82F6", bg: "#EFF6FF" },
  paid:    { label: "পরিশোধিত",        color: "#10B981", bg: "#ECFDF5" },
  overdue: { label: "বকেয়া",           color: "#EF4444", bg: "#FEF2F2" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function avatarColor(name: string): string {
  const colors = ["#0F6E56","#2563EB","#7C3AED","#D97706","#DC2626","#059669","#0891B2"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length;
  return colors[Math.abs(h)];
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold" style={{ backgroundColor: avatarColor(name) }}>
      {initials}
    </div>
  );
}

function parseLocalDate(dateStr: string): Date {
  const datePart = dateStr.slice(0, 10);
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d || isNaN(y) || isNaN(m) || isNaN(d)) return new Date(0);
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function todayMidnight(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

function isPastDue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return parseLocalDate(dueDate) < todayMidnight();
}

function daysUntilDue(dueDate: string): number {
  const due = parseLocalDate(dueDate);
  const today = todayMidnight();
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function DueDateBadge({ dueDate, status }: { dueDate: string | null; status: string }) {
  if (!dueDate || status === "paid") return null;
  const diff = daysUntilDue(dueDate);
  if (diff < 0) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: "#DC2626", backgroundColor: "#FEE2E2" }}>{Math.abs(diff)} দিন অতিক্রান্ত</span>;
  if (diff === 0) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: "#D97706", backgroundColor: "#FEF3C7" }}>আজ ডেডলাইন</span>;
  if (diff <= 7) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: "#D97706", backgroundColor: "#FEF3C7" }}>{diff} দিন বাকি</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: S.muted, backgroundColor: S.bg }}>{diff} দিন বাকি</span>;
}

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-medium shadow-xl flex items-center gap-2" style={{ backgroundColor: type === "success" ? "#059669" : "#DC2626" }}>
      {type === "success" ? <Check size={15} /> : <X size={15} />}
      {msg}
    </div>
  );
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function printInvoice(inv: Invoice, shopName: string) {
  const itemsHtml = inv.items.map(item => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(item.description)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${esc(String(item.quantity))}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">৳${esc(item.unitPrice.toLocaleString("bn-BD"))}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">৳${esc(item.subtotal.toLocaleString("bn-BD"))}</td>
    </tr>`).join("");

  const dueDateHtml = inv.dueDate
    ? `<p style="margin:4px 0;font-size:13px;color:#6b7280;">পেমেন্ট ডেডলাইন: ${esc(new Date(inv.dueDate).toLocaleDateString("bn-BD"))}</p>`
    : "";
  const notesHtml = inv.notes
    ? `<p style="margin:12px 0 0;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:12px;">নোট: ${esc(inv.notes)}</p>`
    : "";
  const discountHtml = inv.discount > 0
    ? `<tr><td style="padding:6px 12px;text-align:right;color:#6b7280;" colspan="3">ছাড়:</td><td style="padding:6px 12px;text-align:right;color:#6b7280;">- ৳${esc(inv.discount.toLocaleString("bn-BD"))}</td></tr>`
    : "";
  const customerHtml = inv.customer
    ? `<div style="margin-bottom:20px;"><p style="font-size:12px;font-weight:700;color:#0F6E56;text-transform:uppercase;margin:0 0 4px;">বিল করা হয়েছে</p><p style="font-size:15px;font-weight:600;margin:0;">${esc(inv.customer.name)}</p>${inv.customer.phone ? `<p style="font-size:13px;color:#6b7280;margin:2px 0;">${esc(inv.customer.phone)}</p>` : ""}</div>`
    : "";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(inv.invoiceNumber)}</title>
<style>body{font-family:'Hind Siliguri',Arial,sans-serif;margin:0;padding:32px;color:#111827;max-width:680px;margin:0 auto;}
h1{font-size:28px;font-weight:800;color:#0F6E56;margin:0;}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #0F6E56;}
table{width:100%;border-collapse:collapse;margin:20px 0;}
th{background:#f0fdf4;padding:10px 12px;text-align:left;font-size:12px;font-weight:700;color:#0F6E56;text-transform:uppercase;}
th:last-child,th:nth-child(3){text-align:right;}th:nth-child(2){text-align:center;}
.total-row td{font-weight:700;font-size:15px;color:#111827;padding:10px 12px;border-top:2px solid #0F6E56;}
.footer{margin-top:32px;text-align:center;font-size:12px;color:#9ca3af;}
@media print{@page{margin:1cm}}
</style></head><body>
<div class="header">
  <div><h1>${esc(shopName)}</h1><p style="margin:4px 0;font-size:13px;color:#6b7280;">ইনভয়েস</p></div>
  <div style="text-align:right;">
    <p style="font-size:18px;font-weight:700;color:#0F6E56;margin:0;">${esc(inv.invoiceNumber)}</p>
    <p style="margin:4px 0;font-size:13px;color:#6b7280;">তারিখ: ${esc(new Date(inv.createdAt).toLocaleDateString("bn-BD"))}</p>
    ${dueDateHtml}
  </div>
</div>
${customerHtml}
<table>
  <thead><tr><th>বিবরণ</th><th>পরিমাণ</th><th>একক মূল্য</th><th>মোট</th></tr></thead>
  <tbody>${itemsHtml}</tbody>
  <tfoot>
    <tr><td colspan="3" style="padding:6px 12px;text-align:right;color:#6b7280;">সাবটোটাল:</td><td style="padding:6px 12px;text-align:right;color:#6b7280;">৳${esc(inv.subtotal.toLocaleString("bn-BD"))}</td></tr>
    ${discountHtml}
    <tr class="total-row"><td colspan="3" style="text-align:right;">মোট:</td><td style="text-align:right;">৳${esc(inv.total.toLocaleString("bn-BD"))}</td></tr>
  </tfoot>
</table>
${notesHtml}
<div class="footer"><p>BizilCore দ্বারা তৈরি • ধন্যবাদ আপনার ব্যবসার জন্য!</p></div>
</body></html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

function CreateInvoiceModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentItems, setRecentItems] = useState<{ description: string; unitPrice: number; quantity: number }[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  useEffect(() => {
    fetch("/api/customers?limit=100")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers ?? []));
  }, []);

  useEffect(() => {
    if (!customerId) { setRecentItems([]); return; }
    setLoadingRecent(true);
    fetch(`/api/customers/${customerId}/recent-invoice-items`)
      .then(r => r.json())
      .then(d => setRecentItems(d.items ?? []))
      .catch(() => setRecentItems([]))
      .finally(() => setLoadingRecent(false));
  }, [customerId]);

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const total = subtotal - discount;

  function addItem() { setItems(p => [...p, { description: "", quantity: 1, unitPrice: 0 }]); }
  function updateItem(index: number, field: string, value: string | number) {
    setItems(p => p.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }
  function removeItem(index: number) { setItems(p => p.filter((_, i) => i !== index)); }
  function addRecentItem(recent: { description: string; unitPrice: number; quantity: number }) {
    const existing = items.find(i => i.description.toLowerCase() === recent.description.toLowerCase());
    if (existing) return;
    const blank = items.findIndex(i => !i.description);
    if (blank !== -1) {
      updateItem(blank, "description", recent.description);
      updateItem(blank, "unitPrice", recent.unitPrice);
    } else {
      setItems(p => [...p, { description: recent.description, quantity: recent.quantity, unitPrice: recent.unitPrice }]);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (items.some(i => !i.description)) return;
    setLoading(true);
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: customerId || null, items, discount, notes, dueDate: dueDate || null }),
    });
    setLoading(false);
    onSave();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="rounded-2xl p-6 w-full max-w-lg my-4" style={{ backgroundColor: S.surface }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-base" style={{ color: S.text }}>নতুন ইনভয়েস</h3>
          <button onClick={onClose}><X size={18} style={{ color: S.muted }} /></button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>কাস্টমার</label>
            <div className="relative">
              <select
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                style={{ ...inp(focused === "cus"), appearance: "none", paddingRight: "32px" }}
                onFocus={() => setFocused("cus")}
                onBlur={() => setFocused(null)}
              >
                <option value="">-- কাস্টমার বেছে নিন --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: S.muted }} />
            </div>
          </div>

          {customerId && (
            <div>
              {loadingRecent ? (
                <p className="text-xs" style={{ color: S.muted }}>সাম্প্রতিক পণ্য লোড হচ্ছে...</p>
              ) : recentItems.length > 0 ? (
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: S.muted }}>⚡ সাম্প্রতিক পণ্য (এক ক্লিকে যোগ করুন)</p>
                  <div className="flex flex-wrap gap-2">
                    {recentItems.map((ri, idx) => {
                      const alreadyAdded = items.some(i => i.description.toLowerCase() === ri.description.toLowerCase() && i.description !== "");
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => addRecentItem(ri)}
                          disabled={alreadyAdded}
                          className="text-xs px-3 py-1.5 rounded-xl border font-medium transition-all"
                          style={{
                            color: alreadyAdded ? S.muted : S.primary,
                            backgroundColor: alreadyAdded ? S.bg : S.primaryLight,
                            borderColor: alreadyAdded ? S.border : "transparent",
                            opacity: alreadyAdded ? 0.6 : 1,
                            cursor: alreadyAdded ? "not-allowed" : "pointer",
                          }}
                        >
                          {alreadyAdded ? "✓ " : "+ "}{ri.description} (৳{ri.unitPrice.toLocaleString("bn-BD")})
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: S.muted }}>আইটেম সমূহ *</label>
              <button type="button" onClick={addItem} className="text-xs px-2.5 py-1 rounded-lg font-semibold" style={{ color: S.primary, backgroundColor: S.primaryLight }}>+ আইটেম যোগ</button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <input
                    placeholder="পণ্য/সেবার বিবরণ"
                    value={item.description}
                    onChange={e => updateItem(idx, "description", e.target.value)}
                    required
                    style={{ ...inp(false), flex: 2 }}
                  />
                  <input
                    type="number" min="1" placeholder="পরিমাণ"
                    value={item.quantity}
                    onChange={e => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                    style={{ ...inp(false), flex: 1, minWidth: 0 }}
                  />
                  <input
                    type="number" min="0" placeholder="দাম"
                    value={item.unitPrice || ""}
                    onChange={e => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                    style={{ ...inp(false), flex: 1, minWidth: 0 }}
                  />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="mt-1.5">
                      <X size={16} style={{ color: S.muted }} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>ছাড় (৳)</label>
              <input type="number" min="0" value={discount || ""} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} placeholder="0" style={inp(focused === "disc")} onFocus={() => setFocused("disc")} onBlur={() => setFocused(null)} />
            </div>
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>পেমেন্ট ডেডলাইন</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inp(focused === "due")} onFocus={() => setFocused("due")} onBlur={() => setFocused(null)} />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>নোট</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="ঐচ্ছিক" style={inp(focused === "notes")} onFocus={() => setFocused("notes")} onBlur={() => setFocused(null)} />
          </div>

          <div className="rounded-xl p-3 space-y-1" style={{ backgroundColor: S.bg, border: `1px solid ${S.border}` }}>
            <div className="flex justify-between text-sm" style={{ color: S.muted }}>
              <span>সাবটোটাল</span><span>৳{subtotal.toLocaleString("bn-BD")}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm" style={{ color: S.muted }}>
                <span>ছাড়</span><span>- ৳{discount.toLocaleString("bn-BD")}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-1 border-t" style={{ color: S.text, borderColor: S.border }}>
              <span>মোট</span><span>৳{total.toLocaleString("bn-BD")}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
              {loading ? "তৈরি হচ্ছে..." : "ইনভয়েস তৈরি"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InvoiceRow({
  inv, isExpanded, onToggle, onChangeStatus, onDelete, onDuplicate, onPrint,
  onSendWA, onSendSMS, sendingWA, sendingSMS,
}: {
  inv: Invoice;
  isExpanded: boolean;
  onToggle: () => void;
  onChangeStatus: (id: string, s: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (inv: Invoice) => void;
  onPrint: (inv: Invoice) => void;
  onSendWA: (id: string) => void;
  onSendSMS: (id: string) => void;
  sendingWA: boolean;
  sendingSMS: boolean;
}) {
  const hasPhone = !!inv.customer?.phone && (inv.status === "sent" || inv.status === "overdue");

  return (
    <div style={{ borderBottom: `1px solid ${S.border}` }}>
      <div
        className="flex items-start gap-3 px-4 py-4 transition-colors"
        style={{ backgroundColor: isExpanded ? "var(--c-primary-light)" : "" }}
        onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--c-primary-light)"; }}
        onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.backgroundColor = ""; }}
      >
        {inv.customer ? <Avatar name={inv.customer.name} /> : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold" style={{ backgroundColor: S.bg, color: S.muted }}>?</div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold" style={{ color: S.primary }}>{inv.invoiceNumber}</span>
              <StatusBadge status={inv.status} />
            </div>
            <p className="text-base font-bold" style={{ color: S.text }}>৳{inv.total.toLocaleString("bn-BD")}</p>
          </div>

          <div className="flex items-center justify-between gap-2 mt-1 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: inv.customer ? S.text : S.muted }}>
                {inv.customer?.name ?? "অতিথি কাস্টমার"}
              </span>
              <span className="text-xs" style={{ color: S.muted }}>• {new Date(inv.createdAt).toLocaleDateString("bn-BD")}</span>
            </div>
            <DueDateBadge dueDate={inv.dueDate} status={inv.status} />
          </div>

          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {hasPhone && (
              <>
                <button
                  onClick={() => onSendWA(inv.id)}
                  disabled={sendingWA}
                  title="WhatsApp এ ইনভয়েস পাঠান"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                  style={{ color: "#25D366", backgroundColor: "#F0FDF4" }}
                >
                  <MessageCircle size={13} />
                  {sendingWA ? "পাঠানো হচ্ছে..." : "WhatsApp"}
                </button>
                <button
                  onClick={() => onSendSMS(inv.id)}
                  disabled={sendingSMS}
                  title="SMS পাঠান"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                  style={{ color: "#3B82F6", backgroundColor: "#EFF6FF" }}
                >
                  <MessageSquare size={13} />
                  {sendingSMS ? "..." : "SMS"}
                </button>
                <span className="text-xs" style={{ color: S.border }}>|</span>
              </>
            )}

            {inv.status === "draft" && (
              <button onClick={() => onChangeStatus(inv.id, "sent")} className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ color: S.primary, backgroundColor: S.primaryLight }}>
                <Send size={11} className="inline mr-1" />পাঠান
              </button>
            )}
            {(inv.status === "sent" || inv.status === "overdue") && (
              <button onClick={() => onChangeStatus(inv.id, "paid")} className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ color: "#059669", backgroundColor: "#DCFCE7" }}>
                <Check size={11} className="inline mr-1" />পরিশোধিত
              </button>
            )}
            {inv.status === "sent" && isPastDue(inv.dueDate) && (
              <button onClick={() => onChangeStatus(inv.id, "overdue")} className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ color: "#DC2626", backgroundColor: "#FEE2E2" }}>
                বকেয়া চিহ্নিত
              </button>
            )}

            <button onClick={() => onDuplicate(inv)} title="অনুলিপি তৈরি" className="p-1.5 rounded-lg transition-colors" style={{ color: S.muted }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = S.bg)} onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
              <Copy size={13} />
            </button>
            <button onClick={() => onPrint(inv)} title="প্রিন্ট" className="p-1.5 rounded-lg transition-colors" style={{ color: S.muted }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = S.bg)} onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
              <Printer size={13} />
            </button>
            <button onClick={() => onDelete(inv.id)} title="মুছুন" className="p-1.5 rounded-lg transition-colors" onMouseEnter={e => (e.currentTarget.style.color = "#DC2626")} onMouseLeave={e => (e.currentTarget.style.color = S.muted)} style={{ color: S.muted }}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <button onClick={onToggle} className="flex-shrink-0 mt-1 p-1 rounded-lg transition-colors" style={{ color: S.muted }} title={isExpanded ? "বন্ধ করুন" : "আইটেম দেখুন"}>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4" style={{ backgroundColor: "var(--c-primary-light)" }}>
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${S.border}` }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: S.surface }}>
                  <th className="px-3 py-2 text-left text-xs font-semibold" style={{ color: S.muted }}>পণ্য / সেবা</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold" style={{ color: S.muted }}>পরিমাণ</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: S.muted }}>একক মূল্য</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: S.muted }}>মোট</th>
                </tr>
              </thead>
              <tbody>
                {inv.items.map(item => (
                  <tr key={item.id} style={{ borderTop: `1px solid ${S.border}` }}>
                    <td className="px-3 py-2" style={{ color: S.text }}>{item.description}</td>
                    <td className="px-3 py-2 text-center" style={{ color: S.muted }}>{item.quantity}</td>
                    <td className="px-3 py-2 text-right" style={{ color: S.muted }}>৳{item.unitPrice.toLocaleString("bn-BD")}</td>
                    <td className="px-3 py-2 text-right font-semibold" style={{ color: S.text }}>৳{item.subtotal.toLocaleString("bn-BD")}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {inv.discount > 0 && (
                  <tr style={{ borderTop: `1px solid ${S.border}` }}>
                    <td colSpan={3} className="px-3 py-2 text-right text-xs" style={{ color: S.muted }}>ছাড়:</td>
                    <td className="px-3 py-2 text-right text-xs" style={{ color: S.muted }}>- ৳{inv.discount.toLocaleString("bn-BD")}</td>
                  </tr>
                )}
                <tr style={{ borderTop: `2px solid ${S.border}` }}>
                  <td colSpan={3} className="px-3 py-2 text-right text-sm font-bold" style={{ color: S.text }}>মোট:</td>
                  <td className="px-3 py-2 text-right text-sm font-bold" style={{ color: S.primary }}>৳{inv.total.toLocaleString("bn-BD")}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {inv.notes && (
            <p className="mt-2 text-xs px-1" style={{ color: S.muted }}>📝 {inv.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [sendingWA, setSendingWA] = useState<string | null>(null);
  const [sendingSMS, setSendingSMS] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [shopName, setShopName] = useState("আমার দোকান");

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => { if (d.shop?.name) setShopName(d.shop.name); }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const q = filterStatus ? `?status=${filterStatus}` : "";
    const res = await fetch(`/api/invoices${q}`);
    const data = await res.json();
    setInvoices(data.invoices ?? []);
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const showToast = useCallback((msg: string, type: "success" | "error") => setToast({ msg, type }), []);

  async function changeStatus(id: string, status: string) {
    await fetch(`/api/invoices/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }

  async function deleteInvoice(id: string) {
    if (!confirm("এই ইনভয়েসটি মুছে ফেলবেন?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    load();
  }

  async function duplicateInvoice(inv: Invoice) {
    setDuplicating(inv.id);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: null,
        items: inv.items.map(i => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })),
        discount: inv.discount,
        notes: inv.notes || "",
        dueDate: null,
      }),
    });
    setDuplicating(null);
    if (res.ok) {
      showToast("ইনভয়েসের অনুলিপি তৈরি হয়েছে!", "success");
      load();
    } else {
      showToast("অনুলিপি তৈরি করা যায়নি", "error");
    }
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
    load();
  }

  const overdueCount = invoices.filter(inv => inv.status === "sent" && isPastDue(inv.dueDate)).length;
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const totalPending = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + i.total, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, var(--c-primary) 0%, #0A5442 100%)" }}>
            <FileText size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>ইনভয়েস</h1>
            <p className="text-xs" style={{ color: S.muted }}>কাস্টমারদের ইনভয়েস তৈরি ও ট্র্যাক করুন</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}
        >
          <Plus size={16} /> নতুন ইনভয়েস
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "মোট ইনভয়েস", value: invoices.length.toString(), color: "var(--c-primary)", bg: "var(--c-primary-light)", icon: FileText },
          { label: "পরিশোধিত", value: `৳${totalPaid.toLocaleString("bn-BD")}`, color: "#059669", bg: "#DCFCE7", icon: Check },
          { label: "বাকি আছে", value: `৳${totalPending.toLocaleString("bn-BD")}`, color: "#DC2626", bg: "#FEE2E2", icon: Clock },
          { label: "খসড়া", value: invoices.filter(i => i.status === "draft").length.toString(), color: "#6B7280", bg: "#F3F4F6", icon: FileText },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.bg }}>
                <stat.icon size={15} style={{ color: stat.color }} />
              </div>
              <p className="text-xs font-medium" style={{ color: S.muted }}>{stat.label}</p>
            </div>
            <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {overdueCount > 0 && !dismissedBanner && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} color="#DC2626" />
            <p className="text-sm font-semibold" style={{ color: "#DC2626" }}>{overdueCount} টি ইনভয়েসের পেমেন্ট ডেডলাইন পার হয়ে গেছে</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={markAllOverdue} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ color: "#fff", backgroundColor: "#DC2626" }}>
              বকেয়া চিহ্নিত করুন
            </button>
            <button onClick={() => setDismissedBanner(true)}><X size={15} color="#DC2626" /></button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 p-1 rounded-2xl w-fit overflow-x-auto" style={{ backgroundColor: S.bg, border: `1px solid ${S.border}` }}>
        {[{ value: "", label: "সব" }, ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
            style={{ backgroundColor: filterStatus === tab.value ? S.primary : "transparent", color: filterStatus === tab.value ? "#fff" : S.muted }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${S.border}` }}>
        {loading ? (
          <div className="p-5 space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 rounded-xl" style={{ backgroundColor: S.bg }} />)}
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center" style={{ backgroundColor: S.surface }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "var(--c-primary-light)" }}>
              <FileText size={28} style={{ color: "var(--c-primary)" }} />
            </div>
            <p className="font-semibold text-sm" style={{ color: S.text }}>কোনো ইনভয়েস নেই</p>
            <p className="text-xs mt-1.5 mb-4" style={{ color: S.muted }}>প্রথম ইনভয়েসটি এখনই তৈরি করুন</p>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
              <Plus size={15} /> নতুন ইনভয়েস
            </button>
          </div>
        ) : (
          <div style={{ backgroundColor: S.surface }}>
            {invoices.map(inv => (
              <InvoiceRow
                key={inv.id}
                inv={inv}
                isExpanded={expandedId === inv.id}
                onToggle={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                onChangeStatus={changeStatus}
                onDelete={deleteInvoice}
                onDuplicate={duplicateInvoice}
                onPrint={(i) => printInvoice(i, shopName)}
                onSendWA={sendWhatsApp}
                onSendSMS={sendSMSReminder}
                sendingWA={sendingWA === inv.id}
                sendingSMS={sendingSMS === inv.id}
              />
            ))}
          </div>
        )}
      </div>

      {duplicating && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-medium shadow-xl" style={{ backgroundColor: S.primary }}>
          অনুলিপি তৈরি হচ্ছে...
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {showModal && <CreateInvoiceModal onClose={() => setShowModal(false)} onSave={load} />}
    </div>
  );
}
