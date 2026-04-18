"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Store, Plus, Crown, X, Loader2, Trash2, Phone, MapPin,
  ArrowLeftRight, CheckCircle2, TrendingUp, GitBranch, Package,
  Edit3, Save, History, AlertTriangle, ChevronDown, RefreshCw,
  Boxes, Info, Search, Filter, Download, Users, BarChart2,
  ChevronRight, ChevronUp, Minus, StickyNote, Clock, Hash,
  Settings, ShoppingBag, UserCheck, Eye,
} from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, LineChart, Line,
} from "recharts";

/* ─── Types ─────────────────────────────────────────────── */
interface Branch {
  id: string; name: string; category: string | null;
  phone: string | null; address: string | null;
  note: string | null; createdAt: string;
}
interface MainShop {
  id: string; name: string; category: string | null;
  phone: string | null; address: string | null; logoUrl?: string | null;
  productCount?: number; customerCount?: number;
}
interface ShopData {
  mainShop: MainShop; branches: Branch[];
  maxShops: number; totalShops: number;
  transferCount: number; productCount: number; customerCount: number;
}
interface Product { id: string; name: string; sku: string | null; stockQty: number; }
interface TransferRecord {
  id: string; productId: string; productName: string; productSku: string | null;
  quantity: number; branchName: string; note: string | null; createdAt: string;
}

/* ─── Helpers ─────────────────────────────────────────────── */
const CATS = ["পোশাক", "জুয়েলারি", "খাবার", "সৌন্দর্য", "গৃহস্থালি", "ইলেকট্রনিক্স", "অন্যান্য"];
const CAT_COLORS: Record<string, string> = {
  পোশাক: "#F59E0B", জুয়েলারি: "#EC4899", খাবার: "#EF4444",
  সৌন্দর্য: "#8B5CF6", গৃহস্থালি: "#10B981", ইলেকট্রনিক্স: "#3B82F6", অন্যান্য: "#6B7280",
};

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 86400)      return `${Math.floor(d / 3600) || 1} ঘণ্টা আগে`;
  if (d < 86400 * 30) return `${Math.floor(d / 86400)} দিন আগে`;
  return new Date(iso).toLocaleDateString("bn-BD", { day: "numeric", month: "short" });
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const color = pct >= 100 ? "#EF4444" : pct >= 66 ? "#F59E0B" : "#10B981";
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--c-bg)" }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: `${color}14` }}>
      <span className="text-xs font-black" style={{ color }}>{value}</span>
      <span className="text-[10px] font-medium" style={{ color: `${color}aa` }}>{label}</span>
    </div>
  );
}

