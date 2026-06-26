"use client";

import { useEffect, useState } from "react";
import { Tag, Plus, Loader2, Pencil, Trash2, X } from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";
import { PageShell, Card, Badge, Button, EmptyState, Input } from "@/components/ui";

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
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--c-text-muted)" }} />
      </div>
    );
  }

  return (
    <PageShell
      title="কুপন"
      subtitle={`${coupons.length}টি কুপন`}
      className="max-w-3xl"
      actions={
        <Button icon={Plus} onClick={openNew}>নতুন কুপন</Button>
      }
    >
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-sm w-full">
            <h3 className="font-semibold text-base mb-2" style={{ color: "var(--c-text)" }}>কুপন মুছে দিন?</h3>
            <p className="text-sm mb-5" style={{ color: "var(--c-text-sub)" }}>এই কাজ undo করা যাবে না।</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>বাতিল</Button>
              <Button variant="danger" className="flex-1" onClick={handleDelete} disabled={deleting} loading={deleting}>
                {deleting ? "মুছছে..." : "মুছে দিন"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card padding="none" className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 card-premium" style={{ borderColor: "var(--c-border)" }}>
              <p className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>{editId ? "কুপন সম্পাদনা" : "নতুন কুপন"}</p>
              <button onClick={() => setShowForm(false)}><X size={18} style={{ color: "var(--c-text-muted)" }} /></button>
            </div>
            <div className="p-5 space-y-4">
              <Input
                label="কুপন কোড *"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="SAVE20"
                className="font-mono"
              />
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--c-text-sub)" }}>ধরন *</label>
                <div className="flex gap-2">
                  {(["percent", "fixed"] as const).map(t => (
                    <Button
                      key={t}
                      variant={form.type === t ? "primary" : "outline"}
                      className="flex-1"
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                    >
                      {t === "percent" ? "% শতাংশ" : "৳ নির্দিষ্ট"}
                    </Button>
                  ))}
                </div>
              </div>
              <Input
                label={`মান * ${form.type === "percent" ? "(%)" : "(৳)"}`}
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                type="number"
                placeholder={form.type === "percent" ? "20" : "50"}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input label="সর্বনিম্ন অর্ডার (৳)" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))} type="number" placeholder="ঐচ্ছিক" />
                <Input label="সর্বোচ্চ ছাড় (৳)" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} type="number" placeholder="ঐচ্ছিক" />
                <Input label="সর্বোচ্চ ব্যবহার" value={form.maxUse} onChange={e => setForm(f => ({ ...f, maxUse: e.target.value }))} type="number" placeholder="ঐচ্ছিক" />
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--c-text-sub)" }}>মেয়াদ শেষ</label>
                  <DatePicker
                    value={form.expiresAt}
                    onChange={v => setForm(f => ({ ...f, expiresAt: v }))}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-border)", color: "var(--c-text)" }}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>বাতিল</Button>
                <Button className="flex-1" onClick={handleSave} disabled={saving} loading={saving}>
                  {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {coupons.length === 0 ? (
        <EmptyState icon={Tag} title="কোনো কুপন নেই" action={{ label: "প্রথম কুপন তৈরি করুন", onClick: openNew }} />
      ) : (
        <div className="space-y-3">
          {coupons.map(c => {
            const expired = isExpired(c);
            return (
              <Card key={c.id} padding="md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge variant="info" className="px-3 py-1.5 font-mono font-bold text-sm">{c.code}</Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--c-text)" }}>
                        {c.type === "percent" ? `${c.value}% ছাড়` : `৳${c.value} ছাড়`}
                        {c.maxDiscount ? ` (সর্বোচ্চ ৳${c.maxDiscount})` : ""}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        {c.minOrder && <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>ন্যূনতম ৳{c.minOrder}</span>}
                        {c.maxUse && <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>{c.usedCount}/{c.maxUse} ব্যবহৃত</span>}
                        {c.expiresAt && (
                          expired
                            ? <Badge variant="danger">মেয়াদ শেষ</Badge>
                            : <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>{new Date(c.expiresAt).toLocaleDateString("bn-BD")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleActive(c)}
                      className="relative w-10 h-5 rounded-full transition-colors"
                      style={{ backgroundColor: c.isActive && !expired ? "var(--c-primary)" : "var(--c-border)" }}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${c.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                    <button onClick={() => openEdit(c)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--c-surface-raised)" }}>
                      <Pencil size={13} style={{ color: "var(--c-text-sub)" }} />
                    </button>
                    <button onClick={() => setDeleteId(c.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FEF2F2" }}>
                      <Trash2 size={13} style={{ color: "#EF4444" }} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
