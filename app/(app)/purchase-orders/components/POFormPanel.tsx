"use client";

import { useEffect, useState } from "react";
import { Plus, X, ShoppingCart, Loader2, Save } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import DatePicker from "@/components/ui/DatePicker";
import type { PurchaseOrder, POFormItem } from "@/lib/purchase-orders/types";

interface Supplier { id: string; name: string }
interface Product { id: string; name: string; sku: string | null; buyPrice?: number }

const fieldCls =
  "w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 bg-white outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400";
const selectCls =
  "w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 bg-white outline-none focus:border-gray-400 transition-colors appearance-none";

export default function POFormPanel({
  onClose,
  onSave,
  isDesktop,
  initialProduct,
  initialSupplierId,
  editOrder,
}: {
  onClose: () => void;
  onSave: () => void;
  isDesktop: boolean;
  initialProduct?: string;
  initialSupplierId?: string;
  editOrder?: PurchaseOrder | null;
}) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierId, setSupplierId] = useState(editOrder?.supplier?.id ?? initialSupplierId ?? "");
  const [items, setItems] = useState<POFormItem[]>(
    editOrder?.items.map((i) => ({
      name: i.name,
      productId: i.productId ?? undefined,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })) ?? [{ name: initialProduct ?? "", quantity: 1, unitPrice: 0 }]
  );
  const [notes, setNotes] = useState(editOrder?.notes ?? "");
  const [expectedDate, setExpectedDate] = useState(
    editOrder?.expectedDate ? editOrder.expectedDate.slice(0, 10) : ""
  );
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
    Promise.all([
      fetch("/api/suppliers?limit=100").then((r) => r.json()),
      fetch("/api/products?limit=200").then((r) => r.json()),
    ]).then(([supData, prodData]) => {
      setSuppliers(supData.suppliers ?? []);
      setProducts(prodData.products ?? []);
    });
  }, []);

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const isEdit = !!editOrder;

  function close() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  function addItem() {
    setItems((p) => [...p, { name: "", quantity: 1, unitPrice: 0 }]);
  }

  function updateItem(idx: number, field: keyof POFormItem, val: string | number) {
    setItems((p) => p.map((it, i) => (i === idx ? { ...it, [field]: val } : it)));
  }

  function selectProduct(idx: number, productId: string) {
    const p = products.find((x) => x.id === productId);
    if (p) {
      updateItem(idx, "name", p.name);
      if (p.buyPrice) updateItem(idx, "unitPrice", p.buyPrice);
    }
    updateItem(idx, "productId", productId);
  }

  function removeItem(idx: number) {
    setItems((p) => p.filter((_, i) => i !== idx));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (items.some((i) => !i.name.trim())) return;
    setLoading(true);

    const payload = {
      supplierId: supplierId || null,
      items,
      notes,
      expectedDate: expectedDate || null,
    };

    const res = editOrder
      ? await fetch(`/api/purchase-orders/${editOrder.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/purchase-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    setLoading(false);
    if (res.ok) {
      onSave();
      close();
    }
  }

  return (
    <>
      <div
        onClick={close}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />
      <div
        className="fixed z-50 bg-white flex flex-col"
        style={
          isDesktop
            ? {
                top: 0,
                right: 0,
                bottom: 0,
                width: 520,
                borderLeft: "1px solid #F3F4F6",
                boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
                transform: visible ? "translateX(0)" : "translateX(100%)",
                transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
              }
            : {
                left: 0,
                right: 0,
                bottom: 0,
                height: "92svh",
                borderRadius: "24px 24px 0 0",
                boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
                transform: visible ? "translateY(0)" : "translateY(100%)",
                transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
              }
        }
      >
        {!isDesktop && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full" />
        )}

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#0F6E56,#065E48)" }}
            >
              <ShoppingCart size={18} color="#fff" />
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {isEdit ? "PO সম্পাদনা" : "নতুন ক্রয় অর্ডার"}
              </p>
              <p className="text-xs text-gray-400">
                {isEdit ? editOrder?.poNumber : "New Purchase Order"}
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {(initialProduct || initialSupplierId) && !isEdit && (
              <div className="px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-800 font-medium">
                প্রোডাক্ট ইন্টেলিজেন্স থেকে পূর্ব-পূরণ করা হয়েছে।
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                সরবরাহকারী (ঐচ্ছিক)
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className={selectCls}
              >
                <option value="">— সরবরাহকারী বেছে নিন —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-700">পণ্যসমূহ *</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                >
                  <Plus size={12} /> পণ্য যোগ
                </button>
              </div>
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-gray-100 bg-gray-50 p-3 space-y-2"
                  >
                    <select
                      value={item.productId ?? ""}
                      onChange={(e) => selectProduct(idx, e.target.value)}
                      className="w-full h-9 border border-gray-200 rounded-xl px-3 text-xs text-gray-700 bg-white outline-none appearance-none"
                    >
                      <option value="">পণ্য বেছে নিন</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.sku ? ` (${p.sku})` : ""}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <input
                        placeholder="পণ্যের নাম *"
                        value={item.name}
                        onChange={(e) => updateItem(idx, "name", e.target.value)}
                        required
                        className="flex-1 h-10 border border-gray-200 rounded-xl px-3 text-sm bg-white outline-none"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="w-10 h-10 rounded-xl hover:bg-red-50 flex items-center justify-center"
                        >
                          <X size={14} className="text-red-400" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                          পরিমাণ
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(idx, "quantity", parseInt(e.target.value) || 1)
                          }
                          className="w-full h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                          একক মূল্য (৳)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice || ""}
                          onChange={(e) =>
                            updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)
                          }
                          className="w-full h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                          সাবটোটাল
                        </label>
                        <div className="h-9 flex items-center px-3 rounded-xl bg-white border border-gray-100 text-sm font-bold text-gray-700">
                          ৳{(item.quantity * item.unitPrice).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  প্রত্যাশিত তারিখ
                </label>
                <DatePicker value={expectedDate} onChange={setExpectedDate} className={fieldCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">নোট</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ঐচ্ছিক..."
                  className={fieldCls}
                />
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 flex items-center justify-between">
              <span className="text-sm font-bold text-emerald-800">মোট মূল্য</span>
              <span className="text-2xl font-black text-emerald-800">{formatBDT(total)}</span>
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4 flex gap-3 bg-white">
            <button
              type="button"
              onClick={close}
              className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#0F6E56,#065E48)" }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> সংরক্ষণ...
                </>
              ) : (
                <>
                  <Save size={15} /> {isEdit ? "আপডেট" : "অর্ডার তৈরি"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
