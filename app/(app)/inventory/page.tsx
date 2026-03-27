"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Pencil, Trash2, Camera, Upload, FileDown, Sliders, X, Check, Sparkles, Loader2, AlertTriangle, ChevronDown, ChevronUp, Package } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import dynamic from "next/dynamic";
import Papa from "papaparse";
import { downloadExcel } from "@/lib/excel";

const BarcodeScanner = dynamic(() => import("@/components/BarcodeScanner"), { ssr: false });

interface Product {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  buyPrice: number;
  sellPrice: number;
  stockQty: number;
  lowStockAt: number;
  imageUrl: string | null;
  hasVariants?: boolean;
}

interface CsvRow { name: string; buyPrice: string; sellPrice: string; stockQty: string; category: string; sku?: string; }

interface Category {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
}

interface ComboProduct {
  id: string;
  name: string;
  description: string | null;
  sellPrice: number;
  isActive: boolean;
  availableStock: number;
  items: { id: string; quantity: number; product: { id: string; name: string; stockQty: number } }[];
}

function StockBadge({ p }: { p: Product }) {
  if (p.stockQty === 0)
    return <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--status-returned-bg)", color: "var(--status-returned-text)" }}>শেষ</span>;
  if (p.stockQty <= p.lowStockAt)
    return <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--status-pending-bg)", color: "var(--status-pending-text)" }}>কম</span>;
  return <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--status-delivered-bg)", color: "var(--status-delivered-text)" }}>ভালো</span>;
}

