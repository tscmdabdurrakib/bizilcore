"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import PlanGate from "@/components/PlanGate";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";
import { formatBDT } from "@/lib/utils";
import { Download, FileSpreadsheet, TrendingUp, TrendingDown, Calendar, Search, ShoppingCart, AlertTriangle, Package, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { downloadExcel, downloadExcelMultiSheet } from "@/lib/excel";

interface OrderItem { quantity: number; unitPrice: number; subtotal: number; comboId?: string | null; comboSnapshot?: unknown; product: { id: string; name: string; buyPrice: number } | null }
interface Order {
  id: string; status: string; totalAmount: number; paidAmount: number; dueAmount: number;
  createdAt: string; courierName: string | null; courierTrackId: string | null;
  codStatus: string | null;
  customer: { id: string; name: string; phone: string | null } | null;
  items: OrderItem[];
}
interface Transaction { type: string; amount: number; category: string | null; date: string; }
interface Customer { id: string; name: string; phone: string | null; dueAmount: number; loyaltyPoints: number; group: string; _count: { orders: number } }
interface Product { id: string; name: string; buyPrice: number; sellPrice: number; stockQty: number; category: string | null; createdAt: string }
interface IntelProduct {
  id: string; name: string; sku: string | null; category: string | null;
  buyPrice: number; sellPrice: number; stockQty: number; lowStockAt: number;
  unitsSold: number; revenue: number; grossProfit: number; margin: number;
  weeklyVelocity: number; daysRemaining: number | null;
  supplierId: string | null; supplierName: string | null;
}

const REPORT_TABS = [
  { key: "sales",        label: "বিক্রি রিপোর্ট" },
  { key: "bestSelling",  label: "সেরা পণ্য" },
  { key: "profitProd",   label: "পণ্যে লাভ" },
  { key: "intelligence", label: "প্রোডাক্ট বিশ্লেষণ" },
  { key: "ltv",          label: "Customer LTV" },
  { key: "cod",          label: "COD রিপোর্ট" },
  { key: "pl",           label: "P&L রিপোর্ট" },
  { key: "ai",           label: "✨ AI বিশ্লেষণ" },
];

const PIE_COLORS = ["var(--c-primary)", "#EF9F27", "#E24B4A", "#2B7CE9", "#7C3AED", "#14B8A6", "#F97316"];
const COUNTED = ["confirmed", "shipped", "delivered"];

function calcCOGS(items: OrderItem[], productMap: Record<string, number> = {}) {
  return items.reduce((s, it) => {
    if (it.comboId && it.comboSnapshot) {
      try {
        const snap = it.comboSnapshot as { items?: { productId: string; quantity: number }[] };
        const componentCost = (snap.items ?? []).reduce(
          (cs, ci) => cs + (productMap[ci.productId] ?? 0) * ci.quantity, 0
        );
        return s + componentCost * it.quantity;
      } catch { return s; }
    }
    return s + (it.product?.buyPrice ?? 0) * it.quantity;
  }, 0);
}
function getMonthKey(d: string) { return d.slice(0, 7); }
function getDateKey(d: string) { return d.slice(0, 10); }

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)",
};

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
      <p className="text-xs mb-1" style={{ color: S.muted }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: color ?? S.text }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: S.muted }}>{sub}</p>}
    </div>
  );
}

