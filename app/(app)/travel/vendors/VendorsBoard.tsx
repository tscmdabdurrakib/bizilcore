"use client";

import { useEffect, useState } from "react";
import { HandCoins, Plus, X, Loader2, Edit2, Trash2 } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface Vendor {
  id: string;
  name: string;
  type: string;
  contact?: string;
  accountInfo?: string;
  dueToVendor: number;
  notes?: string;
}

const VENDOR_TYPES = [
  { value: "airline",       label: "এয়ারলাইন" },
  { value: "bus",           label: "বাস কোম্পানি" },
  { value: "hotel",         label: "হোটেল" },
  { value: "tour_operator", label: "ট্যুর অপারেটর" },
  { value: "visa_agent",    label: "ভিসা এজেন্ট" },
];

const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  airline:       { color: "#0891B2", bg: "#ECFEFF" },
  bus:           { color: "#7C3AED", bg: "#F5F3FF" },
  hotel:         { color: "#B45309", bg: "#FEF3C7" },
  tour_operator: { color: "#0F6E56", bg: "#E1F5EE" },
  visa_agent:    { color: "#DC2626", bg: "#FEE2E2" },
};

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};
const inputCls = "w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500";
const inputStyle = { borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text)" };

const emptyForm = { name: "", type: "airline", contact: "", accountInfo: "", dueToVendor: "", notes: "" };

export default function VendorsBoard() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [payModal, setPayModal] = useState<{ vendor: Vendor; amount: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/travel/vendors");
    if (res.ok) setVendors(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const openEdit = (v: Vendor) => {
    setEditing(v);
    setForm({ name: v.name, type: v.type, contact: v.contact ?? "", accountInfo: v.accountInfo ?? "", dueToVendor: String(v.dueToVendor), notes: v.notes ?? "" });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    const method = editing ? "PUT" : "POST";
    const body = editing ? { ...form, id: editing.id } : form;
    const res = await fetch("/api/travel/vendors", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { await load(); setShowForm(false); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই vendor মুছে ফেলবেন?")) return;
    await fetch(`/api/travel/vendors?id=${id}`, { method: "DELETE" });
    await load();
  };

  const handlePayment = async () => {
    if (!payModal || !payModal.amount) return;
    const vendor = payModal.vendor;
    const paid = parseFloat(payModal.amount);
    const newDue = Math.max(0, vendor.dueToVendor - paid);
    await fetch("/api/travel/vendors", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: vendor.id, name: vendor.name, type: vendor.type, dueToVendor: newDue }),
    });
    await load();
    setPayModal(null);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#0891B2" }} /></div>;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>Vendor ম্যানেজমেন্ট</h1>
          <p className="text-sm" style={{ color: S.muted }}>{vendors.length}টি vendor</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#0891B2" }}>
          <Plus size={16} /> নতুন Vendor
        </button>
      </div>

      {/* List */}
      {vendors.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <HandCoins size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">কোনো vendor নেই</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vendors.map((v) => {
            const typeColor = TYPE_COLORS[v.type] ?? { color: "#6B7280", bg: "#F3F4F6" };
            const typeLabel = VENDOR_TYPES.find(t => t.value === v.type)?.label ?? v.type;
            return (
              <div key={v.id} className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: typeColor.bg }}>
                      <HandCoins size={18} style={{ color: typeColor.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm" style={{ color: S.text }}>{v.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: typeColor.bg, color: typeColor.color }}>{typeLabel}</span>
                      </div>
                      {v.contact && <p className="text-xs mt-0.5" style={{ color: S.muted }}>{v.contact}</p>}
                      {v.accountInfo && <p className="text-xs" style={{ color: S.muted }}>{v.accountInfo}</p>}
                      {v.notes && <p className="text-xs mt-1 italic" style={{ color: S.muted }}>{v.notes}</p>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {v.dueToVendor > 0 ? (
                      <>
                        <p className="text-xs font-medium" style={{ color: S.muted }}>প্রদেয়</p>
                        <p className="font-bold" style={{ color: "#DC2626" }}>{formatBDT(v.dueToVendor)}</p>
                      </>
                    ) : (
                      <p className="text-xs font-semibold" style={{ color: "#0F6E56" }}>পরিশোধিত</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: S.border }}>
                  {v.dueToVendor > 0 && (
                    <button onClick={() => setPayModal({ vendor: v, amount: "" })} className="flex-1 py-1.5 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: "#0F6E56" }}>
                      পেমেন্ট দিয়েছি
                    </button>
                  )}
                  <button onClick={() => openEdit(v)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border" style={{ borderColor: S.border, color: S.text }}>
                    <Edit2 size={12} /> সম্পাদনা
                  </button>
                  <button onClick={() => handleDelete(v.id)} className="w-8 h-8 rounded-xl flex items-center justify-center border" style={{ borderColor: "#FCA5A5" }}>
                    <Trash2 size={13} style={{ color: "#EF4444" }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-3" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ color: S.text }}>পেমেন্ট করেছি</h3>
              <button onClick={() => setPayModal(null)}><X size={18} /></button>
            </div>
            <p className="text-sm" style={{ color: S.muted }}>{payModal.vendor.name} — বাকি {formatBDT(payModal.vendor.dueToVendor)}</p>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পরিমাণ *</label>
              <input className={inputCls} style={inputStyle} type="number" max={payModal.vendor.dueToVendor} placeholder={`সর্বোচ্চ ${formatBDT(payModal.vendor.dueToVendor)}`} value={payModal.amount} onChange={e => setPayModal(m => m ? { ...m, amount: e.target.value } : m)} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPayModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={handlePayment} disabled={!payModal.amount} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#0F6E56" }}>
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl p-5 space-y-3" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ color: S.text }}>{editing ? "Vendor সম্পাদনা" : "নতুন Vendor"}</h3>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>নাম *</label>
                <input className={inputCls} style={inputStyle} placeholder="Biman Bangladesh" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ধরন</label>
                <select className={inputCls} style={inputStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {VENDOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>যোগাযোগ</label>
                <input className={inputCls} style={inputStyle} placeholder="ফোন / ইমেইল" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>অ্যাকাউন্ট তথ্য</label>
                <input className={inputCls} style={inputStyle} placeholder="ব্যাংক / bKash নম্বর" value={form.accountInfo} onChange={e => setForm(f => ({ ...f, accountInfo: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>প্রদেয় পরিমাণ</label>
                <input className={inputCls} style={inputStyle} type="number" placeholder="৳" value={form.dueToVendor} onChange={e => setForm(f => ({ ...f, dueToVendor: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>নোট</label>
                <input className={inputCls} style={inputStyle} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={handleSave} disabled={saving || !form.name} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#0891B2" }}>
                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "সেভ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
