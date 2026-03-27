"use client";

import { useEffect, useState } from "react";
import { Tag, Plus, Loader2, Pencil, Trash2, X, Check } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number | null;
  maxDiscount: number | null;
  maxUse: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

const EMPTY_FORM = {
  code: "",
  type: "percent" as "percent" | "fixed",
  value: "",
  minOrder: "",
  maxDiscount: "",
  maxUse: "",
  expiresAt: "",
};

export default function StoreCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const S = {
    surface: "var(--c-surface)",
    border: "var(--c-border)",
    text: "var(--c-text)",
    muted: "var(--c-text-muted)",
    secondary: "var(--c-text-sub)",
    primary: "var(--c-primary)",
  };

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function fetchCoupons() {
    const r = await fetch("/api/coupons");
    if (r.ok) setCoupons(await r.json());
    setLoading(false);
  }

  useEffect(() => { fetchCoupons(); }, []);

  function openNew() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(c: Coupon) {
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      minOrder: c.minOrder != null ? String(c.minOrder) : "",
      maxDiscount: c.maxDiscount != null ? String(c.maxDiscount) : "",
      maxUse: c.maxUse != null ? String(c.maxUse) : "",
      expiresAt: c.expiresAt ? c.expiresAt.split("T")[0] : "",
    });
    setEditId(c.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.code || !form.value) { showToast("error", "কোড ও মান দিন"); return; }
    setSaving(true);
    const body = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: Number(form.value),
      minOrder: form.minOrder ? Number(form.minOrder) : null,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      maxUse: form.maxUse ? Number(form.maxUse) : null,
      expiresAt: form.expiresAt || null,
    };
    const url = editId ? `/api/coupons/${editId}` : "/api/coupons";
    const method = editId ? "PATCH" : "POST";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (r.ok) {
      showToast("success", editId ? "আপডেট হয়েছে ✓" : "কুপন তৈরি হয়েছে ✓");
      setShowForm(false);
      fetchCoupons();
    } else {
      const d = await r.json();
      showToast("error", d.error ?? "সেভ করা যায়নি");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const r = await fetch(`/api/coupons/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    if (r.ok) { showToast("success", "মুছে দেওয়া হয়েছে"); fetchCoupons(); }
    else showToast("error", "মুছতে পারিনি");
  }

  async function toggleActive(c: Coupon) {
    const r = await fetch(`/api/coupons/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    if (r.ok) fetchCoupons();
  }

  function isExpired(c: Coupon) {
    return c.expiresAt ? new Date(c.expiresAt) < new Date() : false;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 size={24} className="animate-spin" style={{ color: S.muted }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 max-w-sm w-full" style={{ backgroundColor: S.surface }}>
            <h3 className="font-semibold text-base mb-2" style={{ color: S.text }}>কুপন মুছে দিন?</h3>
            <p className="text-sm mb-5" style={{ color: S.secondary }}>এই কাজ undo করা যাবে না।</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: "#E24B4A" }}>
                {deleting ? "মুছছে..." : "মুছে দিন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between p-5 border-b sticky top-0" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <p className="font-semibold text-sm" style={{ color: S.text }}>{editId ? "কুপন সম্পাদনা" : "নতুন কুপন"}</p>
              <button onClick={() => setShowForm(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: S.secondary }}>কুপন কোড *</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="SAVE20" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                  style={{ backgroundColor: S.surface, borderColor: S.border, color: S.text }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: S.secondary }}>ধরন *</label>
                <div className="flex gap-2">
                  {(["percent", "fixed"] as const).map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                      className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
                      style={form.type === t ? { backgroundColor: S.primary, color: "#fff", borderColor: S.primary } : { borderColor: S.border, color: S.text }}>
                      {t === "percent" ? "% শতাংশ" : "৳ নির্দিষ্ট"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: S.secondary }}>
                  মান * {form.type === "percent" ? "(%)" : "(৳)"}
                </label>
                <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  type="number" placeholder={form.type === "percent" ? "20" : "50"}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ backgroundColor: S.surface, borderColor: S.border, color: S.text }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: S.secondary }}>সর্বনিম্ন অর্ডার (৳)</label>
                  <input value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))}
                    type="number" placeholder="ঐচ্ছিক"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ backgroundColor: S.surface, borderColor: S.border, color: S.text }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: S.secondary }}>সর্বোচ্চ ছাড় (৳)</label>
                  <input value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))}
                    type="number" placeholder="ঐচ্ছিক"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ backgroundColor: S.surface, borderColor: S.border, color: S.text }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: S.secondary }}>সর্বোচ্চ ব্যবহার</label>
                  <input value={form.maxUse} onChange={e => setForm(f => ({ ...f, maxUse: e.target.value }))}
                    type="number" placeholder="ঐচ্ছিক"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ backgroundColor: S.surface, borderColor: S.border, color: S.text }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: S.secondary }}>মেয়াদ শেষ</label>
                  <input value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                    type="date"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ backgroundColor: S.surface, borderColor: S.border, color: S.text }} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50" style={{ backgroundColor: S.primary }}>
                  {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #EC4899 0%, #9333EA 100%)" }}>
            <Tag size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>কুপন</h1>
            <p className="text-xs" style={{ color: S.muted }}>{coupons.length}টি কুপন</p>
          </div>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 h-9 rounded-xl text-white text-sm font-semibold"
          style={{ backgroundColor: S.primary }}>
          <Plus size={15} /> নতুন কুপন
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <Tag size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm mb-3">কোনো কুপন নেই</p>
          <button onClick={openNew} className="px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: S.primary }}>
            প্রথম কুপন তৈরি করুন
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map(c => {
            const expired = isExpired(c);
            return (
              <div key={c.id} className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="px-3 py-1.5 rounded-lg flex-shrink-0" style={{ backgroundColor: "#EEF2FF" }}>
                      <span className="text-sm font-bold font-mono" style={{ color: "#4338CA" }}>{c.code}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: S.text }}>
                        {c.type === "percent" ? `${c.value}% ছাড়` : `৳${c.value} ছাড়`}
                        {c.maxDiscount ? ` (সর্বোচ্চ ৳${c.maxDiscount})` : ""}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        {c.minOrder && <span className="text-xs" style={{ color: S.muted }}>ন্যূনতম ৳{c.minOrder}</span>}
                        {c.maxUse && <span className="text-xs" style={{ color: S.muted }}>{c.usedCount}/{c.maxUse} ব্যবহৃত</span>}
                        {c.expiresAt && (
                          <span className="text-xs" style={{ color: expired ? "#E24B4A" : S.muted }}>
                            {expired ? "মেয়াদ শেষ" : `${new Date(c.expiresAt).toLocaleDateString("bn-BD")}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleActive(c)}
                      className="relative w-10 h-5 rounded-full transition-colors"
                      style={{ backgroundColor: c.isActive && !expired ? S.primary : S.border }}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${c.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                    <button onClick={() => openEdit(c)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--c-surface-raised)" }}>
                      <Pencil size={13} style={{ color: S.secondary }} />
                    </button>
                    <button onClick={() => setDeleteId(c.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FEF2F2" }}>
                      <Trash2 size={13} style={{ color: "#EF4444" }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
