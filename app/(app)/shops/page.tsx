"use client";

import { useEffect, useState } from "react";
import { Store, Plus, ArrowRight, Crown, X, Loader2, Trash2, Phone, MapPin, ArrowLeftRight } from "lucide-react";
import Link from "next/link";

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)", bg: "var(--c-bg)" };

interface Branch { id: string; name: string; category: string | null; phone: string | null; address: string | null; }
interface MainShop { id: string; name: string; category: string | null; phone: string | null; address: string | null; }
interface ShopData { mainShop: MainShop; branches: Branch[]; maxShops: number; totalShops: number; }
interface Product { id: string; name: string; stockQty: number; }

export default function ShopsPage() {
  const [data, setData] = useState<ShopData | null>(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", category: "", phone: "", address: "" });
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Transfer state
  const [showTransfer, setShowTransfer] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [transfer, setTransfer] = useState({ productId: "", toBranchId: "", quantity: 1, note: "" });
  const [transferring, setTransferring] = useState(false);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  function load() {
    setLoading(true);
    fetch("/api/shops")
      .then(r => r.json())
      .then(d => {
        if (d.locked) { setLocked(true); return; }
        setData(d);
      })
      .finally(() => setLoading(false));
  }

  function loadProducts() {
    fetch("/api/products?limit=200")
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d.products) ? d.products : []));
  }

  useEffect(() => { load(); }, []);

  function openTransfer() {
    loadProducts();
    setTransfer({ productId: "", toBranchId: "", quantity: 1, note: "" });
    setShowTransfer(true);
  }

  async function createBranch() {
    if (!form.name.trim()) { showToast("error", "শপের নাম দিন"); return; }
    setCreating(true);
    const res = await fetch("/api/shops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    setCreating(false);
    if (!res.ok) { showToast("error", d.error ?? "সমস্যা হয়েছে"); return; }
    showToast("success", "নতুন শপ তৈরি হয়েছে!");
    setShowModal(false);
    setForm({ name: "", category: "", phone: "", address: "" });
    load();
  }

  async function deleteBranch(branchId: string) {
    if (!confirm("এই শপটি মুছে ফেলতে চান?")) return;
    setDeleting(branchId);
    const res = await fetch(`/api/shops?branchId=${branchId}`, { method: "DELETE" });
    setDeleting(null);
    if (!res.ok) { showToast("error", "মুছতে সমস্যা হয়েছে"); return; }
    showToast("success", "শপ মুছে ফেলা হয়েছে");
    load();
  }

  async function doTransfer() {
    if (!transfer.productId) { showToast("error", "পণ্য নির্বাচন করুন"); return; }
    if (!transfer.toBranchId) { showToast("error", "শাখা নির্বাচন করুন"); return; }
    if (transfer.quantity < 1) { showToast("error", "পরিমাণ দিন"); return; }
    setTransferring(true);
    const res = await fetch("/api/shops/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transfer),
    });
    const d = await res.json();
    setTransferring(false);
    if (!res.ok) { showToast("error", d.error ?? "সমস্যা হয়েছে"); return; }
    showToast("success", d.message ?? "Transfer সফল!");
    setShowTransfer(false);
  }

  if (loading) return (
    <div className="animate-pulse max-w-xl space-y-4">
      <div className="h-8 w-48 rounded-xl bg-gray-100" />
      <div className="h-32 rounded-2xl bg-gray-100" />
      <div className="h-32 rounded-2xl bg-gray-100" />
    </div>
  );

  if (locked) return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>Multi-Shop</h1>
          <p className="text-sm mt-0.5" style={{ color: S.muted }}>একটি account দিয়ে একাধিক শপ চালান</p>
        </div>
      </div>
      <div className="rounded-2xl border p-8 text-center" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#F0FBF6" }}>
          <Store size={28} style={{ color: S.primary }} />
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: S.text }}>Business Plan প্রয়োজন</h2>
        <p className="text-sm mb-6" style={{ color: S.secondary }}>
          Multi-Shop শুধুমাত্র Business Plan-এ পাওয়া যায়। একটি account দিয়ে সর্বোচ্চ ৩টি আলাদা শপ পরিচালনা করুন।
        </p>
        <div className="space-y-2 text-left rounded-2xl p-4 mb-6" style={{ backgroundColor: S.bg }}>
          {["একটি account — একাধিক Facebook Page / ব্যবসা", "প্রতিটি শপের contact info আলাদাভাবে সংরক্ষণ করা যাবে", "Branch-এ stock transfer করুন", "Consolidated P&L রিপোর্ট সব শপের জন্য"].map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-sm" style={{ color: S.text }}>
              <span className="flex-shrink-0 mt-0.5" style={{ color: S.primary }}>✓</span> {f}
            </div>
          ))}
        </div>
        <Link href="/settings?tab=subscription" className="block w-full py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2" style={{ backgroundColor: S.primary }}>
          <Crown size={16} /> Business Plan-এ Upgrade করুন
        </Link>
      </div>
    </div>
  );

  const canAdd = data ? data.totalShops < data.maxShops : false;
  const hasBranches = (data?.branches.length ?? 0) > 0;

  return (
    <div className="max-w-xl space-y-5">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg" style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>{toast.msg}</div>}

      {/* Create Branch Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 max-w-sm w-full" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg" style={{ color: S.text }}>নতুন শপ যোগ করুন</h3>
              <button onClick={() => setShowModal(false)}><X size={20} style={{ color: S.muted }} /></button>
            </div>
            <div className="space-y-3">
              {[
                { key: "name", label: "শপের নাম *", placeholder: "যেমন: রিনার বুটিক ২", type: "text" },
                { key: "phone", label: "ফোন নম্বর", placeholder: "01XXXXXXXXX", type: "tel" },
                { key: "address", label: "ঠিকানা", placeholder: "যেমন: Uttara, Dhaka", type: "text" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: S.text }}>{f.label}</label>
                  <input type={f.type} value={form[f.key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full h-10 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: S.text }}>ক্যাটাগরি</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                  <option value="">নির্বাচন করুন</option>
                  {["পোশাক", "জুয়েলারি", "খাবার", "সৌন্দর্য", "গৃহস্থালি", "ইলেকট্রনিক্স", "অন্যান্য"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.secondary }}>বাতিল</button>
              <button onClick={createBranch} disabled={creating} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2" style={{ backgroundColor: S.primary }}>
                {creating ? <><Loader2 size={14} className="animate-spin" /> তৈরি হচ্ছে...</> : "শপ তৈরি করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 max-w-sm w-full" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg" style={{ color: S.text }}>Stock Transfer</h3>
              <button onClick={() => setShowTransfer(false)}><X size={20} style={{ color: S.muted }} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: S.text }}>পণ্য নির্বাচন করুন *</label>
                <select value={transfer.productId} onChange={e => setTransfer(p => ({ ...p, productId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                  <option value="">পণ্য বেছে নিন</option>
                  {products.map(pr => (
                    <option key={pr.id} value={pr.id}>{pr.name} (স্টক: {pr.stockQty})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: S.text }}>প্রাপক শাখা *</label>
                <select value={transfer.toBranchId} onChange={e => setTransfer(p => ({ ...p, toBranchId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                  <option value="">শাখা বেছে নিন</option>
                  {data?.branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: S.text }}>পরিমাণ *</label>
                <input type="number" min={1} value={transfer.quantity} onChange={e => setTransfer(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: S.text }}>নোট (ঐচ্ছিক)</label>
                <input type="text" value={transfer.note} onChange={e => setTransfer(p => ({ ...p, note: e.target.value }))}
                  placeholder="যেমন: Eid stock" className="w-full h-10 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
              </div>
              <div className="rounded-xl p-3 text-xs" style={{ backgroundColor: "#FFF8E7", border: "1px solid #FDE68A" }}>
                <p style={{ color: "#92600A" }}>মূল shop-এর স্টক থেকে পণ্য কাটা হবে এবং branch transfer হিসেবে রেকর্ড হবে।</p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowTransfer(false)} className="flex-1 py-2.5 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.secondary }}>বাতিল</button>
              <button onClick={doTransfer} disabled={transferring} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2" style={{ backgroundColor: S.primary }}>
                {transferring ? <><Loader2 size={14} className="animate-spin" /> Transfer হচ্ছে...</> : <><ArrowLeftRight size={14} /> Transfer করুন</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>Multi-Shop</h1>
          <p className="text-sm mt-0.5" style={{ color: S.muted }}>
            {data?.totalShops ?? 0}/{data?.maxShops ?? 3} শপ ব্যবহার হচ্ছে
          </p>
        </div>
        <div className="flex gap-2">
          {hasBranches && (
            <button onClick={openTransfer} className="h-10 px-4 rounded-xl border text-sm font-medium flex items-center gap-2" style={{ borderColor: S.border, color: S.text }}>
              <ArrowLeftRight size={15} /> Stock Transfer
            </button>
          )}
          {canAdd && (
            <button onClick={() => setShowModal(true)} className="h-10 px-4 rounded-xl text-white text-sm font-medium flex items-center gap-2" style={{ backgroundColor: S.primary }}>
              <Plus size={15} /> নতুন শপ
            </button>
          )}
        </div>
      </div>

      {/* Main shop */}
      {data?.mainShop && (
        <div className="rounded-2xl p-5" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F0FBF6" }}>
              <Store size={20} style={{ color: S.primary }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold" style={{ color: S.text }}>{data.mainShop.name}</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}>Main</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: S.muted }}>
                {data.mainShop.category && <span>{data.mainShop.category}</span>}
                {data.mainShop.phone && <span className="flex items-center gap-1"><Phone size={10} />{data.mainShop.phone}</span>}
                {data.mainShop.address && <span className="flex items-center gap-1"><MapPin size={10} />{data.mainShop.address}</span>}
              </div>
            </div>
            <Link href="/settings?tab=shop" className="flex items-center gap-1 text-sm flex-shrink-0" style={{ color: S.primary }}>
              সেটিংস <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Branch shops */}
      {data?.branches.map((branch) => (
        <div key={branch.id} className="rounded-2xl p-5" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F7F3FF" }}>
              <Store size={20} style={{ color: "#7C3AED" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold" style={{ color: S.text }}>{branch.name}</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#F0E8FF", color: "#7C3AED" }}>Branch</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: S.muted }}>
                {branch.category && <span>{branch.category}</span>}
                {branch.phone && <span className="flex items-center gap-1"><Phone size={10} />{branch.phone}</span>}
                {branch.address && <span className="flex items-center gap-1"><MapPin size={10} />{branch.address}</span>}
              </div>
            </div>
            <button onClick={() => deleteBranch(branch.id)} disabled={deleting === branch.id}
              className="flex-shrink-0 p-2 rounded-xl hover:bg-red-50 transition-colors">
              {deleting === branch.id
                ? <Loader2 size={15} className="animate-spin" style={{ color: S.muted }} />
                : <Trash2 size={15} style={{ color: "#E24B4A" }} />}
            </button>
          </div>
        </div>
      ))}

      {!canAdd && data && data.totalShops >= data.maxShops && (
        <div className="rounded-2xl p-4 text-sm" style={{ backgroundColor: "#FFF8E7", border: "1px solid #FDE68A" }}>
          <p style={{ color: "#92600A" }}>আপনার Business Plan-এ সর্বোচ্চ <strong>{data.maxShops}টি</strong> শপ রাখা যাবে।</p>
        </div>
      )}

      <div className="rounded-2xl p-5" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
        <h3 className="font-semibold text-sm mb-3" style={{ color: S.text }}>Multi-Shop কীভাবে কাজ করে</h3>
        <div className="space-y-2">
          {[
            "Branch শপগুলো আপনার মূল account-এর সাথে যুক্ত থাকবে",
            "Stock Transfer বাটন দিয়ে মূল শপ থেকে branch-এ পণ্য পাঠান",
            "একই dashboard থেকে সব শপ পরিচালনা করুন",
            "Reports-এ সব branch-এর consolidated P&L দেখুন",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm" style={{ color: S.secondary }}>
              <span className="mt-0.5 flex-shrink-0" style={{ color: S.primary }}>✓</span>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
