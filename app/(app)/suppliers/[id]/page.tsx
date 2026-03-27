"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Phone, MapPin, Mail, FileText, Package, Pencil, X, Check } from "lucide-react";
import { formatBDT, formatBanglaDate } from "@/lib/utils";
import { S } from "@/lib/theme";

interface PurchaseItem {
  id: string; name: string; quantity: number; unitPrice: number; subtotal: number;
}

interface Purchase {
  id: string; totalAmount: number; paidAmount: number; dueAmount: number;
  status: string; note: string | null; createdAt: string;
  items: PurchaseItem[];
}

interface Supplier {
  id: string; name: string; phone: string | null; address: string | null;
  email: string | null; note: string | null; dueAmount: number;
  purchases: Purchase[];
}

const inp = (focused: boolean) => ({
  width: "100%", height: "40px", border: `1px solid ${focused ? "var(--c-primary)" : "var(--c-border)"}`,
  borderRadius: "8px", backgroundColor: "var(--c-surface)", color: "var(--c-text)",
  padding: "0 12px", fontSize: "14px", outline: "none",
});

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", email: "", note: "" });
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [expandedPurchase, setExpandedPurchase] = useState<string | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    fetch(`/api/suppliers/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setSupplier(d);
        setForm({ name: d.name, phone: d.phone ?? "", address: d.address ?? "", email: d.email ?? "", note: d.note ?? "" });
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function saveEdit() {
    if (!form.name.trim()) return;
    setSaving(true);
    const r = await fetch(`/api/suppliers/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    if (r.ok) {
      const updated = await r.json();
      setSupplier((s) => s ? { ...s, ...updated } : s);
      setEditing(false);
      showToast("success", "তথ্য আপডেট হয়েছে ✓");
    } else {
      showToast("error", "সেভ করা যায়নি");
    }
    setSaving(false);
  }

  const totalPurchased = supplier?.purchases.reduce((s, p) => s + p.totalAmount, 0) ?? 0;
  const totalPaid = supplier?.purchases.reduce((s, p) => s + p.paidAmount, 0) ?? 0;

  if (loading) {
    return (
      <div style={{ backgroundColor: S.bg, minHeight: "100vh", padding: "16px" }}>
        <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl" style={{ backgroundColor: S.surface }} />)}
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div style={{ backgroundColor: S.bg, minHeight: "100vh", padding: "16px" }}>
        <div className="flex flex-col items-center justify-center py-20" style={{ color: S.muted }}>
          <p>Supplier পাওয়া যায়নি।</p>
          <Link href="/suppliers" className="mt-4 text-sm hover:underline" style={{ color: S.primary }}>← Supplier তালিকায় ফিরুন</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: S.bg, minHeight: "100vh", padding: "16px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>

        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg"
            style={{ backgroundColor: toast.type === "success" ? "var(--c-primary)" : "#E24B4A", color: "#fff" }}>
            {toast.msg}
          </div>
        )}

        {/* Back + Header */}
        <div className="flex items-center gap-3 mb-5">
          <Link href="/suppliers" className="p-2 rounded-xl" style={{ border: `1px solid ${S.border}`, backgroundColor: S.surface, color: S.secondary }}>
            <ChevronLeft size={18} />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold" style={{ color: S.text }}>{supplier.name}</h1>
            <p className="text-xs" style={{ color: S.muted }}>{supplier.purchases.length}টি ক্রয় · মোট {formatBDT(totalPurchased)}</p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
            style={{ border: `1px solid ${S.border}`, backgroundColor: S.surface, color: S.secondary }}
          >
            <Pencil size={14} />
            {editing ? "বাতিল" : "সম্পাদনা"}
          </button>
        </div>

        {/* Edit form */}
        {editing && (
          <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: S.text }}>তথ্য সম্পাদনা</h3>
            <div className="space-y-3">
              {[
                { key: "name", label: "নাম *", type: "text", ph: "Supplier-এর নাম" },
                { key: "phone", label: "ফোন", type: "tel", ph: "01XXXXXXXXX" },
                { key: "address", label: "ঠিকানা", type: "text", ph: "ঠিকানা লিখুন" },
                { key: "email", label: "Email", type: "email", ph: "email@example.com" },
                { key: "note", label: "নোট", type: "text", ph: "ঐচ্ছিক নোট" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.secondary }}>{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.ph}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    onFocus={() => setFocused(f.key)}
                    onBlur={() => setFocused(null)}
                    style={inp(focused === f.key)}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={saveEdit}
              disabled={saving}
              className="mt-4 w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: "var(--c-primary)", color: "#fff", opacity: saving ? 0.7 : 1 }}
            >
              <Check size={15} />
              {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
            </button>
          </div>
        )}

        {/* Info card */}
        <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-wrap gap-4">
              {supplier.phone && (
                <a href={`tel:${supplier.phone}`} className="flex items-center gap-2 text-sm" style={{ color: S.text }}>
                  <Phone size={14} style={{ color: S.muted }} /> {supplier.phone}
                </a>
              )}
              {supplier.email && (
                <a href={`mailto:${supplier.email}`} className="flex items-center gap-2 text-sm" style={{ color: S.text }}>
                  <Mail size={14} style={{ color: S.muted }} /> {supplier.email}
                </a>
              )}
              {supplier.address && (
                <span className="flex items-center gap-2 text-sm" style={{ color: S.text }}>
                  <MapPin size={14} style={{ color: S.muted }} /> {supplier.address}
                </span>
              )}
              {supplier.note && (
                <span className="flex items-center gap-2 text-sm" style={{ color: S.secondary }}>
                  <FileText size={14} style={{ color: S.muted }} /> {supplier.note}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "মোট ক্রয়", value: formatBDT(totalPurchased), color: S.text },
            { label: "পরিশোধ", value: formatBDT(totalPaid), color: "var(--c-primary)" },
            { label: "বাকি", value: formatBDT(supplier.dueAmount), color: supplier.dueAmount > 0 ? "#E24B4A" : S.muted },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
              <p className="text-xs mb-1" style={{ color: S.muted }}>{s.label}</p>
              <p className="text-base font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Purchase history */}
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: S.text }}>ক্রয়ের ইতিহাস ({supplier.purchases.length})</h2>
          {supplier.purchases.length === 0 ? (
            <div className="text-center py-10 rounded-2xl" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}`, color: S.muted }}>
              <Package size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">কোনো ক্রয় নেই</p>
            </div>
          ) : (
            <div className="space-y-2">
              {supplier.purchases.map((p) => (
                <div key={p.id} className="rounded-2xl overflow-hidden" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
                  <button
                    onClick={() => setExpandedPurchase(expandedPurchase === p.id ? null : p.id)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold" style={{ color: S.text }}>
                          {formatBanglaDate(p.createdAt)}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={p.status === "paid"
                            ? { backgroundColor: "var(--c-primary-light)", color: "var(--c-primary)" }
                            : { backgroundColor: "#FFF3DC", color: "#EF9F27" }}
                        >
                          {p.status === "paid" ? "পরিশোধ" : "বাকি আছে"}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: S.muted }}>{p.items.length}টি আইটেম</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm" style={{ color: S.text }}>{formatBDT(p.totalAmount)}</p>
                      {p.dueAmount > 0 && (
                        <p className="text-xs" style={{ color: "#E24B4A" }}>বাকি {formatBDT(p.dueAmount)}</p>
                      )}
                    </div>
                  </button>

                  {expandedPurchase === p.id && (
                    <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: S.border }}>
                      {p.note && (
                        <p className="text-xs mb-3" style={{ color: S.muted }}>নোট: {p.note}</p>
                      )}
                      <table className="w-full text-xs">
                        <thead>
                          <tr style={{ color: S.muted }}>
                            <th className="text-left pb-2">পণ্য</th>
                            <th className="text-center pb-2">পরিমাণ</th>
                            <th className="text-right pb-2">মূল্য</th>
                            <th className="text-right pb-2">মোট</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.items.map((item) => (
                            <tr key={item.id}>
                              <td className="py-1" style={{ color: S.text }}>{item.name}</td>
                              <td className="text-center py-1" style={{ color: S.secondary }}>{item.quantity}</td>
                              <td className="text-right py-1" style={{ color: S.secondary }}>{formatBDT(item.unitPrice)}</td>
                              <td className="text-right py-1 font-medium" style={{ color: S.text }}>{formatBDT(item.subtotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
