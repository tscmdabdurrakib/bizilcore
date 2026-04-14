"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Store, Plus, ArrowRight, Crown, X, Loader2, Trash2, Phone, MapPin,
  ArrowLeftRight, CheckCircle2, TrendingUp, GitBranch, Package,
  Edit3, Save, History, AlertTriangle, ChevronDown, RefreshCw,
  Boxes, Info,
} from "lucide-react";
import Link from "next/link";

/* ─── Types ─────────────────────────────────────────────── */
interface Branch {
  id: string;
  name: string;
  category: string | null;
  phone: string | null;
  address: string | null;
}
interface MainShop {
  id: string;
  name: string;
  category: string | null;
  phone: string | null;
  address: string | null;
  logoUrl?: string | null;
}
interface ShopData {
  mainShop: MainShop;
  branches: Branch[];
  maxShops: number;
  totalShops: number;
}
interface Product {
  id: string;
  name: string;
  stockQty: number;
}
interface TransferRecord {
  id: string;
  productId: string;
  quantity: number;
  reason: string;
  createdAt: string;
  product?: { name: string };
}

/* ─── Helpers ─────────────────────────────────────────────── */
const CATEGORIES = ["পোশাক", "জুয়েলারি", "খাবার", "সৌন্দর্য", "গৃহস্থালি", "ইলেকট্রনিক্স", "অন্যান্য"];

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const color = pct >= 100 ? "#EF4444" : pct >= 66 ? "#F59E0B" : "#10B981";
  return (
    <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

/* ─── Locked / Upgrade State ─────────────────────────────── */
function LockedState() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
          <Store size={18} color="#fff" />
        </div>
        <div>
          <h1 className="text-lg font-black text-gray-900">Multi-Shop</h1>
          <p className="text-xs text-gray-400 font-medium">একটি account দিয়ে একাধিক শপ চালান</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-5 bg-amber-50">
            <Crown size={28} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-black text-gray-900 text-center mb-2">Business Plan প্রয়োজন</h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Multi-Shop শুধুমাত্র Business Plan-এ পাওয়া যায়। একটি account দিয়ে সর্বোচ্চ ৩টি আলাদা শপ পরিচালনা করুন।
          </p>

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {[
              { icon: GitBranch, label: "একাধিক Branch শপ", desc: "মূল শপের পাশে branch তৈরি করুন" },
              { icon: ArrowLeftRight, label: "Stock Transfer", desc: "Branch-এ পণ্য স্থানান্তর করুন" },
              { icon: TrendingUp, label: "Consolidated Report", desc: "সব শপের P&L একসাথে দেখুন" },
              { icon: CheckCircle2, label: "একই Dashboard", desc: "সব শপ একসাথে ম্যানেজ করুন" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-100">
                  <Icon size={15} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/settings?tab=subscription"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-bold text-sm"
            style={{ background: "linear-gradient(135deg, #D97706 0%, #B45309 100%)" }}
          >
            <Crown size={16} /> Business Plan-এ Upgrade করুন
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Create Branch Modal ────────────────────────────────── */
function CreateModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ name: "", category: "", phone: "", address: "" });
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!form.name.trim()) { setErr("শপের নাম দিন"); return; }
    setCreating(true); setErr(null);
    const res = await fetch("/api/shops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    setCreating(false);
    if (!res.ok) { setErr(d.error ?? "সমস্যা হয়েছে"); return; }
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
              <Plus size={16} color="#fff" />
            </div>
            <h3 className="font-bold text-gray-900">নতুন Branch শপ</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {err && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-red-50 border border-red-100">
            <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{err}</p>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1.5">শপের নাম *</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="যেমন: রিনার বুটিক — চট্টগ্রাম"
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50 text-gray-900 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">ফোন নম্বর</label>
              <input
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="01XXXXXXXXX"
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 text-gray-900"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">ক্যাটাগরি</label>
              <div className="relative">
                <select
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full h-10 px-3 pr-8 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 text-gray-700 appearance-none"
                >
                  <option value="">নির্বাচন করুন</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1.5">ঠিকানা</label>
            <input
              value={form.address}
              onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
              placeholder="যেমন: Uttara, Dhaka"
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 text-gray-900"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            বাতিল
          </button>
          <button
            onClick={submit}
            disabled={creating}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Store size={14} />}
            {creating ? "তৈরি হচ্ছে..." : "শপ তৈরি করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Edit Branch Modal ──────────────────────────────────── */
function EditModal({ branch, onClose, onSaved, showToast }: {
  branch: Branch;
  onClose: () => void;
  onSaved: () => void;
  showToast: (type: "success" | "error", msg: string) => void;
}) {
  const [form, setForm] = useState({ name: branch.name, category: branch.category ?? "", phone: branch.phone ?? "", address: branch.address ?? "" });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.name.trim()) { showToast("error", "শপের নাম দিন"); return; }
    setSaving(true);
    const res = await fetch(`/api/shops?branchId=${branch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { showToast("success", "Branch আপডেট হয়েছে ✓"); onSaved(); }
    else { const d = await res.json(); showToast("error", d.error ?? "সমস্যা হয়েছে"); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-violet-100">
              <Edit3 size={15} className="text-violet-600" />
            </div>
            <h3 className="font-bold text-gray-900">Branch সম্পাদনা</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={16} className="text-gray-400" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1.5">শপের নাম *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-violet-500 text-gray-900" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">ফোন</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="01XXXXXXXXX"
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-violet-500 text-gray-900" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">ক্যাটাগরি</label>
              <div className="relative">
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full h-10 px-3 pr-8 rounded-xl border border-gray-200 text-sm outline-none focus:border-violet-500 text-gray-700 appearance-none">
                  <option value="">নির্বাচন করুন</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1.5">ঠিকানা</label>
            <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
              placeholder="যেমন: Chittagong, Agrabad"
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-violet-500 text-gray-900" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">বাতিল</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Stock Transfer Modal ───────────────────────────────── */
function TransferModal({ branches, onClose, onTransferred, showToast }: {
  branches: Branch[];
  onClose: () => void;
  onTransferred: () => void;
  showToast: (type: "success" | "error", msg: string) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [transfer, setTransfer] = useState({ productId: "", toBranchId: "", quantity: 1, note: "" });
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    fetch("/api/products?limit=200")
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d.products) ? d.products : []))
      .finally(() => setLoadingProducts(false));
  }, []);

  const selectedProduct = products.find(p => p.id === transfer.productId);

  async function doTransfer() {
    if (!transfer.productId) { showToast("error", "পণ্য নির্বাচন করুন"); return; }
    if (!transfer.toBranchId) { showToast("error", "শাখা নির্বাচন করুন"); return; }
    if (transfer.quantity < 1) { showToast("error", "পরিমাণ দিন"); return; }
    if (selectedProduct && transfer.quantity > selectedProduct.stockQty) {
      showToast("error", `স্টক অপর্যাপ্ত (আছে: ${selectedProduct.stockQty})`); return;
    }
    setTransferring(true);
    const res = await fetch("/api/shops/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transfer),
    });
    const d = await res.json();
    setTransferring(false);
    if (!res.ok) { showToast("error", d.error ?? "সমস্যা হয়েছে"); return; }
    showToast("success", d.message ?? "Transfer সফল! ✓");
    onTransferred();
  }

  const stockPct = selectedProduct ? Math.min((transfer.quantity / Math.max(selectedProduct.stockQty, 1)) * 100, 100) : 0;
  const overStock = selectedProduct ? transfer.quantity > selectedProduct.stockQty : false;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)" }}>
              <ArrowLeftRight size={16} color="#fff" />
            </div>
            <h3 className="font-bold text-gray-900">Stock Transfer</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {loadingProducts ? (
          <div className="py-8 flex justify-center">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">পণ্য নির্বাচন করুন *</label>
              <div className="relative">
                <select
                  value={transfer.productId}
                  onChange={e => setTransfer(p => ({ ...p, productId: e.target.value, quantity: 1 }))}
                  className="w-full h-10 px-3 pr-8 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 text-gray-900 appearance-none"
                >
                  <option value="">পণ্য বেছে নিন</option>
                  {products.map(pr => (
                    <option key={pr.id} value={pr.id}>{pr.name} (স্টক: {pr.stockQty})</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
              {selectedProduct && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">বর্তমান স্টক</span>
                    <span className={`font-semibold ${selectedProduct.stockQty < 5 ? "text-red-500" : "text-gray-700"}`}>
                      {selectedProduct.stockQty} টি
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">প্রাপক শাখা *</label>
              <div className="relative">
                <select
                  value={transfer.toBranchId}
                  onChange={e => setTransfer(p => ({ ...p, toBranchId: e.target.value }))}
                  className="w-full h-10 px-3 pr-8 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 text-gray-900 appearance-none"
                >
                  <option value="">শাখা বেছে নিন</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-500">পরিমাণ *</label>
                {selectedProduct && (
                  <span className="text-[10px] text-gray-400">সর্বোচ্চ: {selectedProduct.stockQty}</span>
                )}
              </div>
              <input
                type="number"
                min={1}
                max={selectedProduct?.stockQty ?? undefined}
                value={transfer.quantity}
                onChange={e => setTransfer(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
                className={`w-full h-10 px-3 rounded-xl border text-sm outline-none text-gray-900 transition-all ${overStock ? "border-red-300 focus:border-red-500 bg-red-50" : "border-gray-200 focus:border-blue-500"}`}
              />
              {selectedProduct && transfer.quantity > 0 && (
                <div className="mt-2 space-y-1">
                  <ProgressBar value={transfer.quantity} max={selectedProduct.stockQty} />
                  {overStock && (
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle size={11} className="text-red-500" />
                      <p className="text-xs text-red-500">স্টক অপর্যাপ্ত! আছে: {selectedProduct.stockQty}টি</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">নোট</label>
              <input
                value={transfer.note}
                onChange={e => setTransfer(p => ({ ...p, note: e.target.value }))}
                placeholder="যেমন: ঈদ স্টক, বিশেষ অর্ডার..."
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 text-gray-900"
              />
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <Info size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">মূল শপের স্টক কমে যাবে এবং branch transfer হিসেবে রেকর্ড হবে।</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">বাতিল</button>
          <button
            onClick={doTransfer}
            disabled={transferring || loadingProducts || overStock}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)" }}
          >
            {transferring ? <Loader2 size={14} className="animate-spin" /> : <ArrowLeftRight size={14} />}
            {transferring ? "হচ্ছে..." : "Transfer করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Shop Card ──────────────────────────────────────────── */
function ShopCard({
  shop, isMain, onDelete, onEdit, deleting,
}: {
  shop: MainShop | Branch;
  isMain: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  deleting?: boolean;
}) {
  const initials = shop.name.slice(0, 2).toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
            style={{
              background: isMain
                ? "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)"
                : "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-black text-gray-900 text-base">{shop.name}</p>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                style={isMain
                  ? { backgroundColor: "#DCFCE7", color: "#16A34A" }
                  : { backgroundColor: "#EDE9FE", color: "#7C3AED" }}
              >
                {isMain ? "Main" : "Branch"}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
              {shop.category && (
                <span className="flex items-center gap-1">
                  <Boxes size={10} /> {shop.category}
                </span>
              )}
              {shop.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={10} /> {shop.phone}
                </span>
              )}
              {shop.address && (
                <span className="flex items-center gap-1">
                  <MapPin size={10} /> {shop.address}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isMain ? (
              <Link
                href="/settings?tab=shop"
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                সেটিংস <ArrowRight size={12} />
              </Link>
            ) : (
              <div className="flex gap-1">
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="p-2 rounded-xl hover:bg-violet-50 transition-colors"
                    title="সম্পাদনা"
                  >
                    <Edit3 size={14} className="text-violet-500" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={onDelete}
                    disabled={deleting}
                    className="p-2 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                    title="মুছে ফেলুন"
                  >
                    {deleting
                      ? <Loader2 size={14} className="animate-spin text-gray-400" />
                      : <Trash2 size={14} className="text-red-400" />}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Transfer History ───────────────────────────────────── */
function TransferHistory() {
  const [history, setHistory] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shops/transfers")
      .then(r => r.ok ? r.json() : { transfers: [] })
      .then(d => setHistory(d.transfers ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="py-6 flex justify-center">
      <Loader2 size={20} className="animate-spin text-gray-300" />
    </div>
  );

  if (history.length === 0) return (
    <div className="py-8 text-center">
      <History size={28} className="text-gray-200 mx-auto mb-2" />
      <p className="text-sm text-gray-400">কোনো transfer ইতিহাস নেই</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {history.slice(0, 10).map(rec => (
        <div key={rec.id} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ArrowLeftRight size={12} className="text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 font-medium truncate">{rec.reason}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {new Date(rec.createdAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <span className="text-xs font-bold text-blue-600 flex-shrink-0 bg-blue-50 px-2 py-0.5 rounded-lg">
            {Math.abs(rec.quantity)} pcs
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function ShopsPage() {
  const [data, setData] = useState<ShopData | null>(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [activeTab, setActiveTab] = useState<"shops" | "history">("shops");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/shops")
      .then(r => r.json())
      .then(d => {
        if (d.locked) { setLocked(true); return; }
        setData(d);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteBranch(branchId: string) {
    setDeleting(branchId);
    const res = await fetch(`/api/shops?branchId=${branchId}`, { method: "DELETE" });
    setDeleting(null);
    setConfirmDelete(null);
    if (!res.ok) { showToast("error", "মুছতে সমস্যা হয়েছে"); return; }
    showToast("success", "Branch মুছে ফেলা হয়েছে ✓");
    load();
  }

  if (loading) return (
    <div className="max-w-2xl space-y-4 animate-pulse">
      <div className="h-10 w-56 rounded-xl bg-gray-100" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100" />)}
      </div>
      <div className="h-28 rounded-2xl bg-gray-100" />
      <div className="h-28 rounded-2xl bg-gray-100" />
    </div>
  );

  if (locked) return <LockedState />;

  const canAdd = data ? data.totalShops < data.maxShops : false;
  const hasBranches = (data?.branches.length ?? 0) > 0;
  const usagePct = data ? Math.round((data.totalShops / data.maxShops) * 100) : 0;

  return (
    <div className="max-w-2xl space-y-5">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-xl ${toast.type === "success" ? "bg-emerald-600" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="font-black text-gray-900 mb-2">Branch মুছবেন?</h3>
            <p className="text-sm text-gray-500 mb-5">এই শপটি স্থায়ীভাবে মুছে যাবে। এটি পূর্বাবস্থায় ফেরানো যাবে না।</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">বাতিল</button>
              <button onClick={() => deleteBranch(confirmDelete)} disabled={!!deleting}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-60">
                {deleting ? <Loader2 size={14} className="animate-spin mx-auto" /> : "হ্যাঁ, মুছুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Header ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
            <Store size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900">Multi-Shop</h1>
            <p className="text-xs text-gray-400 font-medium">{data?.totalShops ?? 0}/{data?.maxShops ?? 3} শপ ব্যবহার হচ্ছে</p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasBranches && (
            <button
              onClick={() => setShowTransfer(true)}
              className="h-9 px-3.5 rounded-xl border border-gray-200 text-sm font-semibold flex items-center gap-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeftRight size={14} /> Stock Transfer
            </button>
          )}
          {canAdd && (
            <button
              onClick={() => setShowCreate(true)}
              className="h-9 px-4 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}
            >
              <Plus size={14} /> নতুন Branch
            </button>
          )}
          <button onClick={load} className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50">
            <RefreshCw size={14} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* ─── Usage Card ──────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package size={15} className="text-gray-400" />
            <span className="text-sm font-bold text-gray-700">Shop Capacity</span>
          </div>
          <span className={`text-sm font-black ${usagePct >= 100 ? "text-red-500" : "text-emerald-600"}`}>
            {data?.totalShops}/{data?.maxShops} ব্যবহৃত
          </span>
        </div>
        <ProgressBar value={data?.totalShops ?? 0} max={data?.maxShops ?? 3} />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-400">Business Plan — সর্বোচ্চ {data?.maxShops}টি শপ</p>
          {!canAdd && (
            <Link href="/settings?tab=subscription" className="text-xs font-semibold text-amber-600 hover:underline">
              আরও শপ পেতে Upgrade করুন
            </Link>
          )}
        </div>
      </div>

      {/* ─── Stat Row ────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "মোট শপ", value: data?.totalShops ?? 0, gradient: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)", icon: Store },
          { label: "Branch শপ", value: data?.branches.length ?? 0, gradient: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)", icon: GitBranch },
          { label: "Stock Transfer", value: "—", gradient: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)", icon: ArrowLeftRight },
        ].map(({ label, value, gradient, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: gradient }}>
              <Icon size={15} color="#fff" />
            </div>
            <p className="text-xl font-black text-gray-900">{value}</p>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ─── Tab Bar ─────────────────────── */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit bg-gray-100">
        {[
          { key: "shops" as const, label: "শপ তালিকা", icon: Store },
          { key: "history" as const, label: "Transfer ইতিহাস", icon: History },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap"
            style={{
              background: activeTab === tab.key ? "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" : "transparent",
              color: activeTab === tab.key ? "#fff" : "#6B7280",
            }}
          >
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Shops Tab ───────────────────── */}
      {activeTab === "shops" && (
        <div className="space-y-3">
          {data?.mainShop && (
            <ShopCard shop={data.mainShop} isMain />
          )}

          {data?.branches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-3">
                <GitBranch size={24} className="text-violet-400" />
              </div>
              <p className="font-bold text-gray-700 text-sm">কোনো Branch শপ নেই</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">উপরের &quot;নতুন Branch&quot; বাটন দিয়ে আপনার প্রথম Branch তৈরি করুন</p>
              {canAdd && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="px-5 py-2 rounded-xl text-white text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)" }}
                >
                  <Plus size={14} className="inline mr-1.5 -mt-0.5" />
                  প্রথম Branch তৈরি করুন
                </button>
              )}
            </div>
          ) : (
            data?.branches.map(branch => (
              <ShopCard
                key={branch.id}
                shop={branch}
                isMain={false}
                onEdit={() => setEditBranch(branch)}
                onDelete={() => setConfirmDelete(branch.id)}
                deleting={deleting === branch.id}
              />
            ))
          )}

          {!canAdd && data && data.totalShops >= data.maxShops && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
              <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Limit পূর্ণ হয়েছে</p>
                <p className="text-xs text-amber-600 mt-0.5">আপনার Business Plan-এ সর্বোচ্চ <strong>{data.maxShops}টি</strong> শপ রাখা যাবে।</p>
              </div>
            </div>
          )}

          {/* How it works */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Info size={15} className="text-gray-400" />
              <h3 className="text-sm font-bold text-gray-700">Multi-Shop কীভাবে কাজ করে</h3>
            </div>
            <div className="space-y-3">
              {[
                { icon: GitBranch, text: "Branch শপগুলো আপনার মূল account-এর সাথে যুক্ত থাকবে", color: "text-violet-500", bg: "bg-violet-50" },
                { icon: ArrowLeftRight, text: "Stock Transfer বাটন দিয়ে মূল শপ থেকে branch-এ পণ্য পাঠান", color: "text-blue-500", bg: "bg-blue-50" },
                { icon: Store, text: "একই dashboard থেকে সব শপ পরিচালনা করুন", color: "text-emerald-500", bg: "bg-emerald-50" },
                { icon: TrendingUp, text: "Reports-এ সব branch-এর consolidated P&L দেখুন", color: "text-orange-500", bg: "bg-orange-50" },
              ].map(({ icon: Icon, text, color, bg }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={13} className={color} />
                  </div>
                  <p className="text-xs text-gray-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── History Tab ─────────────────── */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <History size={15} className="text-gray-400" />
            <h3 className="text-sm font-bold text-gray-700">সাম্প্রতিক Stock Transfer</h3>
          </div>
          <TransferHistory />
        </div>
      )}

      {/* ─── Modals ──────────────────────── */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); showToast("success", "নতুন Branch তৈরি হয়েছে! ✓"); load(); }}
        />
      )}
      {showTransfer && data && (
        <TransferModal
          branches={data.branches}
          onClose={() => setShowTransfer(false)}
          onTransferred={() => { setShowTransfer(false); load(); }}
          showToast={showToast}
        />
      )}
      {editBranch && (
        <EditModal
          branch={editBranch}
          onClose={() => setEditBranch(null)}
          onSaved={() => { setEditBranch(null); load(); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}
