"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Phone, MapPin, Trash2, X, Truck, AlertTriangle, ShoppingBag } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface Supplier {
  id: string; name: string; phone: string | null; address: string | null;
  email: string | null; note: string | null; dueAmount: number;
  _count: { purchases: number };
}

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)",
  bg: "var(--c-bg)",
};

const inp = (f: boolean) => ({
  height: "40px", border: `1px solid ${f ? "var(--c-primary)" : "var(--c-border)"}`,
  borderRadius: "10px", color: "var(--c-text)", backgroundColor: "var(--c-surface)",
  padding: "0 12px", fontSize: "14px", outline: "none", width: "100%",
  transition: "border-color 0.15s",
});

const SUPPLIER_COLORS = ["#0F6E56", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#EF4444", "#14B8A6"];

function getColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % SUPPLIER_COLORS.length;
  return SUPPLIER_COLORS[h];
}

function SupplierModal({ initial, onClose, onSave }: {
  initial?: Supplier; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({ name: initial?.name ?? "", phone: initial?.phone ?? "", address: initial?.address ?? "", email: initial?.email ?? "", note: initial?.note ?? "" });
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    const method = initial ? "PATCH" : "POST";
    const url = initial ? `/api/suppliers/${initial.id}` : "/api/suppliers";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false);
    onSave();
    onClose();
  }

  const fields = [
    { key: "name", label: "নাম *", ph: "Supplier-এর নাম", type: "text", req: true },
    { key: "phone", label: "ফোন", ph: "01XXXXXXXXX", type: "tel", req: false },
    { key: "address", label: "ঠিকানা", ph: "ঠিকানা লিখুন", type: "text", req: false },
    { key: "email", label: "Email", ph: "email@example.com", type: "email", req: false },
    { key: "note", label: "নোট", ph: "ঐচ্ছিক মন্তব্য", type: "text", req: false },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{ backgroundColor: S.surface }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-base" style={{ color: S.text }}>
              {initial ? "Supplier সম্পাদনা" : "নতুন Supplier"}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: S.muted }}>সরবরাহকারীর তথ্য লিখুন</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: S.bg }}>
            <X size={16} style={{ color: S.muted }} />
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-3">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: S.secondary }}>{f.label}</label>
              <input
                type={f.type}
                value={(form as Record<string, string>)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.ph}
                required={f.req}
                style={inp(focused === f.key)}
                onFocus={() => setFocused(f.key)}
                onBlur={() => setFocused(null)}
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.secondary }}>
              বাতিল
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: S.primary }}>
              {loading ? "সেভ হচ্ছে..." : "সেভ করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3500);
  }

  async function fetchSuppliers() {
    setLoading(true);
    const r = await fetch(`/api/suppliers${search ? `?search=${encodeURIComponent(search)}` : ""}`);
    const data = await r.json();
    setSuppliers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { fetchSuppliers(); }, [search]);

  async function handleDelete() {
    if (!deleteId) return;
    const r = await fetch(`/api/suppliers/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    if (r.ok) { showToast("success", "Supplier মুছে দেওয়া হয়েছে ✓"); fetchSuppliers(); }
    else showToast("error", "মুছতে পারেনি।");
  }

  const totalDue = suppliers.reduce((s, x) => s + x.dueAmount, 0);
  const totalPurchases = suppliers.reduce((s, x) => s + x._count.purchases, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-white text-sm font-medium shadow-xl"
          style={{ backgroundColor: toast.type === "success" ? "#0F6E56" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      {showModal && (
        <SupplierModal
          initial={editSupplier}
          onClose={() => { setShowModal(false); setEditSupplier(undefined); }}
          onSave={fetchSuppliers}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl" style={{ backgroundColor: S.surface }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#FFE8E8" }}>
              <Trash2 size={24} color="#E24B4A" />
            </div>
            <h3 className="font-bold text-base mb-1" style={{ color: S.text }}>Supplier মুছবেন?</h3>
            <p className="text-sm mb-6" style={{ color: S.muted }}>এই supplier-এর সব purchase history মুছে যাবে।</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.secondary }}>বাতিল</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: "#E24B4A" }}>মুছে দিন</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)" }}>
            <Truck size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>Supplier ম্যানেজমেন্ট</h1>
            <p className="text-xs" style={{ color: S.muted }}>{suppliers.length}টি Supplier · মোট {totalPurchases}টি Purchase</p>
          </div>
        </div>
        <button
          onClick={() => { setEditSupplier(undefined); setShowModal(true); }}
          className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-semibold shadow-sm"
          style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}
        >
          <Plus size={16} /> নতুন Supplier
        </button>
      </div>

      {/* Due alert */}
      {totalDue > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border" style={{ backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }}>
          <AlertTriangle size={18} color="#D97706" className="flex-shrink-0" />
          <p className="text-sm" style={{ color: "#92600A" }}>
            মোট Supplier বাকি: <strong>{formatBDT(totalDue)}</strong> — দ্রুত পরিশোধ করুন
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
        <input
          type="text"
          placeholder="Supplier-এর নাম বা ফোন দিয়ে খুঁজুন..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 h-11 rounded-xl border text-sm outline-none"
          style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-2xl" style={{ backgroundColor: S.surface }} />
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#F5E8FF" }}>
            <Truck size={28} color="#8B5CF6" />
          </div>
          <p className="font-semibold text-sm" style={{ color: S.secondary }}>কোনো Supplier নেই।</p>
          <p className="text-xs mt-1 mb-4" style={{ color: S.muted }}>পণ্যের সরবরাহকারী যোগ করুন</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: S.primary }}
          >
            + নতুন Supplier যোগ করুন
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
          {suppliers.map((sup, i) => {
            const color = getColor(sup.name);
            return (
              <div
                key={sup.id}
                className="flex items-center gap-4 px-5 py-4 transition-colors"
                style={{
                  backgroundColor: S.surface,
                  borderBottom: i < suppliers.length - 1 ? `1px solid ${S.border}` : "none",
                  borderLeft: `3px solid ${color}`,
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = S.bg)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = S.surface)}
              >
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {sup.name[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: S.text }}>{sup.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {sup.phone && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: S.muted }}>
                        <Phone size={10} /> {sup.phone}
                      </span>
                    )}
                    {sup.address && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: S.muted }}>
                        <MapPin size={10} /> {sup.address}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: S.muted }}>
                      <ShoppingBag size={10} /> {sup._count.purchases}টি Purchase
                    </span>
                  </div>
                </div>

                {/* Due amount */}
                {sup.dueAmount > 0 && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px]" style={{ color: S.muted }}>বাকি</p>
                    <p className="font-bold text-sm" style={{ color: "#E24B4A" }}>{formatBDT(sup.dueAmount)}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => { setEditSupplier(sup); setShowModal(true); }}
                    className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                    style={{ borderColor: S.border, color: S.secondary, backgroundColor: "transparent" }}
                  >
                    সম্পাদনা
                  </button>
                  <button
                    onClick={() => setDeleteId(sup.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50"
                  >
                    <Trash2 size={14} style={{ color: "#E24B4A" }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
