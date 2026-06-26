"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowLeftRight, X, Loader2, Search, Plus, Minus, AlertTriangle, Info,
  ChevronRight, ChevronLeft, CheckCircle2, Trash2, ShoppingCart, Bookmark, BookmarkPlus, Camera,
} from "lucide-react";
import { Field } from "./ui";
import type { Branch, Product, ToastType } from "@/lib/shops/types";
import {
  type TransferDirection, type TransferPreset,
  loadTransferPresets, saveTransferPreset, deleteTransferPreset,
} from "@/lib/shops/advanced";

const BarcodeScanner = dynamic(() => import("@/components/BarcodeScanner"), { ssr: false });

interface CartItem {
  productId: string;
  quantity: number;
  name: string;
  sku: string | null;
  stockQty: number;
}

interface Props {
  branches: Branch[];
  mainShopName: string;
  defaultBranchId?: string | null;
  defaultDirection?: TransferDirection;
  onClose: () => void;
  onTransferred: () => void;
  showToast: (type: ToastType, msg: string) => void;
}

const ACTIVE_BRANCHES = (branches: Branch[]) => branches.filter(b => b.isActive !== false);

export default function TransferModal({
  branches, mainShopName, defaultBranchId, defaultDirection = "main_to_branch",
  onClose, onTransferred, showToast,
}: Props) {
  const activeBranches = ACTIVE_BRANCHES(branches);
  const [step, setStep] = useState(defaultBranchId ? 2 : 1);
  const [direction, setDirection] = useState<TransferDirection>(defaultDirection);
  const [branchId, setBranchId] = useState(defaultBranchId ?? "");
  const [fromBranchId, setFromBranchId] = useState(defaultBranchId ?? "");
  const [toBranchId, setToBranchId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [branchStock, setBranchStock] = useState<Record<string, number>>({});
  const [loadingProducts, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [note, setNote] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [presets, setPresets] = useState<TransferPreset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const sourceBranchId = direction === "main_to_branch" ? null : fromBranchId;
  const destBranchId = direction === "branch_to_main" ? null : (direction === "branch_to_branch" ? toBranchId : branchId);

  useEffect(() => { setPresets(loadTransferPresets()); }, []);

  useEffect(() => {
    fetch("/api/products?all=1")
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : (Array.isArray(d.products) ? d.products : [])))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const loadFrom = direction === "branch_to_main" ? branchId : direction === "branch_to_branch" ? fromBranchId : null;
    if (!loadFrom) { setBranchStock({}); return; }
    fetch(`/api/shops/${loadFrom}/stock`)
      .then(r => r.ok ? r.json() : { stock: [] })
      .then(d => {
        const map: Record<string, number> = {};
        for (const row of d.stock ?? []) map[row.productId] = row.quantity;
        setBranchStock(map);
      });
  }, [branchId, fromBranchId, direction]);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return (q
      ? products.filter(p => p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q))
      : products
    ).slice(0, 30);
  }, [products, search]);

  function availableQty(product: Product) {
    if (direction === "main_to_branch") return product.stockQty;
    return branchStock[product.id] ?? 0;
  }

  function findProductByCode(code: string) {
    const c = code.trim();
    if (!c) return undefined;
    return products.find(p =>
      (p.sku && p.sku.toLowerCase() === c.toLowerCase()) ||
      p.id === c ||
      p.name.toLowerCase() === c.toLowerCase()
    );
  }

  function handleBarcodeDetected(code: string) {
    setShowScanner(false);
    const product = findProductByCode(code);
    if (!product) {
      showToast("error", `কোড "${code}" এর পণ্য পাওয়া যায়নি`);
      return;
    }
    const avail = availableQty(product);
    if (avail < 1) {
      showToast("error", `${product.name}: স্টক নেই`);
      return;
    }
    addToCart(product);
    showToast("success", `${product.name} cart-এ যোগ ✓`);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const product = findProductByCode(search);
    if (product && availableQty(product) >= 1) {
      e.preventDefault();
      addToCart(product);
    }
  }

  function addToCart(product: Product) {
    const avail = availableQty(product);
    if (avail < 1) return;
    setCart(prev => {
      const existing = prev.find(c => c.productId === product.id);
      if (existing) {
        return prev.map(c => c.productId === product.id
          ? { ...c, quantity: Math.min(c.quantity + 1, avail), stockQty: avail }
          : c);
      }
      return [...prev, { productId: product.id, quantity: 1, name: product.name, sku: product.sku, stockQty: avail }];
    });
    setSearch("");
  }

  function canProceedStep1() {
    if (direction === "main_to_branch") return !!branchId;
    if (direction === "branch_to_main") return !!branchId;
    return !!fromBranchId && !!toBranchId && fromBranchId !== toBranchId;
  }

  function canProceedStep2() {
    return cart.length > 0 && cart.every(c => c.quantity >= 1 && c.quantity <= c.stockQty);
  }

  function applyPreset(p: TransferPreset) {
    setDirection(p.direction);
    setBranchId(p.branchId ?? p.toBranchId ?? "");
    setFromBranchId(p.fromBranchId ?? p.branchId ?? "");
    setToBranchId(p.toBranchId ?? "");
    setNote(p.note ?? "");
    setCart(p.items.map(i => {
      const prod = products.find(x => x.id === i.productId);
      return {
        productId: i.productId,
        quantity: i.quantity,
        name: i.productName,
        sku: prod?.sku ?? null,
        stockQty: prod?.stockQty ?? i.quantity,
      };
    }));
    setStep(2);
  }

  function handleSavePreset() {
    if (!presetName.trim() || cart.length === 0) return;
    saveTransferPreset({
      name: presetName.trim(),
      direction,
      branchId: direction !== "branch_to_branch" ? branchId : undefined,
      fromBranchId: direction !== "main_to_branch" ? (direction === "branch_to_branch" ? fromBranchId : branchId) : undefined,
      toBranchId: direction !== "branch_to_main" ? (direction === "branch_to_branch" ? toBranchId : branchId) : undefined,
      items: cart.map(c => ({ productId: c.productId, productName: c.name, quantity: c.quantity })),
      note,
    });
    setPresets(loadTransferPresets());
    setPresetName("");
    showToast("success", "Preset সেভ হয়েছে ✓");
  }

  async function doTransfer() {
    if (!canProceedStep2()) return;
    setTransferring(true);
    const payload: Record<string, unknown> = {
      direction, note,
      items: cart.map(c => ({ productId: c.productId, quantity: c.quantity })),
    };
    if (direction === "main_to_branch") payload.toBranchId = branchId;
    else if (direction === "branch_to_main") payload.fromBranchId = branchId;
    else { payload.fromBranchId = fromBranchId; payload.toBranchId = toBranchId; }

    const res = await fetch("/api/shops/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await res.json();
    setTransferring(false);
    if (!res.ok) { showToast("error", d.error ?? "সমস্যা হয়েছে"); return; }
    showToast("success", d.message ?? "Transfer সফল! ✓");
    onTransferred();
  }

  const steps = ["Route", "পণ্য", "নিশ্চিত"];

  const routeLabel = () => {
    if (direction === "main_to_branch") return `${mainShopName} → ${activeBranches.find(b => b.id === branchId)?.name ?? "Branch"}`;
    if (direction === "branch_to_main") return `${activeBranches.find(b => b.id === branchId)?.name ?? "Branch"} → ${mainShopName}`;
    return `${activeBranches.find(b => b.id === fromBranchId)?.name ?? "?"} → ${activeBranches.find(b => b.id === toBranchId)?.name ?? "?"}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "var(--c-surface)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#3B82F6,#2563EB)" }}>
              <ArrowLeftRight size={16} color="#fff" />
            </div>
            <div>
              <h3 className="font-black" style={{ color: "var(--c-text)" }}>Stock Transfer</h3>
              <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>ধাপ {step}/৩ — {steps[step - 1]}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl" style={{ color: "var(--c-text-muted)" }}><X size={16} /></button>
        </div>

        <div className="flex gap-1 mb-5">
          {steps.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full" style={{ backgroundColor: step > i ? "#3B82F6" : "var(--c-border)" }} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {([
                { key: "main_to_branch" as const, label: "মূল → Branch" },
                { key: "branch_to_main" as const, label: "Branch → মূল" },
                { key: "branch_to_branch" as const, label: "Branch → Branch" },
              ]).map(opt => (
                <button key={opt.key} onClick={() => { setDirection(opt.key); setCart([]); setStep(1); }}
                  className="py-2 rounded-xl text-[10px] sm:text-xs font-bold border transition-all"
                  style={{
                    borderColor: direction === opt.key ? "#3B82F6" : "var(--c-border)",
                    backgroundColor: direction === opt.key ? "#EFF6FF" : "var(--c-bg)",
                    color: direction === opt.key ? "#2563EB" : "var(--c-text-sub)",
                  }}
                >{opt.label}</button>
              ))}
            </div>

            {direction === "branch_to_branch" ? (
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-2" style={{ color: "var(--c-text-muted)" }}>উৎস Branch</label>
                  <select value={fromBranchId} onChange={e => { setFromBranchId(e.target.value); setCart([]); }}
                    className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                    style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}>
                    <option value="">বেছে নিন</option>
                    {activeBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-2" style={{ color: "var(--c-text-muted)" }}>গন্তব্য Branch</label>
                  <select value={toBranchId} onChange={e => setToBranchId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                    style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}>
                    <option value="">বেছে নিন</option>
                    {activeBranches.filter(b => b.id !== fromBranchId).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold block mb-2" style={{ color: "var(--c-text-muted)" }}>Branch *</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activeBranches.map(b => (
                    <button key={b.id} onClick={() => { setBranchId(b.id); setFromBranchId(b.id); setCart([]); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border text-left"
                      style={{
                        borderColor: branchId === b.id ? "#7C3AED" : "var(--c-border)",
                        backgroundColor: branchId === b.id ? "#EDE9FE" : "var(--c-bg)",
                      }}
                    >
                      <span className="text-sm font-bold flex-1" style={{ color: "var(--c-text)" }}>{b.name}</span>
                      {branchId === b.id && <CheckCircle2 size={16} style={{ color: "#7C3AED" }} />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {canProceedStep1() && (
              <div className="p-3 rounded-xl text-center text-xs font-bold" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>
                {routeLabel()}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {presets.length > 0 && (
              <div className="rounded-xl border p-3" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)" }}>
                <p className="text-[10px] font-bold mb-2 flex items-center gap-1" style={{ color: "var(--c-text-muted)" }}>
                  <Bookmark size={11} /> Saved Presets
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map(p => (
                    <div key={p.id} className="flex items-center gap-1">
                      <button onClick={() => applyPreset(p)}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg"
                        style={{ backgroundColor: "#EDE9FE", color: "#7C3AED" }}>{p.name}</button>
                      <button onClick={() => { deleteTransferPreset(p.id); setPresets(loadTransferPresets()); }}
                        className="text-[10px] px-1" style={{ color: "#EF4444" }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cart.length > 0 && (
              <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)" }}>
                <div className="flex items-center gap-2"><ShoppingCart size={14} style={{ color: "#3B82F6" }} /><span className="text-xs font-bold">{cart.length}টি পণ্য</span></div>
                {cart.map(item => (
                  <div key={item.productId} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0"><p className="text-xs font-semibold truncate">{item.name}</p></div>
                    <button onClick={() => setCart(p => p.map(c => c.productId === item.productId ? { ...c, quantity: Math.max(1, c.quantity - 1) } : c))}
                      className="w-7 h-7 rounded-lg border flex items-center justify-center" style={{ borderColor: "var(--c-border)" }}><Minus size={12} /></button>
                    <input type="number" min={1} max={item.stockQty} value={item.quantity}
                      onChange={e => setCart(p => p.map(c => c.productId === item.productId ? { ...c, quantity: Math.min(item.stockQty, Math.max(1, parseInt(e.target.value) || 1)) } : c))}
                      className="w-12 h-7 text-center rounded-lg border text-xs font-bold outline-none" style={{ borderColor: "var(--c-border)" }} />
                    <button onClick={() => setCart(p => p.filter(c => c.productId !== item.productId))} style={{ color: "#EF4444" }}><Trash2 size={12} /></button>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <input value={presetName} onChange={e => setPresetName(e.target.value)} placeholder="Preset নাম…"
                    className="flex-1 h-8 px-2 rounded-lg border text-xs outline-none" style={{ borderColor: "var(--c-border)" }} />
                  <button onClick={handleSavePreset} disabled={!presetName.trim()}
                    className="flex items-center gap-1 px-2 h-8 rounded-lg text-[10px] font-bold disabled:opacity-50"
                    style={{ backgroundColor: "#FEF3C7", color: "#B45309" }}>
                    <BookmarkPlus size={12} /> সেভ
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }} />
                <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleSearchKeyDown}
                  placeholder="পণ্য বা SKU স্ক্যান…"
                  className="w-full h-9 pl-8 pr-3 rounded-xl border text-xs outline-none"
                  style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }} />
              </div>
              <button type="button" onClick={() => setShowScanner(true)}
                className="h-9 px-3 rounded-xl border flex items-center gap-1 text-[10px] font-bold flex-shrink-0"
                style={{ borderColor: "var(--c-border)", color: "#2563EB", backgroundColor: "#EFF6FF" }}>
                <Camera size={14} /> Scan
              </button>
            </div>

            {showScanner && (
              <BarcodeScanner
                onDetected={handleBarcodeDetected}
                onClose={() => setShowScanner(false)}
              />
            )}

            {loadingProducts ? (
              <div className="py-8 flex justify-center"><Loader2 size={24} className="animate-spin" style={{ color: "var(--c-text-muted)" }} /></div>
            ) : (
              <div className="rounded-xl border overflow-hidden max-h-48 overflow-y-auto" style={{ borderColor: "var(--c-border)" }}>
                {filteredProducts.map(pr => {
                  const avail = availableQty(pr);
                  return (
                    <button key={pr.id} onClick={() => addToCart(pr)} disabled={avail < 1}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-left border-b last:border-0 disabled:opacity-40"
                      style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}>
                      <span className="font-semibold">{pr.name}</span>
                      <span className={`font-bold px-2 py-0.5 rounded-lg text-[10px] ${avail < 5 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>{avail} টি</span>
                    </button>
                  );
                })}
              </div>
            )}

            <Field label="নোট (ঐচ্ছিক)" value={note} onChange={setNote} placeholder="যেমন: ঈদ স্টক…" />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
              <p className="text-xs font-bold mb-2" style={{ color: "#1D4ED8" }}>{routeLabel()}</p>
              {cart.map(c => (
                <div key={c.productId} className="flex justify-between text-xs mb-1">
                  <span>{c.name}</span><span className="font-black" style={{ color: "#3B82F6" }}>{c.quantity} pcs</span>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}>
              <Info size={13} style={{ color: "#D97706", flexShrink: 0, marginTop: 1 }} />
              <p className="text-xs" style={{ color: "#92400E" }}>Confirm করলে স্টক স্থানান্তরিত হবে এবং log-এ record থাকবে।</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-5">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1 px-4 py-2.5 rounded-xl border text-sm font-medium"
              style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}><ChevronLeft size={14} /> পেছন</button>
          ) : (
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
              style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}>বাতিল</button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={(step === 1 && !canProceedStep1()) || (step === 2 && !canProceedStep2())}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1"
              style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)" }}>
              পরবর্তী <ChevronRight size={14} />
            </button>
          ) : (
            <button onClick={doTransfer} disabled={transferring || !canProceedStep2()}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #0F6E56, #10B981)" }}>
              {transferring ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {transferring ? "হচ্ছে..." : "Transfer নিশ্চিত"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