export default function InventoryPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [combos, setCombos] = useState<ComboProduct[]>([]);
  const [combosLoading, setCombosLoading] = useState(false);
  const [deleteComboId, setDeleteComboId] = useState<string | null>(null);
  const [deletingCombo, setDeletingCombo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [tab, setTab] = useState(searchParams.get("tab") ?? "all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [adjProduct, setAdjProduct] = useState<Product | null>(null);
  const [adjType, setAdjType] = useState<"in" | "out">("in");
  const [adjQty, setAdjQty] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [adjSaving, setAdjSaving] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiPredLoading, setAiPredLoading] = useState(false);
  const [aiPredData, setAiPredData] = useState<{ predictions: Array<{ productName: string; currentStock: number; daysUntilStockout: number; urgency: "urgent" | "warning" | "ok"; action: string }>; summary: string; cached?: boolean } | null>(null);

  async function fetchAiPrediction() {
    setAiPredLoading(true);
    try {
      const r = await fetch("/api/ai/inventory-prediction");
      const d = await r.json();
      if (r.ok) { setAiPredData(d); setShowAiPanel(true); }
      else showToast("error", d.error ?? "AI prediction পাওয়া যায়নি।");
    } catch {
      showToast("error", "সংযোগ সমস্যা।");
    }
    setAiPredLoading(false);
  }

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function fetchProducts() {
    const r = await fetch("/api/products");
    const data = await r.json();
    setProducts(data);
    setLoading(false);
  }

  useEffect(() => {
    // Fetch categories
    fetch("/api/categories")
      .then(r => r.json())
      .then(data => setCategories(data))
      .catch(() => {});
  }, []);

  async function fetchCombos() {
    setCombosLoading(true);
    const r = await fetch("/api/combos");
    const data = await r.json();
    setCombos(Array.isArray(data) ? data : []);
    setCombosLoading(false);
  }

  async function handleDeleteCombo() {
    if (!deleteComboId) return;
    setDeletingCombo(true);
    const r = await fetch(`/api/combos/${deleteComboId}`, { method: "DELETE" });
    setDeletingCombo(false);
    setDeleteComboId(null);
    if (r.ok) { showToast("success", "কমবো মুছে ফেলা হয়েছে।"); fetchCombos(); }
    else showToast("error", "মুছতে ব্যর্থ হয়েছে।");
  }

  async function toggleComboActive(id: string, isActive: boolean) {
    const r = await fetch(`/api/combos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (r.ok) fetchCombos();
  }

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    if (tab === "combos") fetchCombos();
  }, [tab]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const r = await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    if (r.ok) {
      setProducts((p) => p.filter((x) => x.id !== deleteId));
      showToast("success", "পণ্য মুছে দেওয়া হয়েছে ✓");
    } else {
      showToast("error", "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    }
  }

  async function saveStockAdj() {
    if (!adjProduct || !adjQty || Number(adjQty) <= 0) return;
    setAdjSaving(true);
    const r = await fetch("/api/stock-movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: adjProduct.id, type: adjType, quantity: Number(adjQty), reason: adjReason || `Manual ${adjType === "in" ? "stock in" : "stock out"}` }),
    });
    setAdjSaving(false);
    if (r.ok) {
      const delta = adjType === "in" ? Number(adjQty) : -Number(adjQty);
      setProducts(ps => ps.map(p => p.id === adjProduct.id ? { ...p, stockQty: p.stockQty + delta } : p));
      showToast("success", `স্টক ${adjType === "in" ? "যোগ" : "কমানো"} হয়েছে ✓`);
      setAdjProduct(null); setAdjQty(""); setAdjReason("");
    } else {
      showToast("error", "স্টক আপডেট করা যায়নি।");
    }
  }

  function handleBarcodeDetected(code: string) {
    setShowScanner(false);
    const match = products.find((p) => p.sku === code || p.name.toLowerCase() === code.toLowerCase());
    if (match) {
      setHighlightId(match.id);
      setSearch("");
      setTab("all");
      setTimeout(() => setHighlightId(null), 3000);
      showToast("success", `পণ্য পাওয়া গেছে: ${match.name}`);
    } else {
      showToast("error", `SKU "${code}" এর কোনো পণ্য পাওয়া যায়নি।`);
    }
  }

  function downloadTemplate() {
    const csv = "নাম,ক্রয় মূল্য,বিক্রয় মূল্য,স্টক,ক্যাটাগরি,SKU\nশার্ট,300,500,20,পোশাক,PRD-001\n";
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data.slice(1).map((row) => ({
          name: row[0] ?? "",
          buyPrice: row[1] ?? "0",
          sellPrice: row[2] ?? "0",
          stockQty: row[3] ?? "0",
          category: row[4] ?? "",
          sku: row[5] ?? "",
        })).filter((r) => r.name.trim());
        setCsvRows(rows);
      },
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  async function importCsv() {
    if (csvRows.length === 0) return;
    setImporting(true);
    const r = await fetch("/api/products/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: csvRows }),
    });
    const d = await r.json();
    setImporting(false);
    if (r.ok) {
      showToast("success", `${d.count}টি পণ্য import হয়েছে ✓`);
      setCsvRows([]);
      setShowCsvModal(false);
      fetchProducts();
    } else {
      showToast("error", "Import করা যায়নি। আবার চেষ্টা করুন।");
    }
  }

  const filtered = products
    .filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? "").toLowerCase().includes(search.toLowerCase())
    )
    .filter((p) => {
      if (categoryFilter) return p.category === categoryFilter;
      return true;
    })
    .filter((p) => {
      if (tab === "low") return p.stockQty > 0 && p.stockQty <= p.lowStockAt;
      if (tab === "out") return p.stockQty === 0;
      return true;
    });

  const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)" };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      {showScanner && (
        <BarcodeScanner onDetected={handleBarcodeDetected} onClose={() => setShowScanner(false)} />
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 max-w-lg w-full max-h-[80vh] flex flex-col" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg" style={{ color: S.text }}>Excel থেকে Import করুন</h3>
              <button onClick={() => { setShowCsvModal(false); setCsvRows([]); }} className="text-sm" style={{ color: S.muted }}>✕ বন্ধ</button>
            </div>

            {csvRows.length === 0 ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-xl p-8 text-center" style={{ borderColor: S.border }}>
                  <Upload size={28} className="mx-auto mb-3" style={{ color: S.muted }} />
                  <p className="text-sm font-medium mb-1" style={{ color: S.text }}>CSV ফাইল বেছে নিন</p>
                  <p className="text-xs mb-4" style={{ color: S.muted }}>Excel থেকে CSV হিসেবে save করে upload করুন</p>
                  <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCsvFile} />
                  <button onClick={() => fileRef.current?.click()}
                    className="px-4 py-2 rounded-xl text-sm font-medium border"
                    style={{ borderColor: S.border, color: S.primary }}>
                    ফাইল বেছে নিন
                  </button>
                </div>
                <button onClick={downloadTemplate}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium"
                  style={{ borderColor: S.border, color: S.secondary }}>
                  <FileDown size={15} /> Template CSV Download করুন
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm mb-3" style={{ color: S.secondary }}>{csvRows.length}টি পণ্য পাওয়া গেছে। Review করুন:</p>
                <div className="overflow-auto flex-1 rounded-xl border" style={{ borderColor: S.border }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ backgroundColor: "var(--c-surface)", borderBottom: `1px solid ${S.border}` }}>
                        {["নাম", "ক্রয়", "বিক্রয়", "স্টক", "ক্যাটাগরি", "SKU"].map(h => (
                          <th key={h} className="text-left px-3 py-2 font-semibold" style={{ color: S.muted }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.map((row, i) => (
                        <tr key={i} className="border-b last:border-0" style={{ borderColor: S.border }}>
                          <td className="px-3 py-2 font-medium" style={{ color: S.text }}>{row.name || "—"}</td>
                          <td className="px-3 py-2" style={{ color: S.secondary }}>৳{row.buyPrice}</td>
                          <td className="px-3 py-2" style={{ color: S.secondary }}>৳{row.sellPrice}</td>
                          <td className="px-3 py-2" style={{ color: S.secondary }}>{row.stockQty}</td>
                          <td className="px-3 py-2" style={{ color: S.secondary }}>{row.category || "—"}</td>
                          <td className="px-3 py-2" style={{ color: S.secondary }}>{row.sku || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setCsvRows([])} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.text }}>
                    বাতিল
                  </button>
                  <button onClick={importCsv} disabled={importing}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60"
                    style={{ backgroundColor: S.primary }}>
                    {importing ? "Import হচ্ছে..." : `${csvRows.length}টি Import করুন`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 max-w-sm w-full" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-base" style={{ color: S.text }}>স্টক সামঞ্জস্য</h3>
                <p className="text-xs mt-0.5" style={{ color: S.muted }}>{adjProduct.name} · বর্তমান: {adjProduct.stockQty}টি</p>
              </div>
              <button onClick={() => { setAdjProduct(null); setAdjQty(""); setAdjReason(""); }} style={{ color: S.muted }}>
                <X size={18} />
              </button>
            </div>
            {/* In/Out toggle */}
            <div className="flex gap-2 mb-4">
              {(["in", "out"] as const).map((t) => (
                <button key={t} onClick={() => setAdjType(t)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium border transition-colors"
                  style={adjType === t
                    ? { backgroundColor: t === "in" ? "var(--c-primary)" : "#E24B4A", color: "#fff", borderColor: "transparent" }
                    : { backgroundColor: S.surface, color: S.secondary, borderColor: S.border }}>
                  {t === "in" ? "+ স্টক যোগ" : "− স্টক বাদ"}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.secondary }}>পরিমাণ *</label>
                <input
                  type="number"
                  min="1"
                  value={adjQty}
                  onChange={e => setAdjQty(e.target.value)}
                  placeholder="কতটি?"
                  style={{ width: "100%", height: "40px", border: `1px solid ${S.border}`, borderRadius: "8px", backgroundColor: S.surface, color: S.text, padding: "0 12px", fontSize: "14px", outline: "none" }}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.secondary }}>কারণ</label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={e => setAdjReason(e.target.value)}
                  placeholder="যেমন: ক্ষতি, নতুন মাল আসলো..."
                  style={{ width: "100%", height: "40px", border: `1px solid ${S.border}`, borderRadius: "8px", backgroundColor: S.surface, color: S.text, padding: "0 12px", fontSize: "14px", outline: "none" }}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => { setAdjProduct(null); setAdjQty(""); setAdjReason(""); }}
                className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
                style={{ borderColor: S.border, color: S.text }}>
                বাতিল
              </button>
              <button onClick={saveStockAdj} disabled={adjSaving || !adjQty || Number(adjQty) <= 0}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: adjType === "in" ? "var(--c-primary)" : "#E24B4A" }}>
                <Check size={14} />
                {adjSaving ? "সেভ হচ্ছে..." : "সেভ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 max-w-sm w-full" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <h3 className="font-semibold text-lg mb-2" style={{ color: S.text }}>আপনি কি নিশ্চিত?</h3>
            <p className="text-sm mb-6" style={{ color: S.secondary }}>এই কাজ undo করা যাবে না।</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: "#E24B4A" }}>
                {deleting ? "মুছছে..." : "মুছে দিন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)" }}>
            <Package size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>ইনভেন্টরি</h1>
            <p className="text-xs" style={{ color: S.muted }}>পণ্যের স্টক ও মূল্য ব্যবস্থাপনা করুন</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAiPrediction} disabled={aiPredLoading}
            className="flex items-center gap-1.5 px-3 h-10 rounded-xl border text-sm font-medium flex-shrink-0 hover:bg-gray-50 transition-colors disabled:opacity-60"
            style={{ borderColor: S.border, color: S.primary }}>
            {aiPredLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            AI Prediction
          </button>
            {tab === "combos" ? (
            <Link href="/inventory/combos/new" className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-semibold flex-shrink-0" style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
              <Plus size={16} /> কমবো যোগ করুন
            </Link>
          ) : (
            <Link href="/inventory/new" className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-semibold flex-shrink-0" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
              <Plus size={16} /> পণ্য যোগ করুন
            </Link>
          )}
        </div>
      </div>

      {/* AI Prediction Panel */}
      {aiPredData && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--c-primary-light)", backgroundColor: "var(--bg-success-soft)" }}>
          <button onClick={() => setShowAiPanel(p => !p)}
            className="w-full flex items-center justify-between px-5 py-3 text-left"
            style={{ backgroundColor: "var(--c-primary-light)" }}>
            <div className="flex items-center gap-2">
              <Sparkles size={15} style={{ color: S.primary }} />
              <span className="text-sm font-semibold" style={{ color: S.primary }}>AI স্টক পূর্বাভাস</span>
              {aiPredData.cached && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--c-primary-light)", color: S.primary }}>ক্যাশ</span>}
            </div>
            {showAiPanel ? <ChevronUp size={16} style={{ color: S.primary }} /> : <ChevronDown size={16} style={{ color: S.primary }} />}
          </button>
          {showAiPanel && (
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm" style={{ color: S.secondary }}>{aiPredData.summary}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {aiPredData.predictions.filter(p => p.urgency !== "ok").map((p, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl border"
                    style={{
                      backgroundColor: p.urgency === "urgent" ? "var(--bg-danger-soft)" : "var(--bg-warning-soft)",
                      borderColor: p.urgency === "urgent" ? "var(--status-returned-bg)" : "var(--status-pending-bg)",
                    }}>
                    <AlertTriangle size={14} style={{ color: p.urgency === "urgent" ? "var(--bg-danger-text)" : "var(--bg-warning-text)", flexShrink: 0, marginTop: 2 }} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: p.urgency === "urgent" ? "var(--bg-danger-text)" : "var(--bg-warning-text)" }}>{p.productName}</p>
                      <p className="text-xs" style={{ color: p.urgency === "urgent" ? "var(--bg-danger-text)" : "var(--bg-warning-text)" }}>{p.daysUntilStockout}দিনে শেষ · {p.action}</p>
                    </div>
                  </div>
                ))}
              </div>
              {aiPredData.predictions.every(p => p.urgency === "ok") && (
                <p className="text-sm text-center py-2" style={{ color: S.primary }}>সব পণ্যের স্টক ভালো আছে ✓</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search + Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input
            type="text"
            placeholder="পণ্য বা SKU খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 h-10 rounded-xl border text-sm outline-none"
            style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border text-sm outline-none"
          style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
        >
          <option value="">সব ক্যাটাগরি</option>
          {categories.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
        <button onClick={() => setShowScanner(true)}
          className="flex items-center gap-2 px-3 h-10 rounded-xl border text-sm font-medium flex-shrink-0 hover:bg-gray-50 transition-colors"
          style={{ borderColor: S.border, color: S.secondary }}>
          <Camera size={15} /> Barcode Scan
        </button>
        <button onClick={() => {
          const rows = products.map(p => ({ নাম: p.name, SKU: p.sku ?? "", "ক্রয়মূল্য (৳)": p.buyPrice, "বিক্রয়মূল্য (৳)": p.sellPrice, "স্টক": p.stockQty, "ক্যাটাগরি": p.category ?? "" }));
          downloadExcel(rows, "inventory.xlsx", "পণ্য");
        }} className="flex items-center gap-2 px-3 h-10 rounded-xl border text-sm font-medium flex-shrink-0 hover:bg-gray-50 transition-colors"
          style={{ borderColor: S.border, color: S.secondary }}>
          <FileDown size={15} /> Excel Export
        </button>
        <button onClick={() => setShowCsvModal(true)}
          className="flex items-center gap-2 px-3 h-10 rounded-xl border text-sm font-medium flex-shrink-0 hover:bg-gray-50 transition-colors"
          style={{ borderColor: S.border, color: S.secondary }}>
          <Upload size={15} /> Excel Import
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[{ key: "all", label: "সব পণ্য" }, { key: "low", label: "কম স্টক" }, { key: "out", label: "শেষ" }, { key: "combos", label: "📦 কমবো প্যাক" }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
            style={{
              backgroundColor: tab === t.key ? (t.key === "combos" ? "#F59E0B" : S.primary) : S.surface,
              color: tab === t.key ? "#fff" : S.secondary,
              borderColor: tab === t.key ? (t.key === "combos" ? "#F59E0B" : S.primary) : S.border,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Combo Tab */}
      {tab === "combos" ? (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
          {combosLoading ? (
            <div className="p-6 space-y-3 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}</div>
          ) : combos.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm mb-3" style={{ color: S.muted }}>কোনো কমবো প্যাক নেই।</p>
              <Link href="/inventory/combos/new" className="text-sm font-medium" style={{ color: "#F59E0B" }}>+ কমবো যোগ করুন</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b" style={{ backgroundColor: "#FFFBEB", borderColor: S.border }}>
                    {["কমবো প্যাক", "উপাদান", "বিক্রয় মূল্য", "উপলব্ধ স্টক", "স্ট্যাটাস", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "#92400E" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {combos.map(combo => (
                    <tr key={combo.id} className="border-b last:border-0" style={{ borderColor: S.border }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-lg" style={{ backgroundColor: "#FEF3C7" }}>📦</div>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: S.text }}>{combo.name}</div>
                            {combo.description && <div className="text-xs" style={{ color: S.muted }}>{combo.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {combo.items.map(ci => (
                            <div key={ci.id} className="text-xs" style={{ color: S.secondary }}>
                              {ci.product.name} × {ci.quantity} <span style={{ color: S.muted }}>(স্টক: {ci.product.stockQty})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: S.text }}>{formatBDT(combo.sellPrice)}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold" style={{ color: combo.availableStock > 0 ? "#1D9E75" : "#E24B4A" }}>
                          {combo.availableStock} সেট
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleComboActive(combo.id, combo.isActive)}
                          className="text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
                          style={{
                            backgroundColor: combo.isActive ? "var(--c-primary-light)" : "#F3F4F6",
                            color: combo.isActive ? S.primary : S.muted,
                          }}>
                          {combo.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/inventory/combos/${combo.id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                            <Pencil size={15} style={{ color: S.secondary }} />
                          </Link>
                          <button onClick={() => setDeleteComboId(combo.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 size={15} style={{ color: "#E24B4A" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm mb-3" style={{ color: S.muted }}>কোনো পণ্য নেই।</p>
            <Link href="/inventory/new" className="text-sm font-medium" style={{ color: S.primary }}>+ পণ্য যোগ করুন</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b" style={{ backgroundColor: "var(--c-surface)", borderColor: S.border }}>
                {["পণ্য", "SKU", "ক্যাটাগরি", "ক্রয় মূল্য", "বিক্রয় মূল্য", "স্টক", "স্ট্যাটাস", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: S.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const isHighlighted = highlightId === p.id;
                return (
                  <tr key={p.id} className="border-b last:border-0 transition-colors"
                    style={{
                      backgroundColor: isHighlighted ? "var(--c-primary-light)" : "transparent",
                      borderColor: S.border,
                    }}>
                    <td className="px-4 py-3">
                      <Link href={`/inventory/${p.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: "var(--c-primary)" }}>
                          {p.name[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-medium" style={{ color: S.text }}>{p.name}</span>
                        {p.hasVariants && (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--c-primary-light)", color: "var(--c-primary)" }}>Variants</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: S.muted }}>{p.sku ?? "—"}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: S.secondary }}>{p.category ?? "—"}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: S.secondary }}>{formatBDT(p.buyPrice)}</td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: S.text }}>{formatBDT(p.sellPrice)}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: S.text }}>{p.stockQty}</td>
                    <td className="px-4 py-3"><StockBadge p={p} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setAdjProduct(p); setAdjType("in"); setAdjQty(""); setAdjReason(""); }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          title="স্টক সামঞ্জস্য">
                          <Sliders size={15} style={{ color: "#2B7CE9" }} />
                        </button>
                        <Link href={`/inventory/${p.id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                          <Pencil size={15} style={{ color: S.secondary }} />
                        </Link>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 size={15} style={{ color: "#E24B4A" }} />
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
      )}

      {/* Combo deactivate confirm */}
      {deleteComboId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 max-w-sm w-full" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <h3 className="font-semibold text-lg mb-2" style={{ color: S.text }}>কমবো নিষ্ক্রিয় করবেন?</h3>
            <p className="text-sm mb-6" style={{ color: S.secondary }}>এই কমবো নিষ্ক্রিয় হয়ে যাবে এবং নতুন অর্ডারে দেখা যাবে না। পুরনো অর্ডারে কমবোর তথ্য অপরিবর্তিত থাকবে।</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteComboId(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={handleDeleteCombo} disabled={deletingCombo} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: "#E24B4A" }}>
                {deletingCombo ? "নিষ্ক্রিয় করছে..." : "নিষ্ক্রিয় করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
