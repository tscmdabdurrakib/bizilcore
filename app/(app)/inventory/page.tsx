"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, Camera, Upload, FileDown, Sliders, X, Check, Sparkles, Loader2, AlertTriangle, ChevronDown, ChevronUp, Package, TrendingDown, BarChart3 } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import dynamic from "next/dynamic";
import Papa from "papaparse";
import { downloadExcel } from "@/lib/excel";
import ProductEditPanel from "@/components/inventory/ProductEditPanel";
import ProductCreatePanel from "@/components/inventory/ProductCreatePanel";
import PageHint from "@/components/PageHint";
import DemoDataBanner from "@/components/DemoDataBanner";
import { PageShell, StatCard, FilterBar, Card, Badge, EmptyState, Button, Select } from "@/components/ui";

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

function StockBadge({ qty, low }: { qty: number; low: number }) {
  if (qty === 0) return <Badge variant="danger">শেষ</Badge>;
  if (qty <= low) return <Badge variant="warning">কম স্টক</Badge>;
  return <Badge variant="success">ভালো</Badge>;
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
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [createProductPanelOpen, setCreateProductPanelOpen] = useState(false);
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
  useEffect(() => { if (tab === "combos") fetchCombos(); }, [tab]);

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
    .filter((p) => { if (categoryFilter) return p.category === categoryFilter; return true; })
    .filter((p) => {
      if (tab === "low") return p.stockQty > 0 && p.stockQty <= p.lowStockAt;
      if (tab === "out") return p.stockQty === 0;
      return true;
    });

  const lowStockCount = products.filter(p => p.stockQty > 0 && p.stockQty <= p.lowStockAt).length;
  const outOfStockCount = products.filter(p => p.stockQty === 0).length;
  const totalValue = products.reduce((s, p) => s + p.sellPrice * p.stockQty, 0);

  const TABS = [
    { key: "all", label: "সব পণ্য", count: products.length },
    { key: "low", label: "কম স্টক", count: lowStockCount },
    { key: "out", label: "শেষ", count: outOfStockCount },
    { key: "combos", label: "কমবো প্যাক", count: combos.length },
  ];

  const headerActions = (
    <>
      <Button variant="outline" size="sm" onClick={fetchAiPrediction} disabled={aiPredLoading} icon={aiPredLoading ? Loader2 : Sparkles}>
        AI Prediction
      </Button>
      <Button variant="outline" size="sm" onClick={() => setShowScanner(true)} icon={Camera}>Barcode</Button>
      <Button variant="outline" size="sm" onClick={() => {
        const rows = products.map(p => ({ নাম: p.name, SKU: p.sku ?? "", "ক্রয়মূল্য (৳)": p.buyPrice, "বিক্রয়মূল্য (৳)": p.sellPrice, "স্টক": p.stockQty, "ক্যাটাগরি": p.category ?? "" }));
        downloadExcel(rows, "inventory.xlsx", "পণ্য");
      }} icon={FileDown}>Excel</Button>
      <Button variant="outline" size="sm" onClick={() => setShowCsvModal(true)} icon={Upload}>Import</Button>
      {tab === "combos" ? (
        <Link href="/inventory/combos/new">
          <Button size="sm" icon={Plus} style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>কমবো যোগ</Button>
        </Link>
      ) : (
        <Button size="sm" icon={Plus} onClick={() => setCreateProductPanelOpen(true)}>পণ্য যোগ</Button>
      )}
    </>
  );

  return (
    <PageShell
      title="ইনভেন্টরি"
      subtitle="পণ্যের স্টক ও মূল্য ব্যবস্থাপনা"
      actions={headerActions}
      stats={
        <>
          <StatCard label="মোট পণ্য" value={products.length} icon={Package} accent="blue" iconBg="var(--icon-blue-bg)" iconColor="var(--bg-info-text)" />
          <StatCard label="কম স্টক" value={lowStockCount} icon={AlertTriangle} accent="gold" iconBg="var(--icon-amber-bg)" iconColor="var(--accent-warm)" />
          <StatCard label="স্টক শেষ" value={outOfStockCount} icon={TrendingDown} accent="red" iconBg="var(--bg-danger-soft)" iconColor="var(--bg-danger-text)" />
          <StatCard label="মোট মূল্যমান" value={formatBDT(totalValue)} icon={BarChart3} accent="green" />
        </>
      }
      className="pb-6"
    >

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-xl"
          style={{ backgroundColor: toast.type === "success" ? "#10B981" : "#EF4444" }}>
          {toast.msg}
        </div>
      )}

      {showScanner && <BarcodeScanner onDetected={handleBarcodeDetected} onClose={() => setShowScanner(false)} />}

      {/* ── CSV Import Modal ── */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Excel থেকে Import</h3>
                <p className="text-xs text-gray-500 mt-0.5">CSV ফাইল আপলোড করে বাল্ক পণ্য যোগ করুন</p>
              </div>
              <button onClick={() => { setShowCsvModal(false); setCsvRows([]); }}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {csvRows.length === 0 ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-gray-300 transition-colors">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Upload size={22} className="text-blue-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">CSV ফাইল বেছে নিন</p>
                  <p className="text-xs text-gray-400 mb-4">Excel থেকে CSV হিসেবে save করে upload করুন</p>
                  <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCsvFile} />
                  <button onClick={() => fileRef.current?.click()}
                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                    ফাইল বেছে নিন
                  </button>
                </div>
                <button onClick={downloadTemplate}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  <FileDown size={15} /> Template CSV Download করুন
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-3 font-medium">{csvRows.length}টি পণ্য পাওয়া গেছে। Review করুন:</p>
                <div className="overflow-auto flex-1 rounded-xl border border-gray-100">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {["নাম", "ক্রয়", "বিক্রয়", "স্টক", "ক্যাটাগরি", "SKU"].map(h => (
                          <th key={h} className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.map((row, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-3 py-2.5 font-semibold text-gray-800">{row.name || "—"}</td>
                          <td className="px-3 py-2.5 text-gray-600">৳{row.buyPrice}</td>
                          <td className="px-3 py-2.5 text-gray-600">৳{row.sellPrice}</td>
                          <td className="px-3 py-2.5 text-gray-600">{row.stockQty}</td>
                          <td className="px-3 py-2.5 text-gray-600">{row.category || "—"}</td>
                          <td className="px-3 py-2.5 text-gray-600">{row.sku || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setCsvRows([])} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    বাতিল
                  </button>
                  <button onClick={importCsv} disabled={importing}
                    className="flex-1 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-60 transition-colors"
                    style={{ backgroundColor: "var(--c-primary)" }}>
                    {importing ? "Import হচ্ছে..." : `${csvRows.length}টি Import করুন`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Stock Adjustment Modal ── */}
      {adjProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">স্টক সামঞ্জস্য</h3>
                <p className="text-xs text-gray-500 mt-0.5">{adjProduct.name} · বর্তমান: {adjProduct.stockQty}টি</p>
              </div>
              <button onClick={() => { setAdjProduct(null); setAdjQty(""); setAdjReason(""); }}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              {(["in", "out"] as const).map((t) => (
                <button key={t} onClick={() => setAdjType(t)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={adjType === t
                    ? { backgroundColor: t === "in" ? "var(--c-primary)" : "#EF4444", color: "#fff" }
                    : { backgroundColor: "#F9FAFB", color: "#6B7280", border: "1px solid #E5E7EB" }}>
                  {t === "in" ? "+ স্টক যোগ" : "− স্টক বাদ"}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">পরিমাণ *</label>
                <input type="number" min="1" value={adjQty} onChange={e => setAdjQty(e.target.value)}
                  placeholder="কতটি?" className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm outline-none focus:border-current text-gray-900 bg-white" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">কারণ</label>
                <input type="text" value={adjReason} onChange={e => setAdjReason(e.target.value)}
                  placeholder="যেমন: ক্ষতি, নতুন মাল আসলো..." className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm outline-none focus:border-current text-gray-900 bg-white" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => { setAdjProduct(null); setAdjQty(""); setAdjReason(""); }}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                বাতিল
              </button>
              <button onClick={saveStockAdj} disabled={adjSaving || !adjQty || Number(adjQty) <= 0}
                className="flex-1 py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                style={{ backgroundColor: adjType === "in" ? "var(--c-primary)" : "#EF4444" }}>
                <Check size={14} /> {adjSaving ? "সেভ হচ্ছে..." : "সেভ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">পণ্য মুছবেন?</h3>
            <p className="text-sm text-gray-500 mb-6">এই কাজ undo করা যাবে না।</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">বাতিল</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-60">
                {deleting ? "মুছছে..." : "মুছে দিন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Combo Delete Modal ── */}
      {deleteComboId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-gray-900 text-lg mb-2">কমবো মুছবেন?</h3>
            <p className="text-sm text-gray-500 mb-6">পুরনো অর্ডারে কমবোর তথ্য অপরিবর্তিত থাকবে।</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteComboId(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">বাতিল</button>
              <button onClick={handleDeleteCombo} disabled={deletingCombo}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-60">
                {deletingCombo ? "মুছছে..." : "মুছুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      <PageHint page="inventory" text="এখানে আপনার সব পণ্য দেখুন ও পরিচালনা করুন। '+' বাটনে ক্লিক করে নতুন পণ্য যোগ করুন অথবা CSV ফাইল থেকে import করুন।" />

      {/* ── Demo Data Banner ── */}
      <DemoDataBanner />

      {aiPredData && (
        <Card padding="none" className="border-purple-100 overflow-hidden">
          <button onClick={() => setShowAiPanel(p => !p)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-left bg-purple-50 hover:bg-purple-100/50 transition-colors">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-600" />
              <span className="text-sm font-bold text-purple-800">AI স্টক পূর্বাভাস</span>
              {aiPredData.cached && <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full font-medium">ক্যাশড</span>}
            </div>
            {showAiPanel ? <ChevronUp size={16} className="text-purple-500" /> : <ChevronDown size={16} className="text-purple-500" />}
          </button>
          {showAiPanel && (
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-gray-600">{aiPredData.summary}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {aiPredData.predictions.filter(p => p.urgency !== "ok").map((p, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${p.urgency === "urgent" ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"}`}>
                    <AlertTriangle size={14} className={`${p.urgency === "urgent" ? "text-red-500" : "text-amber-500"} flex-shrink-0 mt-0.5`} />
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${p.urgency === "urgent" ? "text-red-700" : "text-amber-700"}`}>{p.productName}</p>
                      <p className={`text-xs ${p.urgency === "urgent" ? "text-red-600" : "text-amber-600"}`}>{p.daysUntilStockout}দিনে শেষ · {p.action}</p>
                    </div>
                  </div>
                ))}
              </div>
              {aiPredData.predictions.every(p => p.urgency === "ok") && (
                <p className="text-sm text-center py-2 text-emerald-600 font-semibold">সব পণ্যের স্টক ভালো আছে ✓</p>
              )}
            </div>
          )}
        </Card>
      )}

      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: "var(--c-border)" }}>
          <FilterBar
            tabs={TABS}
            activeTab={tab}
            onTabChange={setTab}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="পণ্য বা SKU খুঁজুন..."
            filters={
              tab !== "combos" ? (
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  options={[
                    { value: "", label: "সব ক্যাটাগরি" },
                    ...categories.map(c => ({ value: c.name, label: c.name })),
                  ]}
                  className="min-w-[140px]"
                />
              ) : undefined
            }
          />
        </div>

        {/* ── Combos Tab ── */}
        {tab === "combos" ? (
          combosLoading ? (
            <div className="p-6 space-y-3 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}</div>
          ) : combos.length === 0 ? (
            <EmptyState
              icon={Package}
              title="কোনো কমবো প্যাক নেই"
              action={{ label: "কমবো যোগ করুন", onClick: () => {}, href: "/inventory/combos/new" }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="bg-amber-50 border-b border-amber-100">
                    {["কমবো প্যাক", "উপাদান", "বিক্রয় মূল্য", "উপলব্ধ", "স্ট্যাটাস", ""].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-bold text-amber-800 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {combos.map(combo => (
                    <tr key={combo.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-lg bg-amber-50">📦</div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{combo.name}</div>
                            {combo.description && <div className="text-xs text-gray-400">{combo.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          {combo.items.map(ci => (
                            <div key={ci.id} className="text-xs text-gray-500">
                              {ci.product.name} × {ci.quantity}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-gray-900">{formatBDT(combo.sellPrice)}</td>
                      <td className="px-5 py-4">
                        <span className={`text-sm font-bold ${combo.availableStock > 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {combo.availableStock} সেট
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => toggleComboActive(combo.id, combo.isActive)}>
                          <Badge variant={combo.isActive ? "success" : "default"}>
                            {combo.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                          </Badge>
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <Link href={`/inventory/combos/${combo.id}/edit`} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <Pencil size={14} className="text-gray-500" />
                          </Link>
                          <button onClick={() => setDeleteComboId(combo.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* ── Products Table ── */
          loading ? (
            <div className="p-6 space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Package}
              title={products.length === 0 ? "এখনো কোনো পণ্য নেই।" : "কোনো পণ্য পাওয়া যায়নি"}
              action={products.length === 0
                ? { label: "পণ্য যোগ করুন", onClick: () => setCreateProductPanelOpen(true) }
                : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["পণ্য", "SKU", "ক্যাটাগরি", "ক্রয় মূল্য", "বিক্রয় মূল্য", "স্টক", "স্ট্যাটাস", ""].map((h) => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((p) => {
                    const isHighlighted = highlightId === p.id;
                    return (
                      <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group"
                        style={{ backgroundColor: isHighlighted ? "#EFF6FF" : undefined }}>
                        <td className="px-5 py-3.5">
                          <Link href={`/inventory/${p.id}`} className="flex items-center gap-3 hover:opacity-80">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, var(--c-primary), #0A5442)" }}>
                                {p.name[0].toUpperCase()}
                              </div>
                            )}
                            <span className="text-sm font-semibold text-gray-900">{p.name}</span>
                            {p.hasVariants && (
                              <Badge variant="info">Variants</Badge>
                            )}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-mono text-gray-400">{p.sku ?? "—"}</td>
                        <td className="px-5 py-3.5 text-sm text-gray-500">{p.category ?? "—"}</td>
                        <td className="px-5 py-3.5 text-sm text-gray-500">{formatBDT(p.buyPrice)}</td>
                        <td className="px-5 py-3.5 text-sm font-bold text-gray-900">{formatBDT(p.sellPrice)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-sm font-bold ${p.stockQty === 0 ? "text-red-500" : p.stockQty <= p.lowStockAt ? "text-amber-600" : "text-gray-900"}`}>
                            {p.stockQty}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <StockBadge qty={p.stockQty} low={p.lowStockAt} />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setAdjProduct(p); setAdjType("in"); setAdjQty(""); setAdjReason(""); }}
                              className="p-2 rounded-lg hover:bg-blue-50 transition-colors" title="স্টক সামঞ্জস্য">
                              <Sliders size={14} className="text-blue-500" />
                            </button>
                            <button onClick={() => setEditProductId(p.id)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                              <Pencil size={14} className="text-gray-500" />
                            </button>
                            <button onClick={() => setDeleteId(p.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                              <Trash2 size={14} className="text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </Card>

      {/* ── Edit Slide-over Panel ── */}
      <ProductEditPanel
        productId={editProductId}
        onClose={() => setEditProductId(null)}
        onSaved={() => fetchProducts()}
      />

      {/* ── Create Product Panel ── */}
      {createProductPanelOpen && (
        <ProductCreatePanel
          onClose={() => setCreateProductPanelOpen(false)}
          onCreated={() => fetchProducts()}
        />
      )}
    </PageShell>
  );
}
