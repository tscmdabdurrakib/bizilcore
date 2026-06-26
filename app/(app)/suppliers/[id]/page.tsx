"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Phone, MapPin, Mail, FileText, Package, Pencil, X, Check, ShoppingCart, Plus } from "lucide-react";
import { formatBDT, formatBanglaDate } from "@/lib/utils";
import { PageShell, Card, StatCard, Badge, Button, Input, EmptyState } from "@/components/ui";

interface PurchaseItem {
  id: string; name: string; quantity: number; unitPrice: number; subtotal: number;
}

interface Purchase {
  id: string; totalAmount: number; paidAmount: number; dueAmount: number;
  status: string; note: string | null; createdAt: string;
  items: PurchaseItem[];
}

interface PurchaseOrderSummary {
  id: string; poNumber: string; status: string; total: number;
  expectedDate: string | null; createdAt: string;
  items: { name: string; quantity: number }[];
}

interface Supplier {
  id: string; name: string; phone: string | null; address: string | null;
  email: string | null; note: string | null; dueAmount: number;
  purchases: Purchase[];
  purchaseOrders: PurchaseOrderSummary[];
}

const inp = (focused: boolean) => ({
  width: "100%", height: "40px", border: `1px solid ${focused ? "var(--c-primary)" : "var(--c-border)"}`,
  borderRadius: "8px", backgroundColor: "var(--c-surface)", color: "var(--c-text)",
  padding: "0 12px", fontSize: "14px", outline: "none",
});

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)",
};

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
  const [expandedPO, setExpandedPO] = useState<string | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    fetch(`/api/suppliers/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setSupplier({ ...d, purchaseOrders: d.purchaseOrders ?? [] });
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
      <PageShell title="Supplier" className="max-w-2xl">
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => <Card key={i} className="h-24" padding="md"><div /></Card>)}
        </div>
      </PageShell>
    );
  }

  if (!supplier) {
    return (
      <PageShell title="Supplier" className="max-w-2xl">
        <EmptyState title="Supplier পাওয়া যায়নি।" action={{ label: "← Supplier তালিকায় ফিরুন", onClick: () => {}, href: "/suppliers" }} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={supplier.name}
      subtitle={`${supplier.purchases.length}টি ক্রয় · মোট ${formatBDT(totalPurchased)}`}
      breadcrumbs={[{ label: "Supplier", href: "/suppliers" }, { label: supplier.name }]}
      actions={
        <Button variant="outline" size="sm" icon={Pencil} onClick={() => setEditing(!editing)}>
          {editing ? "বাতিল" : "সম্পাদনা"}
        </Button>
      }
      stats={
        <>
          <StatCard label="মোট ক্রয়" value={formatBDT(totalPurchased)} accent="none" />
          <StatCard label="পরিশোধ" value={formatBDT(totalPaid)} accent="green" />
          <StatCard label="বাকি" value={formatBDT(supplier.dueAmount)} accent={supplier.dueAmount > 0 ? "red" : "none"} />
        </>
      }
      className="max-w-2xl"
    >

        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg"
            style={{ backgroundColor: toast.type === "success" ? "var(--c-primary)" : "#E24B4A", color: "#fff" }}>
            {toast.msg}
          </div>
        )}

        {editing && (
          <Card className="mb-4">
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
            <Button onClick={saveEdit} disabled={saving} loading={saving} className="mt-4 w-full" icon={Check}>
              {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
            </Button>
          </Card>
        )}

        <Card className="mb-4">
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
        </Card>

        {/* Purchase Orders */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: S.text }}>
              ক্রয় অর্ডার ({supplier.purchaseOrders?.length ?? 0})
            </h2>
            <Link
              href={`/purchase-orders?supplierId=${supplier.id}`}
              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: "var(--c-primary-light)", color: "var(--c-primary)" }}
            >
              <Plus size={12} /> নতুন PO
            </Link>
          </div>
          {(supplier.purchaseOrders?.length ?? 0) === 0 ? (
            <EmptyState icon={ShoppingCart} title="কোনো PO নেই" className="py-8" />
          ) : (
            <div className="space-y-2">
              {(supplier.purchaseOrders ?? []).map((po) => (
                <Card key={po.id} padding="none" className="overflow-hidden">
                  <button
                    onClick={() => setExpandedPO(expandedPO === po.id ? null : po.id)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-mono font-bold" style={{ color: "var(--c-primary)" }}>
                          {po.poNumber}
                        </span>
                        <Badge variant="default">{po.status}</Badge>
                      </div>
                      <p className="text-xs" style={{ color: S.muted }}>
                        {formatBanglaDate(po.createdAt)} · {po.items.length}টি আইটেম
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm" style={{ color: S.text }}>{formatBDT(po.total)}</p>
                      <Link
                        href={`/purchase-orders/${po.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs hover:underline"
                        style={{ color: "var(--c-primary)" }}
                      >
                        বিস্তারিত →
                      </Link>
                    </div>
                  </button>
                  {expandedPO === po.id && (
                    <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: S.border }}>
                      {po.items.map((item, i) => (
                        <p key={i} className="text-xs py-0.5" style={{ color: S.secondary }}>
                          {item.name} × {item.quantity}
                        </p>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Purchase history */}
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: S.text }}>ক্রয়ের ইতিহাস ({supplier.purchases.length})</h2>
          {supplier.purchases.length === 0 ? (
            <EmptyState icon={Package} title="কোনো ক্রয় নেই" className="py-10" />
          ) : (
            <div className="space-y-2">
              {supplier.purchases.map((p) => (
                <Card key={p.id} padding="none" className="overflow-hidden">
                  <button
                    onClick={() => setExpandedPurchase(expandedPurchase === p.id ? null : p.id)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold" style={{ color: S.text }}>
                          {formatBanglaDate(p.createdAt)}
                        </span>
                        <Badge variant={p.status === "paid" ? "success" : "warning"}>
                          {p.status === "paid" ? "পরিশোধ" : "বাকি আছে"}
                        </Badge>
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
                </Card>
              ))}
            </div>
          )}
        </div>
    </PageShell>
  );
}
