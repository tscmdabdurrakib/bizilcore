"use client";

import { useEffect, useState } from "react";
import { Plus, X, FileText, Loader2, Save, UserPlus, Search } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import DatePicker from "@/components/ui/DatePicker";
import { calcInvoiceTotals } from "@/lib/invoices/utils";
import type { Invoice, InvoiceFormItem } from "@/lib/invoices/types";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
}

interface Product {
  id: string;
  name: string;
  sellPrice: number;
}

const fieldCls =
  "w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 bg-white outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400";
const selectCls =
  "w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 bg-white outline-none focus:border-gray-400 transition-colors appearance-none";

export default function InvoiceFormPanel({
  mode,
  invoice,
  onClose,
  onSave,
  isDesktop,
}: {
  mode: "create" | "edit";
  invoice?: Invoice;
  onClose: () => void;
  onSave: () => void;
  isDesktop: boolean;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState(invoice?.customer?.id ?? "");
  const [items, setItems] = useState<InvoiceFormItem[]>(
    invoice?.items?.length
      ? invoice.items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          productId: i.productId ?? null,
        }))
      : [{ description: "", quantity: 1, unitPrice: 0 }]
  );
  const [discount, setDiscount] = useState(invoice?.discount ?? 0);
  const [taxRate, setTaxRate] = useState(invoice?.taxRate ?? 0);
  const [notes, setNotes] = useState(invoice?.notes ?? "");
  const [dueDate, setDueDate] = useState(invoice?.dueDate?.slice(0, 10) ?? "");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [recentItems, setRecentItems] = useState<{ description: string; unitPrice: number; quantity: number }[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [activeProductIdx, setActiveProductIdx] = useState<number | null>(null);

  const canFullEdit = mode === "create" || invoice?.status === "draft";

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
    fetch("/api/customers?limit=200")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers ?? []));
  }, []);

  useEffect(() => {
    if (!customerId) {
      setRecentItems([]);
      return;
    }
    setLoadingRecent(true);
    fetch(`/api/customers/${customerId}/recent-invoice-items`)
      .then((r) => r.json())
      .then((d) => setRecentItems(d.items ?? []))
      .catch(() => setRecentItems([]))
      .finally(() => setLoadingRecent(false));
  }, [customerId]);

  useEffect(() => {
    if (!productSearch.trim() || activeProductIdx === null) {
      setProducts([]);
      return;
    }
    const t = setTimeout(() => {
      setLoadingProducts(true);
      fetch(`/api/products?search=${encodeURIComponent(productSearch)}&limit=8`)
        .then((r) => r.json())
        .then((d) => setProducts(Array.isArray(d) ? d : []))
        .catch(() => setProducts([]))
        .finally(() => setLoadingProducts(false));
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch, activeProductIdx]);

  const { subtotal, taxAmount, total } = calcInvoiceTotals(items, discount, taxRate);

  function close() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  function addItem() {
    setItems((p) => [...p, { description: "", quantity: 1, unitPrice: 0 }]);
  }

  function updateItem(idx: number, field: string, val: string | number | null) {
    setItems((p) => p.map((it, i) => (i === idx ? { ...it, [field]: val } : it)));
  }

  function removeItem(idx: number) {
    setItems((p) => p.filter((_, i) => i !== idx));
  }

  function addRecentItem(ri: { description: string; unitPrice: number; quantity: number }) {
    const exists = items.some((i) => i.description.toLowerCase() === ri.description.toLowerCase());
    if (exists) return;
    const blank = items.findIndex((i) => !i.description);
    if (blank !== -1) {
      updateItem(blank, "description", ri.description);
      updateItem(blank, "unitPrice", ri.unitPrice);
    } else {
      setItems((p) => [...p, { description: ri.description, quantity: ri.quantity, unitPrice: ri.unitPrice }]);
    }
  }

  function selectProduct(idx: number, product: Product) {
    updateItem(idx, "description", product.name);
    updateItem(idx, "unitPrice", product.sellPrice);
    updateItem(idx, "productId", product.id);
    setProductSearch("");
    setActiveProductIdx(null);
    setProducts([]);
  }

  async function createCustomer() {
    if (!newCustomer.name.trim()) return;
    setCreatingCustomer(true);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCustomer),
    });
    if (res.ok) {
      const c = await res.json();
      setCustomers((p) => [c, ...p]);
      setCustomerId(c.id);
      setShowNewCustomer(false);
      setNewCustomer({ name: "", phone: "" });
    }
    setCreatingCustomer(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (items.some((i) => !i.description)) return;
    setLoading(true);

    const payload = {
      customerId: customerId || null,
      items,
      discount,
      taxRate,
      notes,
      dueDate: dueDate || null,
    };

    if (mode === "create") {
      await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else if (invoice) {
      await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setLoading(false);
    onSave();
    close();
  }

  async function handleLimitedSave(e: React.FormEvent) {
    e.preventDefault();
    if (!invoice) return;
    setLoading(true);
    await fetch(`/api/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes, dueDate: dueDate || null }),
    });
    setLoading(false);
    onSave();
    close();
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
                width: 540,
                borderLeft: "1px solid #F3F4F6",
                boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
                transform: visible ? "translateX(0)" : "translateX(100%)",
                transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
              }
            : {
                left: 0,
                right: 0,
                bottom: 0,
                height: "94svh",
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
              <FileText size={18} color="#fff" />
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {mode === "create" ? "নতুন ইনভয়েস" : "ইনভয়েস সম্পাদনা"}
              </p>
              <p className="text-xs text-gray-400">
                {invoice?.invoiceNumber ?? "Create invoice entry"}
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={canFullEdit ? handleSave : handleLimitedSave}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">কাস্টমার (ঐচ্ছিক)</label>
                {canFullEdit && (
                  <button
                    type="button"
                    onClick={() => setShowNewCustomer(!showNewCustomer)}
                    className="text-xs font-bold text-emerald-700 flex items-center gap-1"
                  >
                    <UserPlus size={12} /> নতুন
                  </button>
                )}
              </div>
              {showNewCustomer ? (
                <div className="space-y-2 p-3 rounded-xl border border-emerald-100 bg-emerald-50/50">
                  <input
                    placeholder="নাম *"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))}
                    className={fieldCls}
                  />
                  <input
                    placeholder="ফোন"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))}
                    className={fieldCls}
                  />
                  <button
                    type="button"
                    onClick={createCustomer}
                    disabled={creatingCustomer}
                    className="w-full py-2 rounded-xl text-sm font-bold text-white"
                    style={{ background: "#0F6E56" }}
                  >
                    {creatingCustomer ? "তৈরি হচ্ছে..." : "কাস্টমার যোগ করুন"}
                  </button>
                </div>
              ) : (
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  disabled={!canFullEdit}
                  className={selectCls}
                >
                  <option value="">— কাস্টমার বেছে নিন —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {canFullEdit && customerId && (
              <div>
                {loadingRecent ? (
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <Loader2 size={11} className="animate-spin" /> সাম্প্রতিক পণ্য লোড হচ্ছে...
                  </p>
                ) : (
                  recentItems.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-2">সাম্প্রতিক পণ্য</p>
                      <div className="flex flex-wrap gap-2">
                        {recentItems.map((ri, idx) => {
                          const added = items.some(
                            (i) => i.description.toLowerCase() === ri.description.toLowerCase() && i.description
                          );
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => addRecentItem(ri)}
                              disabled={added}
                              className="text-xs px-3 py-1.5 rounded-xl border font-bold transition-all"
                              style={{
                                color: added ? "#9CA3AF" : "#0F6E56",
                                backgroundColor: added ? "#F9FAFB" : "#ECFDF5",
                                borderColor: added ? "#E5E7EB" : "#A7F3D0",
                              }}
                            >
                              {added ? "✓ " : "+ "}
                              {ri.description} (৳{ri.unitPrice.toLocaleString()})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {canFullEdit ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-gray-700">আইটেম সমূহ *</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                  >
                    <Plus size={12} /> আইটেম যোগ
                  </button>
                </div>
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="rounded-2xl border border-gray-100 bg-gray-50 p-3 space-y-2">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            placeholder="পণ্য/সেবার বিবরণ *"
                            value={item.description}
                            onChange={(e) => {
                              updateItem(idx, "description", e.target.value);
                              setActiveProductIdx(idx);
                              setProductSearch(e.target.value);
                            }}
                            onFocus={() => setActiveProductIdx(idx)}
                            required
                            className="w-full h-10 border border-gray-200 rounded-xl px-3 text-sm bg-white outline-none focus:border-gray-400"
                          />
                          {activeProductIdx === idx && productSearch.trim() && (
                            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                              {loadingProducts ? (
                                <p className="px-3 py-2 text-xs text-gray-400">খুঁজছি...</p>
                              ) : products.length === 0 ? (
                                <p className="px-3 py-2 text-xs text-gray-400 flex items-center gap-1">
                                  <Search size={11} /> পণ্য পাওয়া যায়নি
                                </p>
                              ) : (
                                products.map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => selectProduct(idx, p)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 border-b border-gray-50 last:border-0"
                                  >
                                    {p.name}{" "}
                                    <span className="text-emerald-700 font-bold">৳{p.sellPrice}</span>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
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
                          <label className="block text-[10px] font-semibold text-gray-500 mb-1">পরিমাণ</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                            className="w-full h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 mb-1">একক মূল্য</label>
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice || ""}
                            onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                            className="w-full h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 mb-1">সাবটোটাল</label>
                          <div className="h-9 flex items-center px-3 rounded-xl bg-white border text-sm font-bold">
                            ৳{(item.quantity * item.unitPrice).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                পাঠানো ইনভয়েসে শুধু নোট ও ডেডলাইন সম্পাদনা করা যাবে।
              </p>
            )}

            {canFullEdit && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">ছাড় (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={discount || ""}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">VAT/Tax (%)</label>
                  <input
                    type="number"
                    min="0"
                    value={taxRate || ""}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">ডেডলাইন</label>
                  <DatePicker value={dueDate} onChange={(v) => setDueDate(v)} className={fieldCls} />
                </div>
              </div>
            )}

            {!canFullEdit && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">পেমেন্ট ডেডলাইন</label>
                <DatePicker value={dueDate} onChange={(v) => setDueDate(v)} className={fieldCls} />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">নোট</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ঐচ্ছিক মন্তব্য..."
                className={fieldCls}
              />
            </div>

            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 space-y-2">
              <div className="flex justify-between text-sm text-emerald-700">
                <span>সাবটোটাল</span>
                <span className="font-semibold">{formatBDT(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-700">
                  <span>ছাড়</span>
                  <span>− {formatBDT(discount)}</span>
                </div>
              )}
              {taxRate > 0 && (
                <div className="flex justify-between text-sm text-emerald-700">
                  <span>VAT ({taxRate}%)</span>
                  <span>+ {formatBDT(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-emerald-800 pt-2 border-t border-emerald-200">
                <span>মোট</span>
                <span>{formatBDT(total)}</span>
              </div>
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
                  <Save size={15} /> {mode === "create" ? "ইনভয়েস তৈরি" : "আপডেট"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