/* ─── Locked State ─────────────────────────────────────────── */
function LockedState() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg,#0F6E56 0%,#10B981 60%,#3B82F6 100%)" }}>
        <div className="p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
              <Store size={22} color="white" />
            </div>
            <div>
              <h1 className="text-xl font-black">Multi-Shop</h1>
              <p className="text-sm opacity-80">একটি account দিয়ে একাধিক শপ চালান</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-6 text-center" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#FEF3C7" }}>
          <Crown size={28} style={{ color: "#D97706" }} />
        </div>
        <h2 className="text-xl font-black mb-2" style={{ color: "var(--c-text)" }}>Business Plan প্রয়োজন</h2>
        <p className="text-sm mb-6" style={{ color: "var(--c-text-muted)" }}>
          Multi-Shop শুধুমাত্র Business Plan-এ পাওয়া যায়। একটি account দিয়ে সর্বোচ্চ ৩টি আলাদা শপ পরিচালনা করুন।
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-6 text-left">
          {[
            { icon: GitBranch,       label: "একাধিক Branch শপ",     desc: "মূল শপের পাশে branch তৈরি করুন"       },
            { icon: ArrowLeftRight,  label: "Stock Transfer",          desc: "Branch-এ পণ্য স্থানান্তর করুন"        },
            { icon: BarChart2,       label: "Transfer Analytics",      desc: "কোন branch-এ কত পণ্য গেছে দেখুন"     },
            { icon: CheckCircle2,    label: "একই Dashboard",           desc: "সব শপ একসাথে ম্যানেজ করুন"           },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3 p-3.5 rounded-xl" style={{ backgroundColor: "var(--c-bg)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#D1FAE5" }}>
                <Icon size={15} style={{ color: "#0F6E56" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <Link href="/settings?tab=subscription"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-bold text-sm"
          style={{ background: "linear-gradient(135deg, #D97706 0%, #B45309 100%)" }}
        >
          <Crown size={16} /> Business Plan-এ Upgrade করুন
        </Link>
      </div>
    </div>
  );
}

/* ─── Input Field ──────────────────────────────────────────── */
function Field({ label, value, onChange, placeholder, type = "text", required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-bold block mb-1.5" style={{ color: "var(--c-text-muted)" }}>
        {label}{required && <span style={{ color: "#EF4444" }}> *</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-10 px-3 rounded-xl border text-sm outline-none transition-all"
        style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
        onFocus={e => (e.currentTarget.style.borderColor = "#0F6E56")}
        onBlur={e  => (e.currentTarget.style.borderColor = "var(--c-border)")}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div>
      <label className="text-xs font-bold block mb-1.5" style={{ color: "var(--c-text-muted)" }}>{label}</label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full h-10 px-3 pr-8 rounded-xl border text-sm outline-none appearance-none"
          style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
        >
          <option value="">নির্বাচন করুন</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--c-text-muted)" }} />
      </div>
    </div>
  );
}

/* ─── Create Branch Modal ──────────────────────────────────── */
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", category: "", phone: "", address: "", note: "" });
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!form.name.trim()) { setErr("শপের নাম দিন"); return; }
    setCreating(true); setErr(null);
    const res = await fetch("/api/shops", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await res.json();
    setCreating(false);
    if (!res.ok) { setErr(d.error ?? "সমস্যা হয়েছে"); return; }
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl shadow-2xl p-6 max-w-md w-full" style={{ backgroundColor: "var(--c-surface)" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F6E56, #10B981)" }}>
              <Plus size={16} color="#fff" />
            </div>
            <h3 className="font-black" style={{ color: "var(--c-text)" }}>নতুন Branch শপ তৈরি করুন</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl" style={{ color: "var(--c-text-muted)" }}><X size={16} /></button>
        </div>

        {err && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
            <AlertTriangle size={14} style={{ color: "#EF4444", flexShrink: 0 }} />
            <p className="text-sm" style={{ color: "#DC2626" }}>{err}</p>
          </div>
        )}

        <div className="space-y-3">
          <Field label="শপের নাম" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))}
            placeholder="যেমন: রিনার বুটিক — চট্টগ্রাম" required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="ফোন নম্বর" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} placeholder="01XXXXXXXXX" />
            <SelectField label="ক্যাটাগরি" value={form.category} onChange={v => setForm(p => ({ ...p, category: v }))} options={CATS} />
          </div>
          <Field label="ঠিকানা" value={form.address} onChange={v => setForm(p => ({ ...p, address: v }))} placeholder="যেমন: Uttara, Dhaka" />
          <div>
            <label className="text-xs font-bold block mb-1.5" style={{ color: "var(--c-text-muted)" }}>নোট / বিবরণ</label>
            <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              placeholder="এই branch সম্পর্কে কিছু লিখুন…" rows={2}
              className="w-full px-3 py-2 rounded-xl border text-sm resize-none outline-none"
              style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
            />
          </div>
        </div>

        {/* Preview */}
        {form.name && (
          <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: "#EEF2FF", border: "1px solid #C7D2FE" }}>
            <p className="text-[10px] font-bold mb-1.5" style={{ color: "#4F46E5" }}>Preview</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black"
                style={{ background: "linear-gradient(135deg,#7C3AED,#6D28D9)" }}>
                {form.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: "var(--c-text)" }}>{form.name}</p>
                {form.address && <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>{form.address}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}>বাতিল</button>
          <button onClick={submit} disabled={creating}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #0F6E56, #10B981)" }}
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Store size={14} />}
            {creating ? "তৈরি হচ্ছে..." : "শপ তৈরি করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Edit Branch Modal ──────────────────────────────────────── */
function EditModal({ branch, onClose, onSaved, showToast }: {
  branch: Branch; onClose: () => void; onSaved: () => void;
  showToast: (type: "success" | "error", msg: string) => void;
}) {
  const [form, setForm] = useState({
    name: branch.name, category: branch.category ?? "",
    phone: branch.phone ?? "", address: branch.address ?? "", note: branch.note ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.name.trim()) { showToast("error", "শপের নাম দিন"); return; }
    setSaving(true);
    const res = await fetch(`/api/shops?branchId=${branch.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { showToast("success", "Branch আপডেট হয়েছে ✓"); onSaved(); }
    else { const d = await res.json(); showToast("error", d.error ?? "সমস্যা হয়েছে"); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl shadow-2xl p-6 max-w-md w-full" style={{ backgroundColor: "var(--c-surface)" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#EDE9FE" }}>
              <Edit3 size={15} style={{ color: "#7C3AED" }} />
            </div>
            <h3 className="font-black" style={{ color: "var(--c-text)" }}>Branch সম্পাদনা</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl" style={{ color: "var(--c-text-muted)" }}><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <Field label="শপের নাম" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="ফোন" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} placeholder="01XXXXXXXXX" />
            <SelectField label="ক্যাটাগরি" value={form.category} onChange={v => setForm(p => ({ ...p, category: v }))} options={CATS} />
          </div>
          <Field label="ঠিকানা" value={form.address} onChange={v => setForm(p => ({ ...p, address: v }))} placeholder="যেমন: Chittagong" />
          <div>
            <label className="text-xs font-bold block mb-1.5" style={{ color: "var(--c-text-muted)" }}>নোট / বিবরণ</label>
            <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              rows={2} className="w-full px-3 py-2 rounded-xl border text-sm resize-none outline-none"
              style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}>বাতিল</button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#7C3AED" }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Enhanced Transfer Modal ────────────────────────────────── */
function TransferModal({ branches, mainShopName, onClose, onTransferred, showToast }: {
  branches: Branch[]; mainShopName: string;
  onClose: () => void; onTransferred: () => void;
  showToast: (type: "success" | "error", msg: string) => void;
}) {
  const [products, setProducts]       = useState<Product[]>([]);
  const [loadingProducts, setLoading] = useState(true);
  const [search, setSearch]           = useState("");
  const [transfer, setTransfer]       = useState({ productId: "", toBranchId: "", quantity: 1, note: "" });
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    fetch("/api/products?all=1")
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : (Array.isArray(d.products) ? d.products : [])))
      .finally(() => setLoading(false));
  }, []);

  const selectedProduct = products.find(p => p.id === transfer.productId);
  const overStock = selectedProduct ? transfer.quantity > selectedProduct.stockQty : false;
  const canSubmit = !transferring && !loadingProducts && !overStock && transfer.productId && transfer.toBranchId && transfer.quantity >= 1;

  const filteredProducts = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(search.toLowerCase()))
    : products;

  const setQty = (v: number) => setTransfer(p => ({ ...p, quantity: Math.max(1, v) }));
  const quickQty = (pct: number) => {
    if (!selectedProduct) return;
    setTransfer(p => ({ ...p, quantity: Math.max(1, Math.floor(selectedProduct.stockQty * pct)) }));
  };

  async function doTransfer() {
    if (!canSubmit) return;
    setTransferring(true);
    const res = await fetch("/api/shops/transfer", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transfer),
    });
    const d = await res.json();
    setTransferring(false);
    if (!res.ok) { showToast("error", d.error ?? "সমস্যা হয়েছে"); return; }
    showToast("success", d.message ?? "Transfer সফল! ✓");
    onTransferred();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl shadow-2xl p-6 max-w-md w-full" style={{ backgroundColor: "var(--c-surface)" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#3B82F6,#2563EB)" }}>
              <ArrowLeftRight size={16} color="#fff" />
            </div>
            <div>
              <h3 className="font-black" style={{ color: "var(--c-text)" }}>Stock Transfer</h3>
              <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>মূল শপ থেকে Branch-এ পণ্য পাঠান</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl" style={{ color: "var(--c-text-muted)" }}><X size={16} /></button>
        </div>

        {/* From → To visual */}
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
          <div className="flex-1 text-center">
            <p className="text-[10px] font-bold mb-1" style={{ color: "#3B82F6" }}>প্রেরক</p>
            <div className="w-8 h-8 rounded-lg mx-auto mb-1 flex items-center justify-center text-white text-xs font-black"
              style={{ background: "linear-gradient(135deg,#0F6E56,#10B981)" }}>
              {mainShopName.slice(0, 2).toUpperCase()}
            </div>
            <p className="text-[10px] font-semibold truncate" style={{ color: "var(--c-text)" }}>{mainShopName}</p>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>Main</span>
          </div>
          <ArrowRight />
          <div className="flex-1 text-center">
            <p className="text-[10px] font-bold mb-1" style={{ color: "#7C3AED" }}>প্রাপক</p>
            {transfer.toBranchId ? (
              <>
                <div className="w-8 h-8 rounded-lg mx-auto mb-1 flex items-center justify-center text-white text-xs font-black"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#6D28D9)" }}>
                  {(branches.find(b => b.id === transfer.toBranchId)?.name ?? "").slice(0, 2).toUpperCase()}
                </div>
                <p className="text-[10px] font-semibold truncate" style={{ color: "var(--c-text)" }}>
                  {branches.find(b => b.id === transfer.toBranchId)?.name}
                </p>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: "#EDE9FE", color: "#7C3AED" }}>Branch</span>
              </>
            ) : (
              <div className="w-8 h-8 rounded-lg mx-auto mb-1 border-2 border-dashed flex items-center justify-center" style={{ borderColor: "#C4B5FD" }}>
                <Hash size={12} style={{ color: "#A78BFA" }} />
              </div>
            )}
          </div>
        </div>

        {loadingProducts ? (
          <div className="py-8 flex justify-center"><Loader2 size={24} className="animate-spin" style={{ color: "var(--c-text-muted)" }} /></div>
        ) : (
          <div className="space-y-4">
            {/* Product search + select */}
            <div>
              <label className="text-xs font-bold block mb-1.5" style={{ color: "var(--c-text-muted)" }}>পণ্য নির্বাচন করুন *</label>
              <div className="relative mb-2">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="পণ্যের নাম বা SKU লিখুন…"
                  className="w-full h-9 pl-8 pr-3 rounded-xl border text-xs outline-none"
                  style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
                />
              </div>
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--c-border)", maxHeight: 180 }}>
                <div className="overflow-y-auto" style={{ maxHeight: 180 }}>
                  {filteredProducts.length === 0 ? (
                    <p className="text-xs text-center py-4" style={{ color: "var(--c-text-muted)" }}>কোনো পণ্য পাওয়া যায়নি</p>
                  ) : filteredProducts.slice(0, 30).map(pr => (
                    <button key={pr.id} onClick={() => { setTransfer(p => ({ ...p, productId: pr.id, quantity: 1 })); setSearch(""); }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-left border-b last:border-0 transition-colors"
                      style={{
                        borderColor: "var(--c-border)",
                        backgroundColor: transfer.productId === pr.id ? "#D1FAE5" : "var(--c-bg)",
                        color: "var(--c-text)",
                      }}
                    >
                      <div>
                        <p className="font-semibold">{pr.name}</p>
                        {pr.sku && <p style={{ color: "var(--c-text-muted)" }}>SKU: {pr.sku}</p>}
                      </div>
                      <span className={`font-bold px-2 py-0.5 rounded-lg text-[10px] ${pr.stockQty < 5 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
                        {pr.stockQty} টি
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              {selectedProduct && (
                <p className="text-xs mt-1.5 font-semibold" style={{ color: "#0F6E56" }}>
                  ✓ {selectedProduct.name} — স্টকে আছে: {selectedProduct.stockQty}টি
                </p>
              )}
            </div>

            {/* Branch select */}
            <div>
              <label className="text-xs font-bold block mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                প্রাপক Branch <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <div className="relative">
                <select value={transfer.toBranchId} onChange={e => setTransfer(p => ({ ...p, toBranchId: e.target.value }))}
                  className="w-full h-10 px-3 pr-8 rounded-xl border text-sm outline-none appearance-none"
                  style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
                >
                  <option value="">Branch বেছে নিন</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}{b.address ? ` — ${b.address}` : ""}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--c-text-muted)" }} />
              </div>
            </div>

            {/* Quantity */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold" style={{ color: "var(--c-text-muted)" }}>পরিমাণ *</label>
                {selectedProduct && (
                  <div className="flex gap-1">
                    {[0.25, 0.5, 0.75, 1].map(pct => (
                      <button key={pct} onClick={() => quickQty(pct)}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg transition-colors"
                        style={{ backgroundColor: "#EFF6FF", color: "#3B82F6" }}
                      >
                        {pct * 100}%
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setQty(transfer.quantity - 1)}
                  className="w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}>
                  <Minus size={14} />
                </button>
                <input type="number" min={1} max={selectedProduct?.stockQty} value={transfer.quantity}
                  onChange={e => setQty(parseInt(e.target.value) || 1)}
                  className="flex-1 h-9 text-center rounded-xl border text-sm font-black outline-none"
                  style={{ borderColor: overStock ? "#EF4444" : "var(--c-border)", backgroundColor: overStock ? "#FEF2F2" : "var(--c-bg)", color: overStock ? "#DC2626" : "var(--c-text)" }}
                />
                <button onClick={() => setQty(transfer.quantity + 1)}
                  className="w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}>
                  <Plus size={14} />
                </button>
              </div>
              {overStock && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <AlertTriangle size={11} style={{ color: "#EF4444" }} />
                  <p className="text-xs" style={{ color: "#EF4444" }}>স্টক অপর্যাপ্ত! আছে: {selectedProduct?.stockQty}টি</p>
                </div>
              )}
            </div>

            {/* Note */}
            <Field label="নোট (ঐচ্ছিক)" value={transfer.note} onChange={v => setTransfer(p => ({ ...p, note: v }))}
              placeholder="যেমন: ঈদ স্টক, বিশেষ অর্ডার…" />

            <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}>
              <Info size={13} style={{ color: "#D97706", flexShrink: 0, marginTop: 1 }} />
              <p className="text-xs" style={{ color: "#92400E" }}>মূল শপের স্টক কমবে এবং branch transfer হিসেবে রেকর্ড থাকবে।</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}>বাতিল</button>
          <button onClick={doTransfer} disabled={!canSubmit}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)" }}
          >
            {transferring ? <Loader2 size={14} className="animate-spin" /> : <ArrowLeftRight size={14} />}
            {transferring ? "হচ্ছে..." : "Transfer করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ArrowRight() {
  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <ArrowLeftRight size={18} style={{ color: "#3B82F6" }} />
    </div>
  );
}

/* ─── Enhanced Shop Card ─────────────────────────────────────── */
function ShopCard({ shop, isMain, onDelete, onEdit, onTransfer, deleting }: {
  shop: MainShop | Branch; isMain: boolean;
  onDelete?: () => void; onEdit?: () => void;
  onTransfer?: () => void; deleting?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const initials = shop.name.slice(0, 2).toUpperCase();
  const catColor = CAT_COLORS[shop.category ?? ""] ?? "#6B7280";
  const branch = shop as Branch;

  return (
    <div className="rounded-2xl border overflow-hidden transition-all hover:shadow-md"
      style={{ borderColor: isMain ? "#A7F3D0" : "var(--c-border)", backgroundColor: "var(--c-surface)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>

      {/* Accent top bar */}
      <div className="h-1 w-full" style={{ background: isMain ? "linear-gradient(90deg,#0F6E56,#10B981,#3B82F6)" : "linear-gradient(90deg,#7C3AED,#A855F7,#EC4899)" }} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
            style={{ background: isMain ? "linear-gradient(135deg,#0F6E56,#10B981)" : "linear-gradient(135deg,#7C3AED,#6D28D9)" }}>
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="font-black text-base" style={{ color: "var(--c-text)" }}>{shop.name}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                style={isMain ? { backgroundColor: "#DCFCE7", color: "#16A34A" } : { backgroundColor: "#EDE9FE", color: "#7C3AED" }}>
                {isMain ? "🏠 Main" : "📍 Branch"}
              </span>
              {shop.category && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: `${catColor}18`, color: catColor }}>
                  {shop.category}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs mb-2" style={{ color: "var(--c-text-muted)" }}>
              {shop.phone   && <span className="flex items-center gap-1"><Phone  size={10} /> {shop.phone}</span>}
              {shop.address && <span className="flex items-center gap-1"><MapPin size={10} /> {shop.address}</span>}
              {!isMain && branch.createdAt && (
                <span className="flex items-center gap-1"><Clock size={10} /> {timeAgo(branch.createdAt)} তৈরি হয়েছে</span>
              )}
            </div>

            {/* Quick stats for main shop */}
            {isMain && (
              <div className="flex gap-2 flex-wrap">
                <StatPill label="পণ্য" value={(shop as MainShop).productCount ?? 0} color="#0F6E56" />
                <StatPill label="কাস্টমার" value={(shop as MainShop).customerCount ?? 0} color="#3B82F6" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {isMain ? (
              <div className="flex flex-col gap-1">
                <Link href="/settings?tab=shop"
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-colors"
                  style={{ backgroundColor: "#D1FAE5", color: "#0F6E56" }}>
                  <Settings size={11} /> সেটিংস
                </Link>
                <Link href="/inventory"
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-colors"
                  style={{ backgroundColor: "var(--c-bg)", color: "var(--c-text-sub)" }}>
                  <Package size={11} /> পণ্য
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-1 items-end">
                {onTransfer && (
                  <button onClick={onTransfer}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl"
                    style={{ backgroundColor: "#EFF6FF", color: "#3B82F6" }}>
                    <ArrowLeftRight size={11} /> Transfer
                  </button>
                )}
                <div className="flex gap-1">
                  {onEdit && (
                    <button onClick={onEdit} className="p-1.5 rounded-xl transition-colors" title="সম্পাদনা"
                      style={{ color: "#7C3AED" }}>
                      <Edit3 size={14} />
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={onDelete} disabled={deleting} className="p-1.5 rounded-xl transition-colors disabled:opacity-50" title="মুছুন"
                      style={{ color: "#EF4444" }}>
                      {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Note */}
        {!isMain && branch.note && (
          <div className="mt-2 flex items-start gap-1.5 px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--c-bg)" }}>
            <StickyNote size={11} style={{ color: "var(--c-text-muted)", flexShrink: 0, marginTop: 2 }} />
            <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{branch.note}</p>
          </div>
        )}

        {/* Expand toggle */}
        <button onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-center gap-1 mt-3 pt-2 border-t text-xs font-medium transition-colors"
          style={{ borderColor: "var(--c-border)", color: "var(--c-text-muted)" }}>
          {expanded ? <><ChevronUp size={12} /> কম দেখুন</> : <><ChevronDown size={12} /> আরো বিবরণ</>}
        </button>

        {/* Expanded detail */}
        {expanded && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {isMain ? (
              <>
                <Link href="/orders" className="flex items-center gap-2 p-2.5 rounded-xl transition-colors" style={{ backgroundColor: "var(--c-bg)", color: "var(--c-text-sub)" }}>
                  <ShoppingBag size={13} style={{ color: "#3B82F6" }} />
                  <span className="text-xs font-medium">অর্ডার দেখুন</span>
                  <ChevronRight size={11} className="ml-auto" />
                </Link>
                <Link href="/customers" className="flex items-center gap-2 p-2.5 rounded-xl" style={{ backgroundColor: "var(--c-bg)", color: "var(--c-text-sub)" }}>
                  <UserCheck size={13} style={{ color: "#0F6E56" }} />
                  <span className="text-xs font-medium">কাস্টমার</span>
                  <ChevronRight size={11} className="ml-auto" />
                </Link>
                <Link href="/reports" className="flex items-center gap-2 p-2.5 rounded-xl" style={{ backgroundColor: "var(--c-bg)", color: "var(--c-text-sub)" }}>
                  <BarChart2 size={13} style={{ color: "#F59E0B" }} />
                  <span className="text-xs font-medium">রিপোর্ট</span>
                  <ChevronRight size={11} className="ml-auto" />
                </Link>
                <Link href="/inventory" className="flex items-center gap-2 p-2.5 rounded-xl" style={{ backgroundColor: "var(--c-bg)", color: "var(--c-text-sub)" }}>
                  <Package size={13} style={{ color: "#8B5CF6" }} />
                  <span className="text-xs font-medium">ইনভেন্টরি</span>
                  <ChevronRight size={11} className="ml-auto" />
                </Link>
              </>
            ) : (
              <>
                <div className="p-2.5 rounded-xl col-span-2" style={{ backgroundColor: "var(--c-bg)" }}>
                  <p className="text-xs font-bold mb-1" style={{ color: "var(--c-text-muted)" }}>Branch তথ্য</p>
                  <div className="space-y-1">
                    {branch.phone   && <p className="text-xs" style={{ color: "var(--c-text)" }}><span style={{ color: "var(--c-text-muted)" }}>ফোন: </span>{branch.phone}</p>}
                    {branch.address && <p className="text-xs" style={{ color: "var(--c-text)" }}><span style={{ color: "var(--c-text-muted)" }}>ঠিকানা: </span>{branch.address}</p>}
                    {branch.category && <p className="text-xs" style={{ color: "var(--c-text)" }}><span style={{ color: "var(--c-text-muted)" }}>ক্যাটাগরি: </span>{branch.category}</p>}
                    <p className="text-xs" style={{ color: "var(--c-text)" }}><span style={{ color: "var(--c-text-muted)" }}>তৈরি: </span>
                      {new Date(branch.createdAt).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Transfer Log Tab ───────────────────────────────────────── */
function TransferLog() {
  const [history, setHistory]       = useState<TransferRecord[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [days, setDays]             = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (days > 0) params.set("days", String(days));
    if (search)   params.set("search", search);
    fetch(`/api/shops/transfers?${params}`)
      .then(r => r.ok ? r.json() : { transfers: [] })
      .then(d => setHistory(d.transfers ?? []))
      .finally(() => setLoading(false));
  }, [days, search]);

  useEffect(() => { load(); }, [load]);

  function exportCSV() {
    const header = "তারিখ,পণ্য,Branch,পরিমাণ,নোট\n";
    const rows = history.map(r =>
      `"${new Date(r.createdAt).toLocaleDateString("bn-BD")}","${r.productName}","${r.branchName}",${r.quantity},"${r.note ?? ""}"`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "transfer-history.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="পণ্য বা Branch নাম খুঁজুন…"
            className="w-full h-9 pl-9 pr-3 rounded-xl border text-xs outline-none"
            style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text)" }}
          />
        </div>
        <div className="flex gap-2">
          {[
            { label: "সব", v: 0 }, { label: "আজ", v: 1 },
            { label: "৭ দিন", v: 7 }, { label: "৩০ দিন", v: 30 },
          ].map(({ label, v }) => (
            <button key={v} onClick={() => setDays(v)}
              className="px-3 h-9 rounded-xl text-xs font-semibold border transition-all"
              style={{
                borderColor:     days === v ? "#3B82F6" : "var(--c-border)",
                backgroundColor: days === v ? "#3B82F6" : "var(--c-surface)",
                color:           days === v ? "white"   : "var(--c-text-sub)",
              }}
            >
              {label}
            </button>
          ))}
          <button onClick={exportCSV} title="CSV Export"
            className="h-9 w-9 rounded-xl border flex items-center justify-center transition-colors"
            style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text-muted)" }}>
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
        {loading ? "লোড হচ্ছে…" : `${history.length}টি Transfer রেকর্ড`}
      </p>

      {/* List */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 size={20} className="animate-spin" style={{ color: "var(--c-text-muted)" }} /></div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center">
            <History size={28} className="mx-auto mb-2" style={{ color: "var(--c-text-muted)", opacity: 0.3 }} />
            <p className="text-sm font-medium" style={{ color: "var(--c-text-muted)" }}>
              {search ? `"${search}" — কোনো ফলাফল নেই` : "কোনো Transfer ইতিহাস নেই"}
            </p>
          </div>
        ) : (
          history.map((rec, i) => (
            <div key={rec.id} className="flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:bg-opacity-50 transition-colors"
              style={{ borderColor: "var(--c-border)", backgroundColor: i % 2 === 0 ? "transparent" : "var(--c-bg)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: "#EFF6FF" }}>
                <ArrowLeftRight size={13} style={{ color: "#3B82F6" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--c-text)" }}>{rec.productName}</p>
                  {rec.productSku && <span className="text-[10px] px-1.5 rounded font-mono" style={{ backgroundColor: "var(--c-bg)", color: "var(--c-text-muted)" }}>{rec.productSku}</span>}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#EDE9FE", color: "#7C3AED" }}>
                    → {rec.branchName}
                  </span>
                  {rec.note && <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>— {rec.note}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-sm font-black" style={{ color: "#3B82F6" }}>{rec.quantity} pcs</span>
                <span className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>
                  {new Date(rec.createdAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short" })}
                  {" "}
                  {new Date(rec.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── Analytics Tab ─────────────────────────────────────────── */
function AnalyticsTab({ data }: { data: ShopData | null }) {
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetch("/api/shops/transfers?limit=100")
      .then(r => r.ok ? r.json() : { transfers: [] })
      .then(d => setTransfers(d.transfers ?? []))
      .finally(() => setLoading(false));
  }, []);

  /* Per-branch transfer count */
  const branchCounts = (data?.branches ?? []).map(b => ({
    name: b.name.length > 12 ? b.name.slice(0, 12) + "…" : b.name,
    count: transfers.filter(t => t.branchName === b.name).reduce((s, t) => s + t.quantity, 0),
  })).sort((a, b) => b.count - a.count);

  /* Top transferred products */
  const productMap: Record<string, number> = {};
  transfers.forEach(t => { productMap[t.productName] = (productMap[t.productName] ?? 0) + t.quantity; });
  const topProducts = Object.entries(productMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, qty]) => ({ name: name.length > 15 ? name.slice(0, 15) + "…" : name, qty }));

  /* Daily transfer volume (last 14 days) */
  const now = Date.now();
  const dailyData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * 86400000);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    const total = transfers
      .filter(t => {
        const td = new Date(t.createdAt);
        return td.getDate() === d.getDate() && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      })
      .reduce((s, t) => s + t.quantity, 0);
    return { label, total };
  });

  if (loading) return <div className="py-12 flex justify-center"><Loader2 size={20} className="animate-spin" style={{ color: "var(--c-text-muted)" }} /></div>;

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "মোট Transfer", value: transfers.reduce((s, t) => s + t.quantity, 0) + " pcs", color: "#3B82F6", icon: ArrowLeftRight },
          { label: "Transfer সংখ্যা", value: transfers.length + "টি", color: "#0F6E56", icon: History },
          { label: "সক্রিয় Branch", value: (data?.branches.length ?? 0) + "টি", color: "#7C3AED", icon: GitBranch },
          { label: "Transfer পণ্য", value: Object.keys(productMap).length + "টি", color: "#F59E0B", icon: Package },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-2xl border p-4" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${color}18` }}>
              <Icon size={15} style={{ color }} />
            </div>
            <p className="text-lg font-black" style={{ color }}>{value}</p>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: "var(--c-text-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Daily volume chart */}
      <div className="rounded-2xl border p-5" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
        <h3 className="text-sm font-black mb-4" style={{ color: "var(--c-text)" }}>দৈনিক Transfer (গত ১৪ দিন)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid var(--c-border)", backgroundColor: "var(--c-surface)" }}
              labelStyle={{ color: "var(--c-text)", fontSize: 11 }}
              itemStyle={{ color: "#3B82F6", fontSize: 11 }}
            />
            <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3, fill: "#3B82F6" }} name="পরিমাণ" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per-branch breakdown + Top products */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-5" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
          <h3 className="text-sm font-black mb-4" style={{ color: "var(--c-text)" }}>Branch-ভিত্তিক Transfer</h3>
          {branchCounts.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: "var(--c-text-muted)" }}>কোনো Branch নেই</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={branchCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--c-border)", backgroundColor: "var(--c-surface)" }}
                  itemStyle={{ color: "#7C3AED", fontSize: 11 }}
                />
                <Bar dataKey="count" fill="#7C3AED" radius={[4, 4, 0, 0]} name="পরিমাণ" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border p-5" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
          <h3 className="text-sm font-black mb-4" style={{ color: "var(--c-text)" }}>সর্বাধিক Transfer পণ্য</h3>
          {topProducts.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: "var(--c-text-muted)" }}>কোনো Transfer রেকর্ড নেই</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => {
                const maxQty = topProducts[0].qty;
                const pct = maxQty > 0 ? (p.qty / maxQty) * 100 : 0;
                return (
                  <div key={p.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black w-4 text-center" style={{ color: "var(--c-text-muted)" }}>#{i + 1}</span>
                        <span className="text-xs font-semibold truncate" style={{ color: "var(--c-text)" }}>{p.name}</span>
                      </div>
                      <span className="text-xs font-black flex-shrink-0" style={{ color: "#0F6E56" }}>{p.qty} pcs</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--c-bg)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "#0F6E56" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Toast ──────────────────────────────────────────────────── */
function Toast({ type, msg }: { type: "success" | "error"; msg: string }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-xl flex items-center gap-2`}
      style={{ backgroundColor: type === "success" ? "#0F6E56" : "#DC2626" }}>
      {type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      {msg}
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────── */
export default function ShopsPage() {
  const [data, setData]           = useState<ShopData | null>(null);
  const [locked, setLocked]       = useState(false);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setCreate]   = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [showTransfer, setTransfer] = useState(false);
  const [transferBranchId, setTransferBranchId] = useState<string | null>(null);
  const [editBranch, setEdit]     = useState<Branch | null>(null);
  const [confirmDel, setConfDel]  = useState<string | null>(null);
  const [activeTab, setTab]       = useState<"shops" | "log" | "analytics">("shops");
  const [toast, setToast]         = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const toastTimer                = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, msg });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/shops")
      .then(r => r.json())
      .then(d => { if (d.locked) { setLocked(true); return; } setData(d); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteBranch(branchId: string) {
    setDeleting(branchId);
    const res = await fetch(`/api/shops?branchId=${branchId}`, { method: "DELETE" });
    setDeleting(null); setConfDel(null);
    if (!res.ok) { showToast("error", "মুছতে সমস্যা হয়েছে"); return; }
    showToast("success", "Branch মুছে ফেলা হয়েছে ✓");
    load();
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
      <div className="h-40 rounded-2xl" style={{ backgroundColor: "var(--c-surface)" }} />
      <div className="grid grid-cols-4 gap-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-2xl" style={{ backgroundColor: "var(--c-surface)" }} />)}</div>
      <div className="h-32 rounded-2xl" style={{ backgroundColor: "var(--c-surface)" }} />
      <div className="h-32 rounded-2xl" style={{ backgroundColor: "var(--c-surface)" }} />
    </div>
  );

  if (locked) return <LockedState />;

  const canAdd = data ? data.totalShops < data.maxShops : false;
  const hasBranches = (data?.branches.length ?? 0) > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {toast && <Toast {...toast} />}

      {/* Delete Confirm Modal */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl shadow-2xl p-6 max-w-xs w-full text-center" style={{ backgroundColor: "var(--c-surface)" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#FEF2F2" }}>
              <Trash2 size={20} style={{ color: "#EF4444" }} />
            </div>
            <h3 className="font-black mb-2" style={{ color: "var(--c-text)" }}>Branch মুছবেন?</h3>
            <p className="text-sm mb-5" style={{ color: "var(--c-text-muted)" }}>এই Branch স্থায়ীভাবে মুছে যাবে। এটি পূর্বাবস্থায় ফেরানো যাবে না।</p>
            <div className="flex gap-3">
              <button onClick={() => setConfDel(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
                style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}>বাতিল</button>
              <button onClick={() => deleteBranch(confirmDel)} disabled={!!deleting}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center"
                style={{ backgroundColor: "#EF4444" }}>
                {deleting ? <Loader2 size={14} className="animate-spin" /> : "হ্যাঁ, মুছুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreate  && <CreateModal onClose={() => setCreate(false)} onCreated={() => { setCreate(false); load(); showToast("success", "নতুন Branch তৈরি হয়েছে! ✓"); }} />}
      {showTransfer && data && (
        <TransferModal
          branches={data.branches.filter(b => !transferBranchId || b.id === transferBranchId ? true : true)}
          mainShopName={data.mainShop.name}
          onClose={() => { setTransfer(false); setTransferBranchId(null); }}
          onTransferred={() => { setTransfer(false); setTransferBranchId(null); showToast("success", "Stock Transfer সফল! ✓"); load(); }}
          showToast={showToast}
        />
      )}
      {editBranch && (
        <EditModal branch={editBranch} onClose={() => setEdit(null)}
          onSaved={() => { setEdit(null); load(); }} showToast={showToast} />
      )}

      {/* ─── Gradient Header ─── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg,#0F6E56 0%,#10B981 50%,#3B82F6 100%)" }}>
        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                <Store size={22} color="white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Multi-Shop</h1>
                <p className="text-sm text-white opacity-80">
                  {data?.totalShops ?? 0}/{data?.maxShops ?? 3} শপ সক্রিয় · Business Plan
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasBranches && (
                <button onClick={() => { setTransferBranchId(null); setTransfer(true); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}>
                  <ArrowLeftRight size={13} />
                  <span className="hidden sm:inline">Transfer</span>
                </button>
              )}
              {canAdd && (
                <button onClick={() => setCreate(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#0F6E56" }}>
                  <Plus size={13} /> নতুন Branch
                </button>
              )}
              <button onClick={load} className="p-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}>
                <RefreshCw size={13} />
              </button>
            </div>
          </div>

          {/* Usage Bar */}
          <div className="mt-4">
            <ProgressBar value={data?.totalShops ?? 0} max={data?.maxShops ?? 3} />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-white opacity-70">
                {data?.totalShops}টি ব্যবহৃত · {(data?.maxShops ?? 3) - (data?.totalShops ?? 0)}টি বাকি
              </p>
              {!canAdd && (
                <Link href="/settings?tab=subscription" className="text-xs font-bold text-white underline">আরো শপ পেতে Upgrade করুন</Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "মোট শপ",      value: data?.totalShops   ?? 0, color: "#0F6E56", icon: Store,           sub: `${data?.maxShops ?? 3}টি limit` },
          { label: "Branch",       value: data?.branches.length ?? 0, color: "#7C3AED", icon: GitBranch,    sub: "সক্রিয় branch" },
          { label: "মোট পণ্য",    value: data?.productCount ?? 0, color: "#3B82F6", icon: Package,          sub: "মূল শপে" },
          { label: "Transfer",     value: data?.transferCount ?? 0, color: "#F59E0B", icon: ArrowLeftRight,  sub: "এখন পর্যন্ত" },
        ].map(({ label, value, color, icon: Icon, sub }) => (
          <div key={label} className="rounded-2xl border p-4 hover:shadow-md transition-shadow"
            style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${color}18` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-xs font-bold" style={{ color: "var(--c-text)" }}>{label}</p>
            <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{ backgroundColor: "var(--c-bg)" }}>
        {[
          { key: "shops" as const, label: "শপ তালিকা", icon: Store },
          { key: "log"   as const, label: "Transfer লগ", icon: History },
          { key: "analytics" as const, label: "বিশ্লেষণ", icon: BarChart2 },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all"
            style={{
              background: activeTab === t.key ? "linear-gradient(135deg,#0F6E56,#10B981)" : "transparent",
              color:      activeTab === t.key ? "white" : "var(--c-text-sub)",
              boxShadow:  activeTab === t.key ? "0 2px 8px rgba(15,110,86,0.25)" : "none",
            }}>
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      {/* ─── Shops Tab ─── */}
      {activeTab === "shops" && (
        <div className="space-y-3">
          {data?.mainShop && (
            <ShopCard shop={data.mainShop} isMain />
          )}

          {data?.branches.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed p-10 text-center"
              style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#EDE9FE" }}>
                <GitBranch size={24} style={{ color: "#7C3AED" }} />
              </div>
              <p className="font-black text-sm mb-1" style={{ color: "var(--c-text)" }}>কোনো Branch শপ নেই</p>
              <p className="text-xs mb-4" style={{ color: "var(--c-text-muted)" }}>"নতুন Branch" বাটন দিয়ে আপনার প্রথম Branch তৈরি করুন</p>
              {canAdd && (
                <button onClick={() => setCreate(true)}
                  className="px-5 py-2 rounded-xl text-white text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#6D28D9)" }}>
                  <Plus size={14} className="inline mr-1" /> প্রথম Branch তৈরি করুন
                </button>
              )}
            </div>
          ) : (
            data?.branches.map(branch => (
              <ShopCard key={branch.id} shop={branch} isMain={false}
                onEdit={() => setEdit(branch)}
                onDelete={() => setConfDel(branch.id)}
                onTransfer={() => { setTransferBranchId(branch.id); setTransfer(true); }}
                deleting={deleting === branch.id}
              />
            ))
          )}

          {!canAdd && data && data.totalShops >= data.maxShops && (
            <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}>
              <AlertTriangle size={15} style={{ color: "#D97706", flexShrink: 0, marginTop: 1 }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "#92400E" }}>Limit পূর্ণ হয়েছে</p>
                <p className="text-xs mt-0.5" style={{ color: "#B45309" }}>
                  Business Plan-এ সর্বোচ্চ <strong>{data.maxShops}টি</strong> শপ রাখা যাবে।{" "}
                  <Link href="/settings?tab=subscription" className="underline font-bold">Upgrade করুন</Link>
                </p>
              </div>
            </div>
          )}

          {/* How it works */}
          <div className="rounded-2xl border p-5" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Info size={14} style={{ color: "var(--c-text-muted)" }} />
              <h3 className="text-sm font-black" style={{ color: "var(--c-text)" }}>Multi-Shop কীভাবে ব্যবহার করবেন</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {[
                { icon: GitBranch,    text: "\"নতুন Branch\" বাটনে ক্লিক করে নতুন branch শপ তৈরি করুন",       color: "#7C3AED", bg: "#EDE9FE" },
                { icon: ArrowLeftRight, text: "Branch card-এর \"Transfer\" বাটন দিয়ে সেই branch-এ স্টক পাঠান", color: "#3B82F6", bg: "#EFF6FF" },
                { icon: History,      text: "\"Transfer লগ\" tab-এ সব transfer রেকর্ড দেখুন ও export করুন",    color: "#0F6E56", bg: "#D1FAE5" },
                { icon: BarChart2,    text: "\"বিশ্লেষণ\" tab-এ branch-ভিত্তিক analytics ও charts দেখুন",     color: "#F59E0B", bg: "#FEF3C7" },
              ].map(({ icon: Icon, text, color, bg }, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl" style={{ backgroundColor: bg }}>
                  <Icon size={14} style={{ color, flexShrink: 0, marginTop: 1 }} />
                  <p className="text-xs" style={{ color }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Transfer Log Tab ─── */}
      {activeTab === "log" && <TransferLog />}

      {/* ─── Analytics Tab ─── */}
      {activeTab === "analytics" && <AnalyticsTab data={data} />}
    </div>
  );
}
