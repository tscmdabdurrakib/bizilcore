"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, X, ShoppingCart, ChevronDown, Trash2, PackageCheck } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
}

interface POItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  total: number;
  notes: string | null;
  expectedDate: string | null;
  receivedAt: string | null;
  createdAt: string;
  supplier: Supplier | null;
  items: POItem[];
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
  draft: { label: "খসড়া", color: "#6B7280", bg: "#F3F4F6" },
  sent: { label: "পাঠানো হয়েছে", color: "#3B82F6", bg: "#EFF6FF" },
  received: { label: "পণ্য পাওয়া গেছে", color: "#10B981", bg: "#ECFDF5" },
  cancelled: { label: "বাতিল", color: "#EF4444", bg: "#FEF2F2" },
};

function CreatePOModal({
  onClose,
  onSave,
  initialProduct,
  initialSupplierId,
}: {
  onClose: () => void;
  onSave: () => void;
  initialProduct?: string;
  initialSupplierId?: string;
}) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState(initialSupplierId ?? "");
  const [items, setItems] = useState([{ name: initialProduct ?? "", quantity: 1, unitPrice: 0 }]);
  const [notes, setNotes] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/suppliers?limit=100")
      .then((r) => r.json())
      .then((d) => setSuppliers(d.suppliers ?? []));
  }, []);

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  function addItem() {
    setItems((p) => [...p, { name: "", quantity: 1, unitPrice: 0 }]);
  }

  function updateItem(idx: number, field: string, value: string | number) {
    setItems((p) => p.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  function removeItem(idx: number) {
    setItems((p) => p.filter((_, i) => i !== idx));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (items.some((i) => !i.name)) return;
    setLoading(true);
    await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierId: supplierId || null, items, notes, expectedDate: expectedDate || null }),
    });
    setLoading(false);
    onSave();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="rounded-2xl p-6 w-full max-w-lg my-4" style={{ backgroundColor: S.surface }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-base" style={{ color: S.text }}>
            নতুন ক্রয় অর্ডার
          </h3>
          <button onClick={onClose}>
            <X size={18} style={{ color: S.muted }} />
          </button>
        </div>
        {(initialProduct || initialSupplierId) && (
          <div className="mb-4 px-3 py-2 rounded-xl text-xs" style={{ backgroundColor: "var(--c-primary-light, #E1F5EE)", color: "var(--c-primary)" }}>
            প্রোডাক্ট ইন্টেলিজেন্স থেকে পূর্ব-পূরণ করা হয়েছে। পরিমাণ ও দাম সংশোধন করুন।
          </div>
        )}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>
              সরবরাহকারী
            </label>
            <div className="relative">
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                style={{ ...inp(focused === "sup"), appearance: "none", paddingRight: "32px" }}
                onFocus={() => setFocused("sup")}
                onBlur={() => setFocused(null)}
              >
                <option value="">-- সরবরাহকারী বেছে নিন --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: S.muted }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: S.muted }}>
                পণ্যসমূহ *
              </label>
              <button
                type="button"
                onClick={addItem}
                className="text-xs px-2 py-1 rounded-lg"
                style={{ color: S.primary, backgroundColor: "var(--c-primary-light, #E1F5EE)" }}
              >
                + পণ্য যোগ
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    placeholder="পণ্যের নাম"
                    value={item.name}
                    onChange={(e) => updateItem(idx, "name", e.target.value)}
                    required
                    style={{ ...inp(false), flex: 2 }}
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="পরিমাণ"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                    style={{ ...inp(false), flex: 1, minWidth: 0 }}
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="দাম"
                    value={item.unitPrice || ""}
                    onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                    style={{ ...inp(false), flex: 1, minWidth: 0 }}
                  />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)}>
                      <X size={16} style={{ color: S.muted }} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>
                প্রত্যাশিত তারিখ
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                style={inp(focused === "exp")}
                onFocus={() => setFocused("exp")}
                onBlur={() => setFocused(null)}
              />
            </div>
            <div className="flex items-end">
              <div className="rounded-xl p-3 w-full" style={{ backgroundColor: "var(--c-bg)", border: `1px solid ${S.border}` }}>
                <p className="text-xs" style={{ color: S.muted }}>মোট মূল্য</p>
                <p className="text-lg font-bold" style={{ color: S.text }}>৳{total.toLocaleString("bn-BD")}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>
              নোট
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ঐচ্ছিক"
              style={inp(focused === "notes")}
              onFocus={() => setFocused("notes")}
              onBlur={() => setFocused(null)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
              style={{ borderColor: S.border, color: S.text }}
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
              style={{ backgroundColor: S.primary }}
            >
              {loading ? "তৈরি হচ্ছে..." : "অর্ডার তৈরি"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PurchaseOrdersContent() {
  const searchParams = useSearchParams();
  const prefillProduct = searchParams.get("product") ?? undefined;
  const prefillSupplierId = searchParams.get("supplierId") ?? undefined;

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    if (prefillProduct || prefillSupplierId) {
      setShowModal(true);
    }
  }, [prefillProduct, prefillSupplierId]);

  async function load() {
    setLoading(true);
    const q = filterStatus ? `?status=${filterStatus}` : "";
    const res = await fetch(`/api/purchase-orders${q}`);
    const data = await res.json();
    setOrders(data.purchaseOrders ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [filterStatus]);

  async function changeStatus(id: string, status: string) {
    await fetch(`/api/purchase-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function deleteOrder(id: string) {
    if (!confirm("এই ক্রয় অর্ডারটি মুছে ফেলবেন?")) return;
    await fetch(`/api/purchase-orders/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, var(--c-primary) 0%, #0A5442 100%)" }}>
            <ShoppingCart size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>ক্রয় অর্ডার (PO)</h1>
            <p className="text-xs" style={{ color: S.muted }}>Supplier থেকে মাল কেনার formal অর্ডার তৈরি ও ট্র্যাক করুন</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}
        >
          <Plus size={16} /> নতুন PO
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "মোট অর্ডার", value: orders.length, color: "var(--c-primary)", bg: "var(--c-primary-light)" },
          { label: "খসড়া", value: orders.filter((o) => o.status === "draft").length, color: "#6B7280", bg: "#F3F4F6" },
          { label: "পাঠানো হয়েছে", value: orders.filter((o) => o.status === "sent").length, color: "#D97706", bg: "#FEF3C7" },
          { label: "পণ্য পেয়েছি", value: orders.filter((o) => o.status === "received").length, color: "#059669", bg: "#DCFCE7" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: stat.bg }}>
              <ShoppingCart size={15} style={{ color: stat.color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: S.muted }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 p-1 rounded-2xl w-fit overflow-x-auto" style={{ backgroundColor: S.bg, border: `1px solid ${S.border}` }}>
        {[{ value: "", label: "সব" }, ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
            style={{
              backgroundColor: filterStatus === tab.value ? S.primary : "transparent",
              color: filterStatus === tab.value ? "#fff" : S.muted,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${S.border}` }}>
        {loading ? (
          <div className="p-5 space-y-3 animate-pulse">
            {[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded-xl" style={{ backgroundColor: S.bg }} />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center" style={{ backgroundColor: S.surface }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "var(--c-primary-light)" }}>
              <ShoppingCart size={28} style={{ color: "var(--c-primary)" }} />
            </div>
            <p className="font-semibold text-sm" style={{ color: S.text }}>কোনো ক্রয় অর্ডার নেই</p>
            <p className="text-xs mt-1.5 mb-4" style={{ color: S.muted }}>Supplier-এর কাছে প্রথম PO পাঠান</p>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: "linear-gradient(135deg, var(--c-primary) 0%, #0A5442 100%)" }}>
              <Plus size={15} /> নতুন PO
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr style={{ backgroundColor: S.surface, borderBottom: `1px solid ${S.border}` }}>
                {["PO #", "সরবরাহকারী", "তারিখ", "প্রত্যাশিত তারিখ", "মোট", "অবস্থা", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: S.muted }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => {
                const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.draft;
                return (
                  <tr key={order.id} className="transition-colors" style={{ borderBottom: `1px solid ${S.border}` }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--c-primary-light)")} onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                    <td className="px-4 py-3 text-sm font-mono font-medium" style={{ color: S.primary }}>
                      {order.poNumber}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: S.text }}>
                      {order.supplier?.name ?? <span style={{ color: S.muted }}>—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: S.muted }}>
                      {new Date(order.createdAt).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: S.muted }}>
                      {order.expectedDate ? new Date(order.expectedDate).toLocaleDateString("bn-BD") : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: S.text }}>
                      ৳{order.total.toLocaleString("bn-BD")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 items-center">
                        {order.status === "draft" && (
                          <button
                            onClick={() => changeStatus(order.id, "sent")}
                            className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                            style={{ color: "var(--c-primary)", backgroundColor: "var(--c-primary-light)" }}
                          >
                            পাঠান
                          </button>
                        )}
                        {order.status === "sent" && (
                          <button
                            onClick={() => changeStatus(order.id, "received")}
                            className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold"
                            style={{ color: "var(--c-primary)", backgroundColor: "var(--c-primary-light)" }}
                          >
                            <PackageCheck size={12} /> পাওয়া গেছে
                          </button>
                        )}
                        <button onClick={() => deleteOrder(order.id)}>
                          <Trash2 size={14} style={{ color: S.muted }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showModal && (
        <CreatePOModal
          onClose={() => setShowModal(false)}
          onSave={load}
          initialProduct={prefillProduct}
          initialSupplierId={prefillSupplierId}
        />
      )}
    </div>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center" style={{ color: "var(--c-text-muted)" }}>লোড হচ্ছে...</div>}>
      <PurchaseOrdersContent />
    </Suspense>
  );
}
