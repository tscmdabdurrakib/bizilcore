"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, Copy, CheckCircle, XCircle, Send, Eye, ExternalLink } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import DatePicker from "@/components/ui/DatePicker";

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "#6366F1",
};

const CURRENCIES = ["BDT", "USD", "EUR", "GBP"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:      { label: "Draft",     color: "#6B7280", bg: "#F9FAFB" },
  sent:       { label: "পাঠানো",   color: "#3B82F6", bg: "#EFF6FF" },
  viewed:     { label: "দেখেছেন",  color: "#8B5CF6", bg: "#F5F3FF" },
  paid:       { label: "পেমেন্ট",  color: "#10B981", bg: "#ECFDF5" },
  overdue:    { label: "Overdue",   color: "#EF4444", bg: "#FEF2F2" },
  cancelled:  { label: "বাতিল",    color: "#9CA3AF", bg: "#F3F4F6" },
};

type Invoice = {
  id: string; invoiceNumber: string; token: string; status: string;
  currency: string; totalAmount: number; dueDate: string | null;
  createdAt: string; paidAt: string | null;
  client: { id: string; name: string; phone: string | null };
  project: { id: string; projectNumber: string; title: string } | null;
  items: Array<{ description: string; quantity: number; rate: number; total: number }>;
  subtotal: number; discountAmt: number; taxRate: number; taxAmount: number;
  paymentNote: string | null;
};

type Customer = { id: string; name: string; phone: string | null };
type Project = { id: string; projectNumber: string; title: string };