const PRESET_RANGES = [
  { label: "আজ", days: 0 },
  { label: "৭ দিন", days: 7 },
  { label: "৩০ দিন", days: 30 },
  { label: "এই মাস", days: -1 },
  { label: "৯০ দিন", days: 90 },
];

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("sales");
  const [shopBranches, setShopBranches] = useState<{ id: string; name: string }[]>([]);

  const today = new Date().toISOString().split("T")[0];
  const monthStart = `${today.slice(0, 7)}-01`;
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  const [sortProfitBy, setSortProfitBy] = useState<"margin" | "profit" | "revenue">("profit");
  const [ltvSort, setLtvSort] = useState<"revenue" | "orders" | "avg">("revenue");

  // Intelligence tab state
  const [intelProducts, setIntelProducts] = useState<IntelProduct[]>([]);
  const [intelLoading, setIntelLoading] = useState(false);
  const [intelDays, setIntelDays] = useState(30);
  const [intelFetched, setIntelFetched] = useState(false);
  const [intelSort, setIntelSort] = useState<"margin" | "profit" | "revenue" | "unitsSold" | "daysRemaining" | "name" | "category" | "buyPrice" | "sellPrice">("profit");
  const [intelSearch, setIntelSearch] = useState("");
  const [intelView, setIntelView] = useState<"profitability" | "stock">("profitability");

  // AI Analysis tab state
  const [aiInsight, setAiInsight] = useState<{ insights: string[]; recommendations: string[]; topOpportunity: string; alert: string | null; cached?: boolean; cachedAt?: string } | null>(null);
  const [aiInsightLoading, setAiInsightLoading] = useState(false);
  const [aiInsightError, setAiInsightError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders?all=1").then(r => r.json()),
      fetch("/api/transactions?from=2020-01-01&to=2099-12-31").then(r => r.json()),
      fetch("/api/products?all=1").then(r => r.json()),
      fetch("/api/customers?all=1").then(r => r.json()),
      fetch("/api/shops").then(r => r.json()).catch(() => null),
    ]).then(([o, t, p, c, sh]) => {
      setOrders(Array.isArray(o) ? o : (o?.orders ?? []));
      setTransactions(Array.isArray(t) ? t : []);
      setProducts(Array.isArray(p) ? p : (p?.products ?? []));
      setCustomers(Array.isArray(c) ? c : (c?.customers ?? []));
      if (sh && !sh.locked && Array.isArray(sh.branches)) setShopBranches(sh.branches);
      setLoading(false);
    });
  }, []);

  function applyPreset(days: number) {
    const now = new Date();
    if (days === -1) {
      setDateFrom(`${now.toISOString().slice(0, 7)}-01`);
      setDateTo(now.toISOString().split("T")[0]);
    } else if (days === 0) {
      const d = now.toISOString().split("T")[0];
      setDateFrom(d); setDateTo(d);
    } else {
      const from = new Date(now); from.setDate(now.getDate() - days);
      setDateFrom(from.toISOString().split("T")[0]);
      setDateTo(now.toISOString().split("T")[0]);
    }
  }

  async function fetchAiInsight(force = false) {
    setAiInsightLoading(true);
    setAiInsightError(null);
    try {
      const r = await fetch(`/api/ai/sales-insight${force ? "?force=1" : ""}`);
      const d = await r.json();
      if (r.ok) setAiInsight(d);
      else setAiInsightError(d.error ?? "AI বিশ্লেষণ পাওয়া যায়নি।");
    } catch {
      setAiInsightError("সংযোগ সমস্যা। আবার চেষ্টা করুন।");
    }
    setAiInsightLoading(false);
  }

  async function fetchIntelProducts(days: number) {
    setIntelLoading(true);
    try {
      const r = await fetch(`/api/reports/products?days=${days}`);
      const d = await r.json();
      setIntelProducts(Array.isArray(d.products) ? d.products : []);
      setIntelFetched(true);
    } catch {
      setIntelProducts([]);
    }
    setIntelLoading(false);
  }

  useEffect(() => {
    if (tab === "intelligence" && !intelFetched) {
      fetchIntelProducts(intelDays);
    }
  }, [tab, intelFetched, intelDays]);

  const start = useMemo(() => new Date(dateFrom + "T00:00:00"), [dateFrom]);
  const end = useMemo(() => new Date(dateTo + "T23:59:59"), [dateTo]);

  // Valid counted orders in selected date range
  const validOrders = useMemo(() =>
    orders.filter(o => COUNTED.includes(o.status) && new Date(o.createdAt) >= start && new Date(o.createdAt) <= end),
    [orders, start, end]);

  // All orders in period
  const periodOrders = useMemo(() =>
    orders.filter(o => new Date(o.createdAt) >= start && new Date(o.createdAt) <= end),
    [orders, start, end]);

  // ─── SALES TAB ──────────────────────────────────────────────────────
  const salesByDay = useMemo(() => {
    const m: Record<string, { revenue: number; orders: number }> = {};
    validOrders.forEach(o => {
      const d = getDateKey(o.createdAt);
      if (!m[d]) m[d] = { revenue: 0, orders: 0 };
      m[d].revenue += o.totalAmount;
      m[d].orders += 1;
    });
    return Object.entries(m).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({
      date: date.slice(5), revenue: Math.round(v.revenue), orders: v.orders,
    }));
  }, [validOrders]);

  const totalRevenue = useMemo(() => validOrders.reduce((s, o) => s + o.totalAmount, 0), [validOrders]);
  const totalPaid = useMemo(() => validOrders.reduce((s, o) => s + o.paidAmount, 0), [validOrders]);
  const totalDue = useMemo(() => validOrders.reduce((s, o) => s + o.dueAmount, 0), [validOrders]);
  const avgOrderValue = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

  // Compare with previous equal-length period
  const rangeDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const prevEnd = useMemo(() => { const d = new Date(start); d.setDate(d.getDate() - 1); return d; }, [start]);
  const prevStart = useMemo(() => { const d = new Date(prevEnd); d.setDate(d.getDate() - rangeDays + 1); return d; }, [prevEnd, rangeDays]);
  const prevOrders = useMemo(() =>
    orders.filter(o => COUNTED.includes(o.status) && new Date(o.createdAt) >= prevStart && new Date(o.createdAt) <= prevEnd),
    [orders, prevStart, prevEnd]);
  const prevRevenue = prevOrders.reduce((s, o) => s + o.totalAmount, 0);
  const revenueChange = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

  // Order status breakdown
  const statusBreakdown = useMemo(() => {
    const STATUS_BD: Record<string, string> = {
      pending: "মুলতুবি", confirmed: "নিশ্চিত", processing: "প্রক্রিয়াধীন",
      shipped: "পাঠানো হয়েছে", delivered: "ডেলিভারি", cancelled: "বাতিল", returned: "ফেরত",
    };
    const m: Record<string, number> = {};
    periodOrders.forEach(o => { m[o.status] = (m[o.status] ?? 0) + 1; });
    return Object.entries(m).map(([status, count]) => ({ name: STATUS_BD[status] ?? status, value: count }));
  }, [periodOrders]);

  // ─── BEST SELLING TAB ────────────────────────────────────────────────
  const bestSellingData = useMemo(() => {
    const m: Record<string, { name: string; qty: number; revenue: number; category: string | null }> = {};
    validOrders.forEach(o => {
      o.items.forEach(it => {
        if (!it.product) return;
        const key = it.product.id;
        if (!m[key]) {
          const prod = products.find(p => p.id === it.product!.id);
          m[key] = { name: it.product.name, qty: 0, revenue: 0, category: prod?.category ?? null };
        }
        m[key].qty += it.quantity;
        m[key].revenue += it.subtotal;
      });
    });
    return Object.values(m);
  }, [validOrders, products]);

  const top10ByQty = useMemo(() => [...bestSellingData].sort((a, b) => b.qty - a.qty).slice(0, 10), [bestSellingData]);
  const top10ByRevenue = useMemo(() => [...bestSellingData].sort((a, b) => b.revenue - a.revenue).slice(0, 10), [bestSellingData]);

  const categoryRevenue = useMemo(() => {
    const m: Record<string, number> = {};
    validOrders.forEach(o => {
      o.items.forEach(it => {
        const cat = it.product ? (products.find(p => p.id === it.product!.id)?.category ?? "অন্যান্য") : "কমবো";
        m[cat] = (m[cat] ?? 0) + it.subtotal;
      });
    });
    return Object.entries(m).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [validOrders, products]);

  // ─── PROFIT PER PRODUCT TAB ─────────────────────────────────────────
  const profitPerProduct = useMemo(() => {
    const m: Record<string, { name: string; category: string | null; qty: number; revenue: number; cogs: number }> = {};
    orders.filter(o => COUNTED.includes(o.status)).forEach(o => {
      o.items.forEach(it => {
        if (!it.product) return;
        const key = it.product.id;
        if (!m[key]) {
          const prod = products.find(p => p.id === it.product!.id);
          m[key] = { name: it.product.name, category: prod?.category ?? null, qty: 0, revenue: 0, cogs: 0 };
        }
        m[key].qty += it.quantity;
        m[key].revenue += it.subtotal;
        m[key].cogs += (it.product.buyPrice ?? 0) * it.quantity;
      });
    });
    return Object.values(m).map(p => {
      const profit = p.revenue - p.cogs;
      const margin = p.revenue > 0 ? Math.round((profit / p.revenue) * 100) : 0;
      return { ...p, profit: Math.round(profit), margin };
    });
  }, [orders, products]);

  const sortedProfitProducts = useMemo(() => {
    const arr = [...profitPerProduct];
    if (sortProfitBy === "margin") return arr.sort((a, b) => b.margin - a.margin);
    if (sortProfitBy === "revenue") return arr.sort((a, b) => b.revenue - a.revenue);
    return arr.sort((a, b) => b.profit - a.profit);
  }, [profitPerProduct, sortProfitBy]);

  const totalProfit = profitPerProduct.reduce((s, p) => s + p.profit, 0);
  const totalCogs = profitPerProduct.reduce((s, p) => s + p.cogs, 0);
  const totalRevAll = profitPerProduct.reduce((s, p) => s + p.revenue, 0);
  const overallMargin = totalRevAll > 0 ? Math.round((totalProfit / totalRevAll) * 100) : 0;

  const top5ProfitChart = [...profitPerProduct].sort((a, b) => b.profit - a.profit).slice(0, 8)
    .map(p => ({ name: p.name.length > 12 ? p.name.slice(0, 12) + "…" : p.name, profit: p.profit, margin: p.margin }));

  // ─── CUSTOMER LTV TAB ───────────────────────────────────────────────
  const ltvData = useMemo(() => {
    const m: Record<string, { id: string; name: string; phone: string | null; group: string; revenue: number; orderCount: number; firstOrder: string; lastOrder: string; loyaltyPoints: number }> = {};
    orders.filter(o => COUNTED.includes(o.status) && o.customer).forEach(o => {
      const key = o.customer!.id;
      if (!m[key]) {
        const c = customers.find(x => x.id === key);
        m[key] = { id: key, name: o.customer!.name, phone: o.customer!.phone, group: c?.group ?? "regular", revenue: 0, orderCount: 0, firstOrder: o.createdAt, lastOrder: o.createdAt, loyaltyPoints: c?.loyaltyPoints ?? 0 };
      }
      m[key].revenue += o.totalAmount;
      m[key].orderCount += 1;
      if (o.createdAt < m[key].firstOrder) m[key].firstOrder = o.createdAt;
      if (o.createdAt > m[key].lastOrder) m[key].lastOrder = o.createdAt;
    });
    return Object.values(m).map(c => ({
      ...c,
      avgOrder: c.orderCount > 0 ? Math.round(c.revenue / c.orderCount) : 0,
    }));
  }, [orders, customers]);

  const sortedLtv = useMemo(() => {
    const arr = [...ltvData];
    if (ltvSort === "orders") return arr.sort((a, b) => b.orderCount - a.orderCount);
    if (ltvSort === "avg") return arr.sort((a, b) => b.avgOrder - a.avgOrder);
    return arr.sort((a, b) => b.revenue - a.revenue);
  }, [ltvData, ltvSort]);

  const topLtv10Chart = sortedLtv.slice(0, 8).map(c => ({
    name: c.name.length > 10 ? c.name.slice(0, 10) + "…" : c.name,
    revenue: Math.round(c.revenue), orders: c.orderCount,
  }));

  const repeatCustomers = useMemo(() => {
    const repeat = ltvData.filter(c => c.orderCount > 1).length;
    const newC = ltvData.filter(c => c.orderCount === 1).length;
    return [
      { name: "পুরনো কাস্টমার", value: repeat, color: "var(--c-primary)" },
      { name: "নতুন কাস্টমার", value: newC, color: "#2B7CE9" },
    ];
  }, [ltvData]);

  const topDueCustomers = [...customers].sort((a, b) => b.dueAmount - a.dueAmount).filter(c => c.dueAmount > 0).slice(0, 10);

  // ─── COD TAB ────────────────────────────────────────────────────────
  const courierOrders = useMemo(() => orders.filter(o => o.courierTrackId), [orders]);
  const periodCourierOrders = useMemo(() =>
    courierOrders.filter(o => new Date(o.createdAt) >= start && new Date(o.createdAt) <= end),
    [courierOrders, start, end]);

  const codSummary = useMemo(() => {
    const calc = (arr: Order[]) => ({
      total: arr.length,
      collected: arr.filter(o => o.codStatus === "collected").length,
      collectedAmt: arr.filter(o => o.codStatus === "collected").reduce((s, o) => s + o.totalAmount, 0),
      pending: arr.filter(o => o.codStatus === "with_courier").length,
      pendingAmt: arr.filter(o => o.codStatus === "with_courier").reduce((s, o) => s + o.totalAmount, 0),
      returned: arr.filter(o => o.codStatus === "returned").length,
      returnedAmt: arr.filter(o => o.codStatus === "returned").reduce((s, o) => s + o.totalAmount, 0),
      totalAmt: arr.reduce((s, o) => s + o.totalAmount, 0),
    });
    return {
      all: calc(periodCourierOrders),
      pathao: calc(periodCourierOrders.filter(o => o.courierName === "pathao")),
      ecourier: calc(periodCourierOrders.filter(o => o.courierName === "ecourier")),
      other: calc(periodCourierOrders.filter(o => !["pathao", "ecourier"].includes(o.courierName ?? ""))),
    };
  }, [periodCourierOrders]);

  const codMonthly = useMemo(() => {
    const m: Record<string, { collected: number; pending: number; returned: number }> = {};
    courierOrders.forEach(o => {
      const k = getMonthKey(o.createdAt);
      if (!m[k]) m[k] = { collected: 0, pending: 0, returned: 0 };
      if (o.codStatus === "collected") m[k].collected += o.totalAmount;
      else if (o.codStatus === "with_courier") m[k].pending += o.totalAmount;
      else if (o.codStatus === "returned") m[k].returned += o.totalAmount;
    });
    return Object.entries(m).sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({
      month: month.slice(5),
      collected: Math.round(v.collected),
      pending: Math.round(v.pending),
      returned: Math.round(v.returned),
    }));
  }, [courierOrders]);

  // ─── P&L TAB ────────────────────────────────────────────────────────
  const monthlyPL = useMemo(() => {
    const productMap: Record<string, number> = Object.fromEntries(products.map(p => [p.id, p.buyPrice]));
    const m: Record<string, { revenue: number; cogs: number; expenses: number }> = {};
    orders.filter(o => COUNTED.includes(o.status)).forEach(o => {
      const k = getMonthKey(o.createdAt);
      if (!m[k]) m[k] = { revenue: 0, cogs: 0, expenses: 0 };
      m[k].revenue += o.totalAmount;
      m[k].cogs += calcCOGS(o.items, productMap);
    });
    transactions.filter(t => t.type === "expense").forEach(t => {
      const k = getMonthKey(t.date);
      if (!m[k]) m[k] = { revenue: 0, cogs: 0, expenses: 0 };
      m[k].expenses += t.amount;
    });
    return Object.entries(m).sort(([a], [b]) => a.localeCompare(b)).map(([month, d]) => ({
      month: month.slice(5), revenue: Math.round(d.revenue), cogs: Math.round(d.cogs),
      expenses: Math.round(d.expenses), netProfit: Math.round(d.revenue - d.cogs - d.expenses),
    }));
  }, [orders, transactions, products]);

  const expenseByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      const k = t.category ?? "অন্যান্য";
      m[k] = (m[k] ?? 0) + t.amount;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [transactions]);

  // ─── INTELLIGENCE TAB COMPUTED ──────────────────────────────────────
  const filteredIntelProducts = useMemo(() => {
    const q = intelSearch.toLowerCase();
    return intelProducts
      .filter(p =>
        !q || p.name.toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q)
      )
      .sort((a, b) => {
        if (intelSort === "margin") return b.margin - a.margin;
        if (intelSort === "revenue") return b.revenue - a.revenue;
        if (intelSort === "unitsSold") return b.unitsSold - a.unitsSold;
        if (intelSort === "buyPrice") return b.buyPrice - a.buyPrice;
        if (intelSort === "sellPrice") return b.sellPrice - a.sellPrice;
        if (intelSort === "name") return a.name.localeCompare(b.name);
        if (intelSort === "category") return (a.category ?? "").localeCompare(b.category ?? "");
        if (intelSort === "daysRemaining") {
          const aD = a.daysRemaining ?? 9999;
          const bD = b.daysRemaining ?? 9999;
          return aD - bD;
        }
        return b.grossProfit - a.grossProfit;
      });
  }, [intelProducts, intelSearch, intelSort]);

  const intelKPIs = useMemo(() => {
    if (intelProducts.length === 0) return null;
    const sold = intelProducts.filter(p => p.unitsSold > 0);
    const bestMargin = sold.length > 0 ? [...sold].sort((a, b) => b.margin - a.margin)[0] : null;
    const worstMargin = sold.length > 0 ? [...sold].sort((a, b) => a.margin - b.margin)[0] : null;
    const stockoutSoon = intelProducts.filter(p => p.daysRemaining !== null && p.daysRemaining < 7 && p.stockQty > 0).length;
    const slowMovers = intelProducts.filter(p => p.weeklyVelocity < 1 && p.stockQty > 30).length;
    const totalGrossProfit = intelProducts.reduce((s, p) => s + p.grossProfit, 0);
    return { bestMargin, worstMargin, stockoutSoon, slowMovers, totalGrossProfit };
  }, [intelProducts]);

  function exportIntelCsv() {
    const headers = ["পণ্য", "SKU", "ক্যাটাগরি", "ক্রয়মূল্য (৳)", "বিক্রয়মূল্য (৳)", "বিক্রিত পিস", "রাজস্ব (৳)", "গ্রস প্রফিট (৳)", "মার্জিন (%)", "সাপ্তাহিক বিক্রি", "বর্তমান স্টক", "দিন বাকি"];
    const rows = filteredIntelProducts.map(p => [
      p.name,
      p.sku ?? "",
      p.category ?? "",
      p.buyPrice,
      p.sellPrice,
      p.unitsSold,
      p.revenue,
      p.grossProfit,
      p.margin,
      p.weeklyVelocity,
      p.stockQty,
      p.daysRemaining ?? "N/A",
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `product-intelligence-${intelDays}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── EXPORTS ────────────────────────────────────────────────────────
  function exportPL() {
    downloadExcel(monthlyPL.map(r => ({ মাস: r.month, "বিক্রি (৳)": r.revenue, "COGS (৳)": r.cogs, "খরচ (৳)": r.expenses, "নেট লাভ (৳)": r.netProfit })), `pl-${today.slice(0, 7)}.xlsx`, "P&L");
  }

  function exportFullReport() {
    downloadExcelMultiSheet([
      { name: "বিক্রি ট্রেন্ড", rows: salesByDay.map(r => ({ তারিখ: r.date, "রাজস্ব (৳)": r.revenue, অর্ডার: r.orders })) },
      { name: "সেরা পণ্য (পরিমাণ)", rows: top10ByQty.map(r => ({ পণ্য: r.name, পরিমাণ: r.qty, "রাজস্ব (৳)": r.revenue })) },
      { name: "পণ্যে লাভ", rows: sortedProfitProducts.map(r => ({ পণ্য: r.name, "বিক্রি (৳)": r.revenue, "COGS (৳)": r.cogs, "লাভ (৳)": r.profit, "মার্জিন (%)": r.margin })) },
      { name: "Customer LTV", rows: sortedLtv.map(r => ({ নাম: r.name, ফোন: r.phone ?? "", "মোট কেনা (৳)": r.revenue, "অর্ডার সংখ্যা": r.orderCount, "গড় অর্ডার (৳)": r.avgOrder })) },
      { name: "P&L", rows: monthlyPL.map(r => ({ মাস: r.month, "বিক্রি (৳)": r.revenue, "COGS (৳)": r.cogs, "খরচ (৳)": r.expenses, "নেট লাভ (৳)": r.netProfit })) },
    ], "bizilcore-full-report.xlsx");
  }

  if (loading) return (
    <div className="animate-pulse space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-40 bg-gray-100 rounded-2xl" />)}</div>
  );

  return (
    <PlanGate feature="reports">
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #2B7CE9 0%, #1A5FBF 100%)" }}>
            <TrendingUp size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>রিপোর্ট</h1>
            <p className="text-xs" style={{ color: S.muted }}>বিক্রি, লাভ ও পারফরম্যান্সের বিস্তারিত বিশ্লেষণ</p>
          </div>
        </div>
        <button onClick={exportFullReport}
          className="flex items-center gap-2 px-4 h-10 rounded-xl border text-sm font-medium flex-shrink-0"
          style={{ borderColor: S.border, color: S.secondary }}>
          <FileSpreadsheet size={15} /> Full Export
        </button>
      </div>

      {/* Multi-shop consolidated info banner */}
      {shopBranches.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: "#F0FBF6", border: "1px solid #A7F3D0" }}>
          <span style={{ color: "#0F6E56" }}>🏪</span>
          <span style={{ color: "#065F46" }}>
            <strong>সব শাখার সম্মিলিত রিপোর্ট</strong> দেখছেন — মূল শপ + {shopBranches.map(b => b.name).join(", ")}
          </span>
        </div>
      )}

      {/* Report Tabs */}
      <div className="flex border-b overflow-x-auto" style={{ borderColor: S.border }}>
        {REPORT_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex-shrink-0"
            style={{ borderColor: tab === t.key ? S.primary : "transparent", color: tab === t.key ? S.primary : S.secondary }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Universal Date Range Filter */}
      <div className="flex items-center gap-3 flex-wrap p-3 rounded-2xl border" style={{ backgroundColor: "var(--c-bg)", borderColor: S.border }}>
        <Calendar size={15} style={{ color: S.muted }} />
        <div className="flex items-center gap-2 flex-wrap">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="h-9 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text }} />
          <span className="text-sm" style={{ color: S.muted }}>—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="h-9 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text }} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {PRESET_RANGES.map(p => (
            <button key={p.label} onClick={() => applyPreset(p.days)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-white"
              style={{ borderColor: S.border, color: S.secondary }}>
              {p.label}
            </button>
          ))}
        </div>
        <span className="text-xs ml-auto" style={{ color: S.muted }}>
          {validOrders.length}টি valid অর্ডার
        </span>
      </div>

      {/* ─── TAB 1: SALES ─────────────────────────────────────────────── */}
      {tab === "sales" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="মোট বিক্রি" value={formatBDT(totalRevenue)} sub={`${validOrders.length}টি অর্ডার`} color={S.primary} />
            <StatCard label="গড় অর্ডার" value={formatBDT(avgOrderValue)} sub="per order" />
            <StatCard label="আগের তুলনায়" value={`${revenueChange > 0 ? "+" : ""}${revenueChange}%`}
              sub="আগের সমান সময়" color={revenueChange >= 0 ? S.primary : "#E24B4A"} />
            <StatCard label="মোট পরিশোধিত" value={formatBDT(totalPaid)} sub={`বাকি ${formatBDT(totalDue)}`} />
          </div>

          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h3 className="font-semibold text-sm mb-4" style={{ color: S.text }}>দৈনিক বিক্রির ট্রেন্ড</h3>
            {salesByDay.length === 0
              ? <p className="text-center py-8 text-sm" style={{ color: S.muted }}>এই সময়ে কোনো বিক্রি নেই।</p>
              : <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={salesByDay} margin={{ left: -20, right: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: S.muted }} />
                    <YAxis tick={{ fontSize: 10, fill: S.muted }} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => [`৳${(Number(v) || 0).toLocaleString()}`, "বিক্রি"]} contentStyle={{ borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 12 }} />
                    <Line type="monotone" dataKey="revenue" stroke={S.primary} strokeWidth={2.5} dot={false} name="বিক্রি" />
                  </LineChart>
                </ResponsiveContainer>
            }
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <h3 className="font-semibold text-sm mb-4" style={{ color: S.text }}>এই পিরিয়ড vs আগের পিরিয়ড</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: `${dateFrom} – ${dateTo}`, value: formatBDT(totalRevenue), orders: validOrders.length, color: S.primary },
                  { label: "আগের একই সময়", value: formatBDT(prevRevenue), orders: prevOrders.length, color: S.secondary },
                ].map(col => (
                  <div key={col.label} className="text-center p-3 rounded-xl" style={{ backgroundColor: "var(--c-bg)" }}>
                    <p className="text-[10px] mb-1 leading-tight" style={{ color: S.muted }}>{col.label}</p>
                    <p className="text-xl font-bold" style={{ color: col.color }}>{col.value}</p>
                    <p className="text-xs mt-1" style={{ color: S.muted }}>{col.orders}টি অর্ডার</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <h3 className="font-semibold text-sm mb-4" style={{ color: S.text }}>অর্ডার স্ট্যাটাস ভাঙ্গন</h3>
              {statusBreakdown.length === 0
                ? <p className="text-center py-8 text-sm" style={{ color: S.muted }}>কোনো অর্ডার নেই।</p>
                : <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                        {statusBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Legend iconSize={9} formatter={v => <span style={{ fontSize: 10, color: S.secondary }}>{v}</span>} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
              }
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: BEST SELLING PRODUCTS ─────────────────────────────── */}
      {tab === "bestSelling" && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="মোট পণ্য বিক্রি হয়েছে" value={bestSellingData.reduce((s, p) => s + p.qty, 0).toLocaleString("bn-BD") + " পিস"} />
            <StatCard label="সেরা বিক্রেতা" value={top10ByQty[0]?.name ?? "—"} sub={`${top10ByQty[0]?.qty ?? 0} পিস`} color={S.primary} />
            <StatCard label="মোট ক্যাটাগরি" value={categoryRevenue.length.toString()} sub="active categories" />
          </div>

          {/* Top 10 by quantity */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-semibold text-sm" style={{ color: S.text }}>সেরা ১০ পণ্য — পরিমাণ অনুযায়ী</h3>
              <button onClick={() => downloadExcel(top10ByQty.map(r => ({ পণ্য: r.name, পরিমাণ: r.qty, "রাজস্ব (৳)": r.revenue })), "best-selling-qty.xlsx")}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border" style={{ borderColor: S.border, color: S.secondary }}>
                <Download size={12} /> Excel
              </button>
            </div>
            {top10ByQty.length === 0
              ? <p className="text-center py-8 text-sm" style={{ color: S.muted }}>এই সময়ে কোনো বিক্রি নেই।</p>
              : <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={top10ByQty.map(p => ({ name: p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name, পরিমাণ: p.qty, "রাজস্ব": p.revenue }))}
                    layout="vertical" margin={{ left: 0, right: 40 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: S.muted }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: S.text }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 12 }} />
                    <Bar dataKey="পরিমাণ" fill={S.primary} radius={[0, 4, 4, 0]}>
                      {top10ByQty.map((_, i) => <Cell key={i} fill={i === 0 ? "#EF9F27" : i === 1 ? "#2B7CE9" : S.primary} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>

          {/* Top 10 by revenue */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-semibold text-sm" style={{ color: S.text }}>সেরা ১০ পণ্য — রাজস্ব অনুযায়ী</h3>
              <button onClick={() => downloadExcel(top10ByRevenue.map(r => ({ পণ্য: r.name, "রাজস্ব (৳)": r.revenue, পরিমাণ: r.qty })), "best-selling-revenue.xlsx")}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border" style={{ borderColor: S.border, color: S.secondary }}>
                <Download size={12} /> Excel
              </button>
            </div>
            {top10ByRevenue.length === 0
              ? <p className="text-center py-8 text-sm" style={{ color: S.muted }}>এই সময়ে কোনো বিক্রি নেই।</p>
              : <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={top10ByRevenue.map(p => ({ name: p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name, "রাজস্ব (৳)": p.revenue }))}
                    layout="vertical" margin={{ left: 0, right: 40 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: S.muted }} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: S.text }} />
                    <Tooltip formatter={(v) => [`৳${(Number(v) || 0).toLocaleString()}`, "রাজস্ব"]} contentStyle={{ borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 12 }} />
                    <Bar dataKey="রাজস্ব (৳)" fill="#2B7CE9" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>

          {/* Category breakdown */}
          {categoryRevenue.length > 0 && (
            <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <h3 className="font-semibold text-sm mb-4" style={{ color: S.text }}>ক্যাটাগরি অনুযায়ী বিক্রি</h3>
              <div className="flex gap-6 items-center flex-wrap">
                <ResponsiveContainer width={200} height={180}>
                  <PieChart>
                    <Pie data={categoryRevenue} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value">
                      {categoryRevenue.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`৳${(Number(v) || 0).toLocaleString()}`, "বিক্রি"]} contentStyle={{ borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {categoryRevenue.sort((a, b) => b.value - a.value).map((cat, i) => (
                    <div key={cat.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-sm flex-1" style={{ color: S.text }}>{cat.name}</span>
                      <span className="text-sm font-semibold" style={{ color: S.secondary }}>{formatBDT(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Full table */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ backgroundColor: "var(--c-surface)", borderColor: S.border }}>
              <h3 className="font-semibold text-sm" style={{ color: S.text }}>সব পণ্যের বিক্রি বিবরণী</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ backgroundColor: "var(--c-surface)", borderColor: S.border }}>
                    {["#", "পণ্য", "ক্যাটাগরি", "পরিমাণ বিক্রি", "রাজস্ব"].map(h => (
                      <th key={h} className="text-left px-4 py-2 text-xs font-semibold whitespace-nowrap" style={{ color: S.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...bestSellingData].sort((a, b) => b.qty - a.qty).map((p, i) => (
                    <tr key={p.name} className="border-b last:border-0" style={{ borderColor: S.border }}>
                      <td className="px-4 py-2 text-xs font-bold w-8" style={{ color: i < 3 ? "#EF9F27" : S.muted }}>#{i + 1}</td>
                      <td className="px-4 py-2 font-medium" style={{ color: S.text }}>{p.name}</td>
                      <td className="px-4 py-2 text-xs" style={{ color: S.muted }}>{p.category ?? "—"}</td>
                      <td className="px-4 py-2 font-semibold" style={{ color: S.primary }}>{p.qty} পিস</td>
                      <td className="px-4 py-2 font-semibold" style={{ color: S.text }}>{formatBDT(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: PROFIT PER PRODUCT ────────────────────────────────── */}
      {tab === "profitProd" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="মোট বিক্রয় রাজস্ব" value={formatBDT(totalRevAll)} sub="সব সময়ের" />
            <StatCard label="মোট COGS" value={formatBDT(totalCogs)} sub="ক্রয়মূল্য" color="#EF9F27" />
            <StatCard label="মোট লাভ" value={formatBDT(totalProfit)} color={totalProfit >= 0 ? S.primary : "#E24B4A"} sub="gross profit" />
            <StatCard label="গড় মার্জিন" value={`${overallMargin}%`} color={overallMargin >= 20 ? S.primary : overallMargin >= 10 ? "#EF9F27" : "#E24B4A"} sub="gross margin" />
          </div>

          {/* Profit chart */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h3 className="font-semibold text-sm mb-4" style={{ color: S.text }}>সেরা ৮ পণ্যের লাভ</h3>
            {top5ProfitChart.length === 0
              ? <p className="text-center py-8 text-sm" style={{ color: S.muted }}>কোনো বিক্রির তথ্য নেই।</p>
              : <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={top5ProfitChart} margin={{ left: -20, right: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: S.muted }} />
                    <YAxis tick={{ fontSize: 9, fill: S.muted }} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => [`৳${(Number(v) || 0).toLocaleString()}`]} contentStyle={{ borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 12 }} />
                    <Bar dataKey="profit" name="লাভ (৳)" fill={S.primary} radius={[4, 4, 0, 0]}>
                      {top5ProfitChart.map((p, i) => <Cell key={i} fill={p.profit < 0 ? "#E24B4A" : S.primary} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>

          {/* Sort control + table */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
            <div className="px-5 py-3 border-b flex items-center justify-between flex-wrap gap-2" style={{ backgroundColor: "var(--c-surface)", borderColor: S.border }}>
              <h3 className="font-semibold text-sm" style={{ color: S.text }}>পণ্য অনুযায়ী লাভ-ক্ষতি</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: S.muted }}>সাজান:</span>
                {[{ v: "profit", l: "লাভ" }, { v: "margin", l: "মার্জিন" }, { v: "revenue", l: "রাজস্ব" }].map(s => (
                  <button key={s.v} onClick={() => setSortProfitBy(s.v as typeof sortProfitBy)}
                    className="px-2 py-1 rounded-lg text-xs font-medium border transition-colors"
                    style={{ backgroundColor: sortProfitBy === s.v ? S.primary : "white", color: sortProfitBy === s.v ? "white" : S.secondary, borderColor: sortProfitBy === s.v ? S.primary : S.border }}>
                    {s.l}
                  </button>
                ))}
                <button onClick={() => downloadExcel(sortedProfitProducts.map(r => ({ পণ্য: r.name, "বিক্রি (৳)": r.revenue, "COGS (৳)": r.cogs, "লাভ (৳)": r.profit, "মার্জিন (%)": r.margin })), "profit-per-product.xlsx")}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border" style={{ borderColor: S.border, color: S.secondary }}>
                  <Download size={12} /> Excel
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ backgroundColor: "var(--c-surface)", borderColor: S.border }}>
                    {["পণ্য", "ক্যাটাগরি", "বিক্রিত পিস", "বিক্রি (৳)", "COGS (৳)", "লাভ (৳)", "মার্জিন"].map(h => (
                      <th key={h} className="text-left px-4 py-2 text-xs font-semibold whitespace-nowrap" style={{ color: S.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedProfitProducts.map((p, i) => (
                    <tr key={p.name} className="border-b last:border-0" style={{ borderColor: S.border }}>
                      <td className="px-4 py-2.5 font-medium" style={{ color: S.text }}>{p.name}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: S.muted }}>{p.category ?? "—"}</td>
                      <td className="px-4 py-2.5" style={{ color: S.secondary }}>{p.qty}</td>
                      <td className="px-4 py-2.5" style={{ color: S.text }}>{formatBDT(p.revenue)}</td>
                      <td className="px-4 py-2.5" style={{ color: "#EF9F27" }}>{formatBDT(p.cogs)}</td>
                      <td className="px-4 py-2.5 font-bold" style={{ color: p.profit >= 0 ? S.primary : "#E24B4A" }}>{formatBDT(p.profit)}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: p.margin >= 30 ? "var(--c-primary-light)" : p.margin >= 15 ? "var(--bg-warning-soft)" : "var(--bg-danger-soft)",
                            color: p.margin >= 30 ? S.primary : p.margin >= 15 ? "var(--bg-warning-text)" : "var(--bg-danger-text)",
                          }}>
                          {p.margin}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sell price vs buy price visual */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h3 className="font-semibold text-sm mb-4" style={{ color: S.text }}>ক্রয়মূল্য vs বিক্রয়মূল্য (স্টকে থাকা পণ্য)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: S.border }}>
                    {["পণ্য", "ক্রয়মূল্য", "বিক্রয়মূল্য", "লাভ/পিস", "মার্জিন"].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-semibold" style={{ color: S.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...products].filter(p => p.stockQty > 0).sort((a, b) => {
                    const mA = a.sellPrice > 0 ? Math.round(((a.sellPrice - a.buyPrice) / a.sellPrice) * 100) : 0;
                    const mB = b.sellPrice > 0 ? Math.round(((b.sellPrice - b.buyPrice) / b.sellPrice) * 100) : 0;
                    return mB - mA;
                  }).map((p, i) => {
                    const profitPer = p.sellPrice - p.buyPrice;
                    const margin = p.sellPrice > 0 ? Math.round((profitPer / p.sellPrice) * 100) : 0;
                    return (
                      <tr key={p.id} className="border-b last:border-0" style={{ borderColor: S.border }}>
                        <td className="px-3 py-2 font-medium text-sm" style={{ color: S.text }}>{p.name}</td>
                        <td className="px-3 py-2 text-sm" style={{ color: S.secondary }}>{formatBDT(p.buyPrice)}</td>
                        <td className="px-3 py-2 text-sm font-semibold" style={{ color: S.text }}>{formatBDT(p.sellPrice)}</td>
                        <td className="px-3 py-2 text-sm font-semibold" style={{ color: profitPer >= 0 ? S.primary : "#E24B4A" }}>{formatBDT(profitPer)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "var(--c-border)" }}>
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, margin))}%`, backgroundColor: margin >= 30 ? S.primary : margin >= 15 ? "#EF9F27" : "#E24B4A" }} />
                            </div>
                            <span className="text-xs font-semibold w-8" style={{ color: margin >= 30 ? S.primary : margin >= 15 ? "var(--bg-warning-text)" : "var(--bg-danger-text)" }}>{margin}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: PRODUCT INTELLIGENCE ─────────────────────────────── */}
      {tab === "intelligence" && (
        <div className="space-y-5">
          {/* Day-range selector + controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium" style={{ color: S.secondary }}>সময়কাল:</span>
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => { setIntelDays(d); setIntelFetched(false); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                style={{ backgroundColor: intelDays === d ? S.primary : S.surface, color: intelDays === d ? "white" : S.secondary, borderColor: intelDays === d ? S.primary : S.border }}>
                {d} দিন
              </button>
            ))}
            <div className="ml-auto flex gap-2">
              <button onClick={exportIntelCsv}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium"
                style={{ borderColor: S.border, color: S.secondary }}>
                <Download size={13} /> CSV Export
              </button>
            </div>
          </div>

          {intelLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl" style={{ backgroundColor: S.border }} />)}
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              {intelKPIs && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="col-span-2 md:col-span-1 rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                    <p className="text-xs mb-1" style={{ color: S.muted }}>সর্বোচ্চ মার্জিন</p>
                    <p className="text-sm font-bold truncate" style={{ color: S.primary }}>{intelKPIs.bestMargin?.name ?? "—"}</p>
                    <p className="text-xs mt-0.5 font-semibold" style={{ color: S.primary }}>{intelKPIs.bestMargin ? `${intelKPIs.bestMargin.margin.toFixed(1)}%` : "—"}</p>
                  </div>
                  <div className="col-span-2 md:col-span-1 rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                    <p className="text-xs mb-1" style={{ color: S.muted }}>সর্বনিম্ন মার্জিন</p>
                    <p className="text-sm font-bold truncate" style={{ color: "#E24B4A" }}>{intelKPIs.worstMargin?.name ?? "—"}</p>
                    <p className="text-xs mt-0.5 font-semibold" style={{ color: "#E24B4A" }}>{intelKPIs.worstMargin ? `${intelKPIs.worstMargin.margin.toFixed(1)}%` : "—"}</p>
                  </div>
                  <div className="rounded-2xl border p-4" style={{ backgroundColor: intelKPIs.stockoutSoon > 0 ? "#FFF1F1" : S.surface, borderColor: intelKPIs.stockoutSoon > 0 ? "#FFCDD2" : S.border }}>
                    <p className="text-xs mb-1" style={{ color: S.muted }}>শেষ হওয়ার পথে</p>
                    <p className="text-xl font-bold" style={{ color: intelKPIs.stockoutSoon > 0 ? "#E24B4A" : S.text }}>{intelKPIs.stockoutSoon}</p>
                    <p className="text-xs mt-0.5" style={{ color: S.muted }}>৭ দিনের মধ্যে শেষ</p>
                  </div>
                  <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                    <p className="text-xs mb-1" style={{ color: S.muted }}>স্লো মুভার</p>
                    <p className="text-xl font-bold" style={{ color: "#EF9F27" }}>{intelKPIs.slowMovers}</p>
                    <p className="text-xs mt-0.5" style={{ color: S.muted }}>&lt;১ পিস/সপ্তাহ, ৩০+ স্টক</p>
                  </div>
                  <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                    <p className="text-xs mb-1" style={{ color: S.muted }}>মোট গ্রস প্রফিট</p>
                    <p className="text-xl font-bold" style={{ color: intelKPIs.totalGrossProfit >= 0 ? S.primary : "#E24B4A" }}>{formatBDT(intelKPIs.totalGrossProfit)}</p>
                    <p className="text-xs mt-0.5" style={{ color: S.muted }}>গত {intelDays} দিন</p>
                  </div>
                </div>
              )}

              {/* Sub-view tabs */}
              <div className="flex gap-2 border-b" style={{ borderColor: S.border }}>
                {[{ key: "profitability", label: "লাভজনকতা বিশ্লেষণ" }, { key: "stock", label: "স্টক ইন্টেলিজেন্স" }].map(v => (
                  <button key={v.key} onClick={() => setIntelView(v.key as typeof intelView)}
                    className="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
                    style={{ borderColor: intelView === v.key ? S.primary : "transparent", color: intelView === v.key ? S.primary : S.secondary }}>
                    {v.label}
                  </button>
                ))}
              </div>

              {/* Search + sort */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
                  <input value={intelSearch} onChange={e => setIntelSearch(e.target.value)}
                    placeholder="পণ্য, ক্যাটাগরি বা SKU..."
                    className="w-full pl-8 pr-3 h-9 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                </div>
                <span className="text-xs" style={{ color: S.muted }}>সাজান:</span>
                {intelView === "profitability"
                  ? [{ v: "profit", l: "লাভ" }, { v: "margin", l: "মার্জিন" }, { v: "revenue", l: "রাজস্ব" }, { v: "unitsSold", l: "বিক্রয়" }].map(s => (
                      <button key={s.v} onClick={() => setIntelSort(s.v as typeof intelSort)}
                        className="px-2 py-1 rounded-lg text-xs font-medium border transition-colors"
                        style={{ backgroundColor: intelSort === s.v ? S.primary : S.surface, color: intelSort === s.v ? "white" : S.secondary, borderColor: intelSort === s.v ? S.primary : S.border }}>
                        {s.l}
                      </button>
                    ))
                  : [{ v: "daysRemaining", l: "জরুরি" }, { v: "unitsSold", l: "বিক্রয়" }].map(s => (
                      <button key={s.v} onClick={() => setIntelSort(s.v as typeof intelSort)}
                        className="px-2 py-1 rounded-lg text-xs font-medium border transition-colors"
                        style={{ backgroundColor: intelSort === s.v ? S.primary : S.surface, color: intelSort === s.v ? "white" : S.secondary, borderColor: intelSort === s.v ? S.primary : S.border }}>
                        {s.l}
                      </button>
                    ))
                }
              </div>

              {/* ── Profitability table ── */}
              {intelView === "profitability" && (
                <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[800px]">
                      <thead>
                        <tr className="border-b" style={{ backgroundColor: "var(--c-surface)", borderColor: S.border }}>
                          {([
                            { label: "পণ্য", key: "name" },
                            { label: "ক্যাটাগরি", key: "category" },
                            { label: "ক্রয়মূল্য", key: "buyPrice" },
                            { label: "বিক্রয়মূল্য", key: "sellPrice" },
                            { label: "মার্জিন", key: "margin" },
                            { label: "বিক্রিত পিস", key: "unitsSold" },
                            { label: "রাজস্ব", key: "revenue" },
                            { label: "গ্রস প্রফিট", key: "profit" },
                          ] as { label: string; key: typeof intelSort }[]).map(h => (
                            <th key={h.key} onClick={() => setIntelSort(h.key)}
                              className="text-left px-3 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer select-none hover:opacity-75 transition-opacity"
                              style={{ color: intelSort === h.key ? S.primary : S.muted }}>
                              {h.label}{intelSort === h.key ? " ↓" : ""}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredIntelProducts.length === 0 ? (
                          <tr><td colSpan={8} className="text-center py-10 text-sm" style={{ color: S.muted }}>কোনো পণ্য পাওয়া যায়নি।</td></tr>
                        ) : filteredIntelProducts.map((p, i) => {
                          const marginColor = p.margin >= 40 ? S.primary : p.margin >= 20 ? "var(--bg-warning-text)" : "var(--bg-danger-text)";
                          const marginBg = p.margin >= 40 ? "var(--c-primary-light)" : p.margin >= 20 ? "var(--bg-warning-soft)" : "var(--bg-danger-soft)";
                          return (
                            <tr key={p.id} className="border-b last:border-0"
                              style={{ borderColor: S.border }}>
                              <td className="px-3 py-2.5">
                                <Link href={`/inventory/${p.id}`} className="font-medium hover:underline" style={{ color: S.text }}>{p.name}</Link>
                                {p.sku && <p className="text-[10px] font-mono mt-0.5" style={{ color: S.muted }}>{p.sku}</p>}
                              </td>
                              <td className="px-3 py-2.5 text-xs" style={{ color: S.muted }}>{p.category ?? "—"}</td>
                              <td className="px-3 py-2.5 text-sm" style={{ color: S.secondary }}>{formatBDT(p.buyPrice)}</td>
                              <td className="px-3 py-2.5 text-sm font-medium" style={{ color: S.text }}>{formatBDT(p.sellPrice)}</td>
                              <td className="px-3 py-2.5">
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                                  style={{ backgroundColor: marginBg, color: marginColor }}>
                                  {p.margin.toFixed(1)}%
                                </span>
                                <p className="text-[10px] mt-0.5" style={{ color: S.muted }}>
                                  ৳{(p.sellPrice - p.buyPrice).toFixed(0)}/পিস
                                </p>
                              </td>
                              <td className="px-3 py-2.5 font-semibold text-sm" style={{ color: S.primary }}>{p.unitsSold}</td>
                              <td className="px-3 py-2.5 text-sm" style={{ color: S.text }}>{formatBDT(p.revenue)}</td>
                              <td className="px-3 py-2.5 font-bold text-sm" style={{ color: p.grossProfit >= 0 ? S.primary : "#E24B4A" }}>{formatBDT(p.grossProfit)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Stock Intelligence table ── */}
              {intelView === "stock" && (
                <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[750px]">
                      <thead>
                        <tr className="border-b" style={{ backgroundColor: "var(--c-surface)", borderColor: S.border }}>
                          {["পণ্য", "বর্তমান স্টক", "সাপ্তাহিক বিক্রি", "দিন বাকি", "স্ট্যাটাস", "সরবরাহকারী", ""].map(h => (
                            <th key={h} className="text-left px-3 py-3 text-xs font-semibold whitespace-nowrap" style={{ color: S.muted }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredIntelProducts.length === 0 ? (
                          <tr><td colSpan={7} className="text-center py-10 text-sm" style={{ color: S.muted }}>কোনো পণ্য পাওয়া যায়নি।</td></tr>
                        ) : filteredIntelProducts.map((p, i) => {
                          const stockoutSoon = p.daysRemaining !== null && p.daysRemaining < 7 && p.stockQty > 0;
                          const slowMover = p.weeklyVelocity < 1 && p.stockQty > 30;
                          const outOfStock = p.stockQty === 0;
                          const isLowStock = p.stockQty > 0 && p.stockQty <= p.lowStockAt;
                          const needsPO = outOfStock || stockoutSoon || isLowStock;
                          const poParams = new URLSearchParams();
                          poParams.set("product", p.name);
                          if (p.supplierId) poParams.set("supplierId", p.supplierId);
                          return (
                            <tr key={p.id} className="border-b last:border-0"
                              style={{ backgroundColor: stockoutSoon || outOfStock ? "#FFF8F8" : i % 2 === 0 ? S.surface : "var(--c-surface)", borderColor: S.border }}>
                              <td className="px-3 py-2.5">
                                <Link href={`/inventory/${p.id}`} className="font-medium hover:underline" style={{ color: S.text }}>{p.name}</Link>
                                {p.sku && <p className="text-[10px] font-mono mt-0.5" style={{ color: S.muted }}>{p.sku}</p>}
                              </td>
                              <td className="px-3 py-2.5 font-bold text-sm"
                                style={{ color: p.stockQty === 0 ? "#E24B4A" : p.stockQty <= p.lowStockAt ? "#EF9F27" : S.text }}>
                                {p.stockQty}
                              </td>
                              <td className="px-3 py-2.5 text-sm" style={{ color: S.secondary }}>
                                {p.weeklyVelocity > 0 ? `${p.weeklyVelocity}/সপ্তাহ` : "বিক্রি নেই"}
                              </td>
                              <td className="px-3 py-2.5 text-sm font-semibold"
                                style={{ color: stockoutSoon ? "#E24B4A" : p.daysRemaining !== null && p.daysRemaining < 14 ? "#EF9F27" : S.secondary }}>
                                {outOfStock ? "শেষ" : p.daysRemaining !== null ? `${p.daysRemaining} দিন` : "—"}
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="flex flex-wrap gap-1">
                                  {outOfStock && (
                                    <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                      style={{ backgroundColor: "var(--bg-danger-soft)", color: "var(--bg-danger-text)" }}>
                                      <Package size={9} /> শেষ
                                    </span>
                                  )}
                                  {!outOfStock && stockoutSoon && (
                                    <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                      style={{ backgroundColor: "var(--bg-danger-soft)", color: "var(--bg-danger-text)" }}>
                                      <AlertTriangle size={9} /> শেষ হবে শীঘ্রই
                                    </span>
                                  )}
                                  {!outOfStock && !stockoutSoon && isLowStock && (
                                    <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                      style={{ backgroundColor: "var(--bg-warning-soft)", color: "var(--bg-warning-text)" }}>
                                      <AlertTriangle size={9} /> কম স্টক
                                    </span>
                                  )}
                                  {slowMover && (
                                    <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                      style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}>
                                      Slow Mover
                                    </span>
                                  )}
                                  {!outOfStock && !stockoutSoon && !isLowStock && !slowMover && p.weeklyVelocity > 0 && (
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                      style={{ backgroundColor: "var(--c-primary-light)", color: S.primary }}>
                                      স্বাভাবিক
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-xs" style={{ color: S.muted }}>
                                {p.supplierName ?? "—"}
                              </td>
                              <td className="px-3 py-2.5">
                                {needsPO && (
                                  <Link href={`/purchase-orders?${poParams.toString()}`}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap"
                                    style={{ backgroundColor: S.primary, color: "white" }}>
                                    <ShoppingCart size={11} /> PO তৈরি
                                  </Link>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── TAB 4: CUSTOMER LTV ──────────────────────────────────────── */}
      {tab === "ltv" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="মোট কাস্টমার" value={customers.length.toString()} sub="সব মিলিয়ে" />
            <StatCard label="Repeat Customer" value={ltvData.filter(c => c.orderCount > 1).length.toString()}
              sub={`${ltvData.length > 0 ? Math.round((ltvData.filter(c => c.orderCount > 1).length / ltvData.length) * 100) : 0}% retention rate`} color={S.primary} />
            <StatCard label="সর্বোচ্চ LTV" value={formatBDT(sortedLtv[0]?.revenue ?? 0)} sub={sortedLtv[0]?.name ?? "—"} color="#EF9F27" />
            <StatCard label="গড় LTV" value={formatBDT(ltvData.length > 0 ? ltvData.reduce((s, c) => s + c.revenue, 0) / ltvData.length : 0)} sub="per customer" />
          </div>

          {/* LTV Bar chart */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h3 className="font-semibold text-sm mb-4" style={{ color: S.text }}>সেরা ৮ কাস্টমার — মোট কেনাকাটা</h3>
            {topLtv10Chart.length === 0
              ? <p className="text-center py-8 text-sm" style={{ color: S.muted }}>কোনো তথ্য নেই।</p>
              : <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={topLtv10Chart} margin={{ left: -20, right: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: S.muted }} />
                    <YAxis tick={{ fontSize: 9, fill: S.muted }} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => [`৳${(Number(v) || 0).toLocaleString()}`]} contentStyle={{ borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 12 }} />
                    <Bar dataKey="revenue" name="মোট কেনা (৳)" fill="#2B7CE9" radius={[4, 4, 0, 0]}>
                      {topLtv10Chart.map((_, i) => <Cell key={i} fill={i === 0 ? "#EF9F27" : i === 1 ? S.primary : "#2B7CE9"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* New vs repeat */}
            <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <h3 className="font-semibold text-sm mb-4" style={{ color: S.text }}>নতুন vs পুরনো কাস্টমার</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={repeatCustomers} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value">
                    {repeatCustomers.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Legend iconSize={10} formatter={v => <span style={{ fontSize: 11, color: S.secondary }}>{v}</span>} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Due leaderboard */}
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
              <div className="px-4 py-3 border-b" style={{ backgroundColor: "var(--c-surface)", borderColor: S.border }}>
                <h3 className="font-semibold text-sm" style={{ color: S.text }}>বাকির তালিকা — শীর্ষ ১০</h3>
              </div>
              {topDueCustomers.length === 0
                ? <p className="text-center py-8 text-sm" style={{ color: S.muted }}>কোনো due নেই! সব clear।</p>
                : topDueCustomers.slice(0, 6).map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3 px-4 py-2.5 border-b last:border-0"
                      style={{ borderColor: S.border }}>
                      <span className="text-sm font-bold w-5 text-center" style={{ color: i < 3 ? "#EF9F27" : S.muted }}>#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: S.text }}>{c.name}</p>
                        <p className="text-[10px]" style={{ color: S.muted }}>{c._count.orders}টি অর্ডার</p>
                      </div>
                      <p className="font-bold text-xs" style={{ color: "#E24B4A" }}>{formatBDT(c.dueAmount)}</p>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Full LTV table */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
            <div className="px-5 py-3 border-b flex items-center justify-between flex-wrap gap-2" style={{ backgroundColor: "var(--c-surface)", borderColor: S.border }}>
              <h3 className="font-semibold text-sm" style={{ color: S.text }}>Customer Lifetime Value র‍্যাংকিং</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: S.muted }}>সাজান:</span>
                {[{ v: "revenue", l: "মোট কেনা" }, { v: "orders", l: "অর্ডার" }, { v: "avg", l: "গড় অর্ডার" }].map(s => (
                  <button key={s.v} onClick={() => setLtvSort(s.v as typeof ltvSort)}
                    className="px-2 py-1 rounded-lg text-xs font-medium border transition-colors"
                    style={{ backgroundColor: ltvSort === s.v ? S.primary : "white", color: ltvSort === s.v ? "white" : S.secondary, borderColor: ltvSort === s.v ? S.primary : S.border }}>
                    {s.l}
                  </button>
                ))}
                <button onClick={() => downloadExcel(sortedLtv.map((r, i) => ({ র‍্যাংক: i + 1, নাম: r.name, ফোন: r.phone ?? "", Group: r.group, "মোট কেনা (৳)": r.revenue, "অর্ডার সংখ্যা": r.orderCount, "গড় অর্ডার (৳)": r.avgOrder, "প্রথম অর্ডার": r.firstOrder.slice(0, 10), "শেষ অর্ডার": r.lastOrder.slice(0, 10) })), "customer-ltv.xlsx")}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border" style={{ borderColor: S.border, color: S.secondary }}>
                  <Download size={12} /> Excel
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ backgroundColor: "var(--c-surface)", borderColor: S.border }}>
                    {["#", "নাম", "Group", "মোট কেনা", "অর্ডার", "গড় অর্ডার", "প্রথম অর্ডার", "শেষ অর্ডার"].map(h => (
                      <th key={h} className="text-left px-4 py-2 text-xs font-semibold whitespace-nowrap" style={{ color: S.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedLtv.map((c, i) => (
                    <tr key={c.id} className="border-b last:border-0" style={{ borderColor: S.border }}>
                      <td className="px-4 py-2 text-xs font-bold w-6" style={{ color: i < 3 ? "#EF9F27" : S.muted }}>#{i + 1}</td>
                      <td className="px-4 py-2 font-medium" style={{ color: S.text }}>{c.name}</td>
                      <td className="px-4 py-2">
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ backgroundColor: c.group === "vip" ? "var(--bg-warning-soft)" : c.group === "wholesale" ? "var(--bg-info-soft)" : "var(--c-bg)", color: c.group === "vip" ? "var(--bg-warning-text)" : c.group === "wholesale" ? "var(--bg-info-text)" : S.muted }}>
                          {c.group}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-bold" style={{ color: S.primary }}>{formatBDT(c.revenue)}</td>
                      <td className="px-4 py-2" style={{ color: S.secondary }}>{c.orderCount}টি</td>
                      <td className="px-4 py-2" style={{ color: S.secondary }}>{formatBDT(c.avgOrder)}</td>
                      <td className="px-4 py-2 text-xs" style={{ color: S.muted }}>{c.firstOrder.slice(0, 10)}</td>
                      <td className="px-4 py-2 text-xs" style={{ color: S.muted }}>{c.lastOrder.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: COD COLLECTION REPORT ────────────────────────────── */}
      {tab === "cod" && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border p-4" style={{ backgroundColor: "var(--c-primary-light)", borderColor: "#A3E4CC" }}>
              <p className="text-xs mb-1" style={{ color: "var(--bg-success-text)" }}>সংগ্রহ হয়েছে</p>
              <p className="text-2xl font-bold" style={{ color: "var(--c-primary)" }}>{formatBDT(codSummary.all.collectedAmt)}</p>
              <p className="text-xs mt-1" style={{ color: "var(--bg-success-text)" }}>{codSummary.all.collected}টি অর্ডার</p>
            </div>
            <div className="rounded-2xl border p-4" style={{ backgroundColor: "var(--bg-warning-soft)", borderColor: "var(--bg-warning-border)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--bg-warning-text)" }}>Courier-এ আছে (Pending)</p>
              <p className="text-2xl font-bold" style={{ color: "var(--bg-warning-text)" }}>{formatBDT(codSummary.all.pendingAmt)}</p>
              <p className="text-xs mt-1" style={{ color: "var(--bg-warning-text)" }}>{codSummary.all.pending}টি অর্ডার</p>
            </div>
            <div className="rounded-2xl border p-4" style={{ backgroundColor: "var(--bg-danger-soft)", borderColor: "var(--bg-danger-border)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--bg-danger-text)" }}>Return হয়েছে</p>
              <p className="text-2xl font-bold" style={{ color: "var(--bg-danger-text)" }}>{formatBDT(codSummary.all.returnedAmt)}</p>
              <p className="text-xs mt-1" style={{ color: "var(--bg-danger-text)" }}>{codSummary.all.returned}টি অর্ডার</p>
            </div>
          </div>

          {/* COD collection rate */}
          {codSummary.all.total > 0 && (
            <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm" style={{ color: S.text }}>COD সংগ্রহের হার</h3>
                <span className="text-sm font-bold" style={{ color: S.primary }}>
                  {Math.round((codSummary.all.collected / codSummary.all.total) * 100)}%
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--c-border)" }}>
                <div className="h-full rounded-full" style={{
                  width: `${Math.round((codSummary.all.collected / codSummary.all.total) * 100)}%`,
                  backgroundColor: S.primary
                }} />
              </div>
              <div className="flex justify-between mt-2 text-xs" style={{ color: S.muted }}>
                <span>মোট {codSummary.all.total}টি COD অর্ডার</span>
                <span>মোট COD মূল্য: {formatBDT(codSummary.all.totalAmt)}</span>
              </div>
            </div>
          )}

          {/* Per courier breakdown */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { key: "pathao", label: "🚚 Pathao", data: codSummary.pathao },
              { key: "ecourier", label: "📦 eCourier", data: codSummary.ecourier },
              { key: "other", label: "🏍️ অন্যান্য", data: codSummary.other },
            ].map(cn => (
              <div key={cn.key} className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <h3 className="font-semibold text-sm mb-3" style={{ color: S.text }}>{cn.label}</h3>
                <div className="space-y-2">
                  {[
                    { label: "সংগ্রহ হয়েছে", count: cn.data.collected, amt: cn.data.collectedAmt, color: S.primary },
                    { label: "Pending", count: cn.data.pending, amt: cn.data.pendingAmt, color: "#EF9F27" },
                    { label: "Return", count: cn.data.returned, amt: cn.data.returnedAmt, color: "#E24B4A" },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between text-xs">
                      <span style={{ color: S.muted }}>{row.label} ({row.count}টি)</span>
                      <span className="font-semibold" style={{ color: row.color }}>{formatBDT(row.amt)}</span>
                    </div>
                  ))}
                  <div className="pt-1.5 mt-1.5 border-t text-xs font-semibold flex justify-between" style={{ borderColor: S.border }}>
                    <span style={{ color: S.muted }}>মোট {cn.data.total}টি</span>
                    <span style={{ color: S.text }}>{formatBDT(cn.data.totalAmt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Monthly COD trend */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h3 className="font-semibold text-sm mb-4" style={{ color: S.text }}>মাসিক COD ট্রেন্ড</h3>
            {codMonthly.length === 0
              ? <p className="text-center py-8 text-sm" style={{ color: S.muted }}>কোনো COD collected হয়নি।</p>
              : <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={codMonthly} margin={{ left: -20, right: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: S.muted }} />
                    <YAxis tick={{ fontSize: 10, fill: S.muted }} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => [`৳${(Number(v) || 0).toLocaleString()}`]} contentStyle={{ borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 12 }} />
                    <Legend iconSize={9} formatter={v => <span style={{ fontSize: 10, color: S.secondary }}>{v}</span>} />
                    <Bar dataKey="collected" name="সংগ্রহ" fill="var(--c-primary)" radius={[3, 3, 0, 0]} stackId="a" />
                    <Bar dataKey="pending" name="Pending" fill="#EF9F27" radius={[3, 3, 0, 0]} stackId="a" />
                    <Bar dataKey="returned" name="Return" fill="#E24B4A" radius={[3, 3, 0, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>
        </div>
      )}

      {/* ─── TAB 6: P&L ───────────────────────────────────────────────── */}
      {tab === "pl" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm" style={{ color: S.muted }}>সব সময়ের P&L হিসাব</p>
            <div className="flex gap-2">
              <button onClick={exportPL}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium"
                style={{ borderColor: S.border, color: S.secondary }}>
                <FileSpreadsheet size={15} /> Excel
              </button>
              <button onClick={() => window.print()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium"
                style={{ borderColor: S.border, color: S.secondary }}>
                <Download size={15} /> Print
              </button>
            </div>
          </div>

          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h3 className="font-semibold text-sm mb-4" style={{ color: S.text }}>মাসিক আয় ও লাভ</h3>
            {monthlyPL.length === 0
              ? <p className="text-center py-8 text-sm" style={{ color: S.muted }}>কোনো তথ্য নেই।</p>
              : <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyPL} margin={{ left: -20, right: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: S.muted }} />
                    <YAxis tick={{ fontSize: 10, fill: S.muted }} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => [`৳${(Number(v) || 0).toLocaleString()}`]} contentStyle={{ borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 12 }} />
                    <Legend iconSize={10} formatter={v => <span style={{ fontSize: 11, color: S.secondary }}>{v}</span>} />
                    <Bar dataKey="revenue" name="বিক্রি" fill="var(--c-primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cogs" name="COGS" fill="#EF9F27" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="খরচ" fill="#E24B4A" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="netProfit" name="নেট লাভ" fill="#2B7CE9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <h3 className="font-semibold text-sm mb-4" style={{ color: S.text }}>ক্যাটাগরি অনুযায়ী খরচ</h3>
              {expenseByCategory.length === 0
                ? <p className="text-center py-8 text-sm" style={{ color: S.muted }}>কোনো manual খরচ নেই।</p>
                : <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                        {expenseByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Legend iconSize={9} formatter={v => <span style={{ fontSize: 10, color: S.secondary }}>{v}</span>} />
                      <Tooltip formatter={(v) => [`৳${(Number(v) || 0).toLocaleString()}`, "খরচ"]} contentStyle={{ borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
              }
            </div>

            <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <h3 className="font-semibold text-sm mb-4" style={{ color: S.text }}>নেট লাভের ট্রেন্ড</h3>
              {monthlyPL.length === 0
                ? <p className="text-center py-8 text-sm" style={{ color: S.muted }}>কোনো তথ্য নেই।</p>
                : <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={monthlyPL} margin={{ left: -20, right: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: S.muted }} />
                      <YAxis tick={{ fontSize: 10, fill: S.muted }} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => [`৳${(Number(v) || 0).toLocaleString()}`, "নেট লাভ"]} contentStyle={{ borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 12 }} />
                      <Line type="monotone" dataKey="netProfit" stroke="#2B7CE9" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
              }
            </div>
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
            <div className="px-5 py-3 border-b" style={{ backgroundColor: "var(--c-surface)", borderColor: S.border }}>
              <h3 className="font-semibold text-sm" style={{ color: S.text }}>মাসিক বিবরণী</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ backgroundColor: "var(--c-surface)", borderColor: S.border }}>
                    {["মাস", "বিক্রি", "COGS", "অন্যান্য খরচ", "নেট লাভ", "মার্জিন"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap" style={{ color: S.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthlyPL.map((row, i) => {
                    const margin = row.revenue > 0 ? Math.round((row.netProfit / row.revenue) * 100) : 0;
                    return (
                      <tr key={row.month} className="border-b last:border-0"
                        style={{ borderColor: S.border }}>
                        <td className="px-4 py-3 font-medium" style={{ color: S.text }}>{row.month}</td>
                        <td className="px-4 py-3" style={{ color: S.primary }}>{formatBDT(row.revenue)}</td>
                        <td className="px-4 py-3" style={{ color: "#EF9F27" }}>{formatBDT(row.cogs)}</td>
                        <td className="px-4 py-3" style={{ color: "#E24B4A" }}>{formatBDT(row.expenses)}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: row.netProfit >= 0 ? S.primary : "#E24B4A" }}>{formatBDT(row.netProfit)}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: margin >= 20 ? "var(--c-primary-light)" : margin >= 10 ? "var(--bg-warning-soft)" : "var(--bg-danger-soft)", color: margin >= 20 ? S.primary : margin >= 10 ? "var(--bg-warning-text)" : "var(--bg-danger-text)" }}>
                            {margin}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* AI বিশ্লেষণ Tab */}
      {tab === "ai" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold" style={{ color: S.text }}>AI বিক্রয় বিশ্লেষণ</h3>
              <p className="text-xs mt-0.5" style={{ color: S.muted }}>গত ৩০ দিনের ডেটা বিশ্লেষণ করে AI পরামর্শ দেবে</p>
            </div>
            {!aiInsight ? (
              <button onClick={() => fetchAiInsight()} disabled={aiInsightLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-60 transition-colors"
                style={{ backgroundColor: S.primary }}>
                {aiInsightLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {aiInsightLoading ? "বিশ্লেষণ হচ্ছে..." : "বিশ্লেষণ শুরু করুন"}
              </button>
            ) : (
              <button onClick={() => fetchAiInsight(true)} disabled={aiInsightLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border font-medium disabled:opacity-60 transition-colors hover:bg-gray-50"
                style={{ borderColor: S.border, color: S.secondary }}>
                {aiInsightLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                আপডেট করুন
              </button>
            )}
          </div>

          {aiInsightError && (
            <div className="p-4 rounded-xl text-sm" style={{ background: "var(--bg-danger-soft)", color: "var(--bg-danger-text)" }}>
              {aiInsightError}
            </div>
          )}

          {!aiInsight && !aiInsightLoading && !aiInsightError && (
            <div className="rounded-2xl border p-10 text-center" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <Sparkles size={36} className="mx-auto mb-3" style={{ color: "rgba(15,110,86,0.3)" }} />
              <p className="font-medium mb-1" style={{ color: S.text }}>AI বিশ্লেষণ শুরু হয়নি</p>
              <p className="text-sm" style={{ color: S.muted }}>উপরের বাটনে ক্লিক করুন — AI আপনার বিক্রয় ডেটা বিশ্লেষণ করে পরামর্শ দেবে।</p>
            </div>
          )}

          {aiInsightLoading && (
            <div className="rounded-2xl border p-10 text-center" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: S.primary }} />
              <p className="text-sm" style={{ color: S.muted }}>AI আপনার ব্যবসার ডেটা বিশ্লেষণ করছে...</p>
            </div>
          )}

          {aiInsight && !aiInsightLoading && (
            <div className="space-y-4">
              {aiInsight.cached && (
                <p className="text-xs" style={{ color: S.muted }}>
                  ক্যাশ থেকে দেখানো হচ্ছে · {aiInsight.cachedAt ? new Date(aiInsight.cachedAt).toLocaleTimeString("bn-BD") : ""}
                </p>
              )}

              {/* Alert */}
              {aiInsight.alert && (
                <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "var(--bg-warning-soft)", border: "1px solid rgba(239,159,39,0.35)" }}>
                  <AlertTriangle size={16} style={{ color: "var(--bg-warning-text)", flexShrink: 0, marginTop: 2 }} />
                  <p className="text-sm font-medium" style={{ color: "var(--bg-warning-text)" }}>{aiInsight.alert}</p>
                </div>
              )}

              {/* Top Opportunity */}
              <div className="p-4 rounded-2xl" style={{ background: "rgba(15,110,86,0.06)", border: "1px solid rgba(15,110,86,0.2)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} style={{ color: S.primary }} />
                  <span className="text-sm font-semibold" style={{ color: S.primary }}>সবচেয়ে বড় সুযোগ</span>
                </div>
                <p className="text-sm" style={{ color: S.text }}>{aiInsight.topOpportunity}</p>
              </div>

              {/* Insights */}
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
                <div className="px-5 py-3 border-b" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                  <h4 className="text-sm font-semibold" style={{ color: S.text }}>মূল পর্যবেক্ষণ</h4>
                </div>
                <div className="divide-y" style={{ borderColor: S.border }}>
                  {aiInsight.insights.map((item, i) => (
                    <div key={i} className="px-5 py-3 flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: "rgba(15,110,86,0.1)", color: S.primary }}>{i + 1}</span>
                      <p className="text-sm" style={{ color: S.text }}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
                <div className="px-5 py-3 border-b" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                  <h4 className="text-sm font-semibold" style={{ color: S.text }}>AI পরামর্শ</h4>
                </div>
                <div className="divide-y" style={{ borderColor: S.border }}>
                  {aiInsight.recommendations.map((item, i) => (
                    <div key={i} className="px-5 py-3 flex items-start gap-3">
                      <span className="text-base flex-shrink-0">{["💡", "📈", "🎯", "⚡", "🔑"][i % 5]}</span>
                      <p className="text-sm" style={{ color: S.text }}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </PlanGate>
  );
}