export default function InvoicesBoard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showDetailId, setShowDetailId] = useState<string | null>(null);
  const [clients, setClients] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [saving, setSaving] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const [form, setForm] = useState({
    projectId: "", clientId: "", currency: "BDT", exchangeRate: "1",
    items: [{ description: "", quantity: "1", rate: "", total: "" }],
    discountAmt: "0", taxRate: "0", dueDate: "", paymentNote: "", status: "draft",
  });

  useEffect(() => { loadInvoices(); }, [statusFilter]);

  async function loadInvoices() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    const r = await fetch(`/api/freelance/invoices?${params}`);
    const data = await r.json();
    setInvoices(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function loadOptions() {
    const [cr, pr] = await Promise.all([
      fetch("/api/customers?limit=200").then(r => r.json()),
      fetch("/api/freelance/projects").then(r => r.json()),
    ]);
    setClients(Array.isArray(cr) ? cr : (cr.customers ?? []));
    setProjects(Array.isArray(pr) ? pr : []);
  }

  function openModal() {
    loadOptions();
    setForm({
      projectId: "", clientId: "", currency: "BDT", exchangeRate: "1",
      items: [{ description: "", quantity: "1", rate: "", total: "" }],
      discountAmt: "0", taxRate: "0", dueDate: "", paymentNote: "", status: "draft",
    });
    setShowModal(true);
  }

  function updateItem(i: number, field: string, value: string) {
    setForm(f => {
      const items = [...f.items];
      items[i] = { ...items[i], [field]: value };
      if (field === "quantity" || field === "rate") {
        const qty = parseFloat(field === "quantity" ? value : items[i].quantity) || 0;
        const rate = parseFloat(field === "rate" ? value : items[i].rate) || 0;
        items[i].total = (qty * rate).toString();
      }
      return { ...f, items };
    });
  }

  function addItem() {
    setForm(f => ({ ...f, items: [...f.items, { description: "", quantity: "1", rate: "", total: "" }] }));
  }

  function removeItem(i: number) {
    setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  }

  const subtotal = form.items.reduce((s, it) => s + (parseFloat(it.total) || 0), 0);
  const discountAmt = parseFloat(form.discountAmt) || 0;
  const taxRate = parseFloat(form.taxRate) || 0;
  const taxAmount = (subtotal - discountAmt) * (taxRate / 100);
  const totalAmount = subtotal - discountAmt + taxAmount;

  async function saveInvoice(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const items = form.items.map(it => ({
      description: it.description,
      quantity: parseFloat(it.quantity) || 1,
      rate: parseFloat(it.rate) || 0,
      total: parseFloat(it.total) || 0,
    }));

    await fetch("/api/freelance/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: form.projectId || null,
        clientId: form.clientId,
        currency: form.currency,
        exchangeRate: parseFloat(form.exchangeRate) || 1,
        items, subtotal, discountAmt, taxRate, taxAmount, totalAmount,
        dueDate: form.dueDate || null,
        paymentNote: form.paymentNote || null,
        status: form.status,
      }),
    });
    setShowModal(false);
    loadInvoices();
    setSaving(false);
  }

  async function markPaid(id: string) {
    await fetch(`/api/freelance/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_paid" }),
    });
    loadInvoices();
  }

  async function markSent(id: string) {
    await fetch(`/api/freelance/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_sent" }),
    });
    loadInvoices();
  }

  async function cancelInvoice(id: string) {
    await fetch(`/api/freelance/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    loadInvoices();
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/invoice/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  const statusCounts = Object.keys(STATUS_CONFIG).reduce((acc, k) => {
    acc[k] = invoices.filter(inv => inv.status === k).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText size={22} style={{ color: S.primary }} />
          <h1 className="text-xl font-bold" style={{ color: S.text }}>Invoice</h1>
        </div>
        <button onClick={openModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: S.primary }}>
          <Plus size={16} /> নতুন Invoice
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {[{ key: "all", label: "সব", count: invoices.length }, ...Object.entries(STATUS_CONFIG).map(([k, c]) => ({ key: k, label: c.label, count: statusCounts[k] ?? 0 }))].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: statusFilter === tab.key ? S.primary : S.surface,
              color: statusFilter === tab.key ? "#fff" : S.muted,
              border: `1px solid ${statusFilter === tab.key ? S.primary : S.border}`,
            }}
          >
            {tab.label} <span className="text-xs opacity-70">{tab.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "#E0E7FF", borderTopColor: S.primary }} />
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ background: S.surface, borderColor: S.border }}>
          <FileText size={40} className="mx-auto mb-3" style={{ color: S.muted }} />
          <p style={{ color: S.muted }}>কোনো invoice নেই</p>
          <button onClick={openModal} className="mt-3 text-sm font-semibold" style={{ color: S.primary }}>
            + নতুন invoice তৈরি করুন
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--c-bg)" }}>
                {["Invoice #", "ক্লায়েন্ট", "প্রজেক্ট", "পরিমাণ", "Due Date", "স্ট্যাটাস", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: S.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => {
                const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.draft;
                return (
                  <tr key={inv.id} className="border-t" style={{ borderColor: S.border }}>
                    <td className="px-4 py-3 font-mono font-bold text-xs" style={{ color: S.primary }}>{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: S.text }}>{inv.client.name}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: S.muted }}>
                      {inv.project ? inv.project.projectNumber : "—"}
                    </td>
                    <td className="px-4 py-3 font-bold" style={{ color: S.text }}>
                      {inv.currency !== "BDT" ? `${inv.currency} ${inv.totalAmount.toLocaleString()}` : formatBDT(inv.totalAmount)}
                    </td>
                    <td className="px-4 py-3" style={{ color: inv.status === "overdue" ? "#DC2626" : S.muted }}>
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("bn-BD") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => copyLink(inv.token)} title="লিংক কপি করুন"
                          className="p-1.5 rounded-lg hover:bg-gray-100">
                          {copiedToken === inv.token ? <CheckCircle size={14} style={{ color: "#10B981" }} /> : <Copy size={14} style={{ color: S.muted }} />}
                        </button>
                        <a href={`/invoice/${inv.token}`} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-gray-100">
                          <Eye size={14} style={{ color: S.muted }} />
                        </a>
                        {inv.status === "draft" && (
                          <button onClick={() => markSent(inv.id)} title="পাঠান"
                            className="p-1.5 rounded-lg hover:bg-blue-50">
                            <Send size={14} style={{ color: "#3B82F6" }} />
                          </button>
                        )}
                        {["sent", "viewed", "overdue"].includes(inv.status) && (
                          <button onClick={() => markPaid(inv.id)} title="পেমেন্ট মার্ক করুন"
                            className="p-1.5 rounded-lg hover:bg-green-50">
                            <CheckCircle size={14} style={{ color: "#10B981" }} />
                          </button>
                        )}
                        {!["paid", "cancelled"].includes(inv.status) && (
                          <button onClick={() => cancelInvoice(inv.id)} title="বাতিল করুন"
                            className="p-1.5 rounded-lg hover:bg-red-50">
                            <XCircle size={14} style={{ color: "#EF4444" }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: S.surface }}>
            <div className="p-5 border-b" style={{ borderColor: S.border }}>
              <h2 className="text-lg font-bold" style={{ color: S.text }}>নতুন Invoice তৈরি করুন</h2>
            </div>
            <form onSubmit={saveInvoice} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>ক্লায়েন্ট *</label>
                  <select required value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}>
                    <option value="">-- বেছে নিন --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>প্রজেক্ট (ঐচ্ছিক)</label>
                  <select value={form.projectId} onChange={e => {
                    const proj = projects.find(p => p.id === e.target.value);
                    setForm(f => ({ ...f, projectId: e.target.value }));
                    if (proj) {
                      const client = clients.find(c => c.id === (proj as Project & { clientId?: string }).clientId);
                    }
                  }}
                    className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}>
                    <option value="">-- কোনো প্রজেক্ট নেই --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.projectNumber} — {p.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>Currency</label>
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}>
                    {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>Due Date</label>
                  <DatePicker
  value={form.dueDate}
  onChange={v => setForm(f => ({ ...f, dueDate: v }))}
  className="w-full px-3 py-2 rounded-xl border text-sm"
  style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}
/>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>স্ট্যাটাস</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}>
                    <option value="draft">Draft</option>
                    <option value="sent">পাঠান</option>
                  </select>
                </div>
              </div>

              {/* Line items */}
              <div>
                <label className="text-xs font-semibold block mb-2" style={{ color: S.muted }}>আইটেম</label>
                <div className="space-y-2">
                  {form.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input value={item.description} onChange={e => updateItem(i, "description", e.target.value)}
                        placeholder="বিবরণ" required
                        className="col-span-5 px-2 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }} />
                      <input type="number" value={item.quantity} onChange={e => updateItem(i, "quantity", e.target.value)}
                        placeholder="Qty"
                        className="col-span-2 px-2 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }} />
                      <input type="number" value={item.rate} onChange={e => updateItem(i, "rate", e.target.value)}
                        placeholder="Rate" required
                        className="col-span-2 px-2 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }} />
                      <div className="col-span-2 px-2 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.text, background: "var(--c-bg)" }}>
                        {parseFloat(item.total) ? parseFloat(item.total).toLocaleString() : "0"}
                      </div>
                      <button type="button" onClick={() => removeItem(i)} className="col-span-1 text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItem} className="mt-2 text-sm font-semibold" style={{ color: S.primary }}>
                  + আরো যোগ করুন
                </button>
              </div>

              {/* Totals */}
              <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: S.border }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: S.muted }}>Subtotal</span>
                  <span style={{ color: S.text }}>{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm" style={{ color: S.muted }}>ছাড় (৳)</span>
                  <input type="number" value={form.discountAmt} onChange={e => setForm(f => ({ ...f, discountAmt: e.target.value }))}
                    className="w-24 px-2 py-1 rounded-lg border text-sm text-right" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm" style={{ color: S.muted }}>ট্যাক্স/VAT (%)</span>
                  <input type="number" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))}
                    className="w-24 px-2 py-1 rounded-lg border text-sm text-right" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }} />
                </div>
                <div className="flex justify-between text-base font-bold border-t pt-2" style={{ borderColor: S.border }}>
                  <span style={{ color: S.text }}>মোট</span>
                  <span style={{ color: S.primary }}>{form.currency} {totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>পেমেন্ট নির্দেশনা</label>
                <textarea value={form.paymentNote} onChange={e => setForm(f => ({ ...f, paymentNote: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}
                  placeholder="bKash: 01XXXXXXXXX | Bank: [account info]" />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border text-sm font-semibold" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: S.primary }}>
                  {saving ? "সেভ হচ্ছে..." : "Invoice তৈরি করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
