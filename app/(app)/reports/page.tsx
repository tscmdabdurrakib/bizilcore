"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import PlanGate from "@/components/PlanGate";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, AreaChart, Area,
} from "recharts";
import { formatBDT } from "@/lib/utils";
import {
  Download, FileSpreadsheet, TrendingUp, TrendingDown, Calendar, Search,
  ShoppingCart, AlertTriangle, Package, Sparkles, Loader2, RefreshCw,
  BarChart2, Users, CreditCard, DollarSign, Star, Truck, ArrowUpRight,
  ArrowDownRight, Zap, Target, Activity,
} from "lucide-react";
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
  { key: "sales",        label: "বিক্রি রিপোর্ট",    icon: TrendingUp },
  { key: "bestSelling",  label: "সেরা পণ্য",          icon: Star },
  { key: "profitProd",   label: "পণ্যে লাভ",          icon: DollarSign },
  { key: "intelligence", label: "প্রোডাক্ট বিশ্লেষণ", icon: BarChart2 },
  { key: "ltv",          label: "Customer LTV",       icon: Users },
  { key: "cod",          label: "COD রিপোর্ট",        icon: Truck },
  { key: "pl",           label: "P&L রিপোর্ট",        icon: Activity },
  { key: "ai",           label: "✨ AI বিশ্লেষণ",     icon: Sparkles },
];

const PIE_COLORS = ["#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6", "#14B8A6", "#F97316"];
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

const PRESET_RANGES = [
  { label: "আজ", days: 0 },
  { label: "৭ দিন", days: 7 },
  { label: "৩০ দিন", days: 30 },
  { label: "এই মাস", days: -1 },
  { label: "৯০ দিন", days: 90 },
];

const chartTooltipStyle = {
  borderRadius: 12,
  border: "1px solid #E5E7EB",
  boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
  fontSize: 12,
  padding: "8px 12px",
};

function StatCard({
  label, value, sub, icon: Icon, color, gradient, trend, trendValue,
}: {
  label: string; value: string; sub?: string;
  icon?: React.ElementType; color?: string; gradient?: string;
  trend?: "up" | "down"; trendValue?: string;
}) {
  const bg = gradient ?? "linear-gradient(135deg, #10B981 0%, #059669 100%)";
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        {Icon ? (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: bg }}>
            <Icon size={17} color="#fff" />
          </div>
        ) : <div />}
        {trend && trendValue && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${trend === "up" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
            {trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-xl font-black leading-tight" style={{ color: color ?? "#111827" }}>{value}</p>
      <p className="text-xs text-gray-400 mt-1 font-medium">{label}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

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

  const [intelProducts, setIntelProducts] = useState<IntelProduct[]>([]);
  const [intelLoading, setIntelLoading] = useState(false);
  const [intelDays, setIntelDays] = useState(30);
  const [intelFetched, setIntelFetched] = useState(false);
  const [intelSort, setIntelSort] = useState<"margin" | "profit" | "revenue" | "unitsSold" | "daysRemaining" | "name" | "category" | "buyPrice" | "sellPrice">("profit");
  const [intelSearch, setIntelSearch] = useState("");
  const [intelView, setIntelView] = useState<"profitability" | "stock">("profitability");

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

  const validOrders = useMemo(() =>
    orders.filter(o => COUNTED.includes(o.status) && new Date(o.createdAt) >= start && new Date(o.createdAt) <= end),
    [orders, start, end]);

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

  const rangeDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const prevEnd = useMemo(() => { const d = new Date(start); d.setDate(d.getDate() - 1); return d; }, [start]);
  const prevStart = useMemo(() => { const d = new Date(prevEnd); d.setDate(d.getDate() - rangeDays + 1); return d; }, [prevEnd, rangeDays]);
  const prevOrders = useMemo(() =>
    orders.filter(o => COUNTED.includes(o.status) && new Date(o.createdAt) >= prevStart && new Date(o.createdAt) <= prevEnd),
    [orders, prevStart, prevEnd]);
  const prevRevenue = prevOrders.reduce((s, o) => s + o.totalAmount, 0);
  const revenueChange = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

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
      { name: "পুরনো কাস্টমার", value: repeat, color: "#10B981" },
      { name: "নতুন কাস্টমার", value: newC, color: "#3B82F6" },
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
      p.name, p.sku ?? "", p.category ?? "", p.buyPrice, p.sellPrice,
      p.unitsSold, p.revenue, p.grossProfit, p.margin, p.weeklyVelocity, p.stockQty, p.daysRemaining ?? "N/A",
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
    <div className="max-w-7xl mx-auto space-y-4 animate-pulse">
      <div className="h-16 bg-gray-100 rounded-2xl" />
      <div className="h-10 bg-gray-100 rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-gray-100 rounded-2xl" />
    </div>
  );

  const sortBtn = (label: string, isActive: boolean, onClick: () => void) => (
    <button key={label} onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
      style={{
        backgroundColor: isActive ? "#10B981" : "white",
        color: isActive ? "white" : "#6B7280",
        borderColor: isActive ? "#10B981" : "#E5E7EB",
      }}>
      {label}
    </button>
  );

  return (
    <PlanGate feature="reports">
    <div className="max-w-7xl mx-auto space-y-4">

      {/* Page Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)" }}>
            <BarChart2 size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">রিপোর্ট</h1>
            <p className="text-xs text-gray-400 font-medium">বিক্রি, লাভ ও পারফরম্যান্সের বিস্তারিত বিশ্লেষণ</p>
          </div>
        </div>
        <button onClick={exportFullReport}
          className="flex items-center gap-2 px-4 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0">
          <FileSpreadsheet size={15} className="text-green-600" /> Full Export
        </button>
      </div>

      {/* Multi-shop banner */}
      {shopBranches.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm bg-emerald-50 border border-emerald-200">
          <span>🏪</span>
          <span className="text-emerald-800">
            <strong>সব শাখার সম্মিলিত রিপোর্ট</strong> — মূল শপ + {shopBranches.map(b => b.name).join(", ")}
          </span>
        </div>
      )}

      {/* Tab Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-1.5 shadow-sm">
        <div className="flex overflow-x-auto gap-1">
          {REPORT_TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
              style={{
                backgroundColor: tab === t.key ? "#10B981" : "transparent",
                color: tab === t.key ? "white" : "#6B7280",
              }}>
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-gray-400">
          <Calendar size={15} />
          <span className="text-xs font-semibold text-gray-500">তারিখ ফিল্টার</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none text-gray-700 focus:border-emerald-400 transition-colors" />
          <span className="text-sm text-gray-300 font-bold">—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none text-gray-700 focus:border-emerald-400 transition-colors" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {PRESET_RANGES.map(p => (
            <button key={p.label} onClick={() => applyPreset(p.days)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all">
              {p.label}
            </button>
          ))}
        </div>
        <span className="text-xs ml-auto text-gray-400 font-medium">
          {validOrders.length}টি valid অর্ডার
        </span>
      </div>

      {/* ─── TAB 1: SALES ─────────────────────────────────────────────── */}
      {tab === "sales" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="মোট বিক্রি" value={formatBDT(totalRevenue)}
              sub={`${validOrders.length}টি অর্ডার`}
              icon={TrendingUp} gradient="linear-gradient(135deg,#10B981,#059669)"
              trend={revenueChange >= 0 ? "up" : "down"} trendValue={`${Math.abs(revenueChange)}%`}
            />
            <StatCard
              label="গড় অর্ডার মূল্য" value={formatBDT(avgOrderValue)}
              sub="প্রতি অর্ডারে"
              icon={CreditCard} gradient="linear-gradient(135deg,#3B82F6,#1D4ED8)"
            />
            <StatCard
              label="মোট পরিশোধিত" value={formatBDT(totalPaid)}
              sub="সংগৃহীত"
              icon={DollarSign} gradient="linear-gradient(135deg,#8B5CF6,#6D28D9)"
            />
            <StatCard
              label="মোট বাকি" value={formatBDT(totalDue)}
              sub="due amount"
              icon={AlertTriangle} gradient="linear-gradient(135deg,#F59E0B,#D97706)"
              color={totalDue > 0 ? "#D97706" : "#111827"}
            />
          </div>

          {/* Sales trend area chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-gray-900">দৈনিক বিক্রির ট্রেন্ড</h3>
                <p className="text-xs text-gray-400 mt-0.5">{dateFrom} থেকে {dateTo}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                রাজস্ব
              </div>
            </div>
            {salesByDay.length === 0
              ? <div className="flex flex-col items-center justify-center py-14 text-gray-400">
                  <TrendingUp size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">এই সময়ে কোনো বিক্রি নেই।</p>
                </div>
              : <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={salesByDay} margin={{ left: -10, right: 4 }}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v) => [`৳${(Number(v) || 0).toLocaleString()}`, "বিক্রি"]}
                      contentStyle={chartTooltipStyle}
                      cursor={{ stroke: "#10B981", strokeWidth: 1, strokeDasharray: "4 4" }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} fill="url(#salesGradient)" dot={false} activeDot={{ r: 5, fill: "#10B981", stroke: "#fff", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
            }
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Period comparison */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">এই পিরিয়ড vs আগের পিরিয়ড</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "এই পিরিয়ড", value: formatBDT(totalRevenue), orders: validOrders.length, bg: "bg-emerald-50", color: "#10B981", border: "border-emerald-200" },
                  { label: "আগের পিরিয়ড", value: formatBDT(prevRevenue), orders: prevOrders.length, bg: "bg-gray-50", color: "#6B7280", border: "border-gray-200" },
                ].map(col => (
                  <div key={col.label} className={`text-center p-4 rounded-2xl ${col.bg} border ${col.border}`}>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{col.label}</p>
                    <p className="text-xl font-black" style={{ color: col.color }}>{col.value}</p>
                    <p className="text-xs text-gray-400 mt-1.5 font-medium">{col.orders}টি অর্ডার</p>
                  </div>
                ))}
              </div>
              <div className={`mt-3 flex items-center gap-2 p-3 rounded-xl ${revenueChange >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                {revenueChange >= 0
                  ? <ArrowUpRight size={16} className="text-emerald-600" />
                  : <ArrowDownRight size={16} className="text-red-500" />}
                <span className={`text-sm font-bold ${revenueChange >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {revenueChange > 0 ? "+" : ""}{revenueChange}% পরিবর্তন
                </span>
                <span className="text-xs text-gray-400">আগের একই সময়ের তুলনায়</span>
              </div>
            </div>

            {/* Order status pie */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">অর্ডার স্ট্যাটাস বিভাজন</h3>
              {statusBreakdown.length === 0
                ? <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <Activity size={28} className="mb-2 opacity-30" />
                    <p className="text-sm">কোনো অর্ডার নেই।</p>
                  </div>
                : <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie data={statusBreakdown} cx="45%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={2}>
                        {statusBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Legend iconSize={9} iconType="circle" formatter={v => <span style={{ fontSize: 11, color: "#6B7280" }}>{v}</span>} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
              }
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: BEST SELLING PRODUCTS ─────────────────────────────── */}
      {tab === "bestSelling" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="মোট বিক্রিত পিস" value={bestSellingData.reduce((s, p) => s + p.qty, 0).toLocaleString() + " পিস"}
              icon={Package} gradient="linear-gradient(135deg,#10B981,#059669)" />
            <StatCard label="সেরা বিক্রেতা" value={top10ByQty[0]?.name?.slice(0, 16) ?? "—"}
              sub={`${top10ByQty[0]?.qty ?? 0} পিস`}
              icon={Star} gradient="linear-gradient(135deg,#F59E0B,#D97706)" />
            <StatCard label="মোট ক্যাটাগরি" value={categoryRevenue.length.toString()}
              sub="active categories"
              icon={Target} gradient="linear-gradient(135deg,#8B5CF6,#6D28D9)" />
          </div>

          {/* Top 10 by qty */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-gray-900">সেরা ১০ পণ্য — পরিমাণ অনুযায়ী</h3>
                <p className="text-xs text-gray-400 mt-0.5">সবচেয়ে বেশি পিস বিক্রি হয়েছে</p>
              </div>
              <button onClick={() => downloadExcel(top10ByQty.map(r => ({ পণ্য: r.name, পরিমাণ: r.qty, "রাজস্ব (৳)": r.revenue })), "best-selling-qty.xlsx")}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors font-semibold">
                <Download size={12} /> Excel
              </button>
            </div>
            {top10ByQty.length === 0
              ? <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Star size={28} className="mb-2 opacity-30" />
                  <p className="text-sm">এই সময়ে কোনো বিক্রি নেই।</p>
                </div>
              : <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={top10ByQty.map(p => ({ name: p.name.length > 15 ? p.name.slice(0, 15) + "…" : p.name, পরিমাণ: p.qty }))}
                    layout="vertical" margin={{ left: 0, right: 50 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [v + " পিস", "পরিমাণ"]} />
                    <Bar dataKey="পরিমাণ" radius={[0, 6, 6, 0]} maxBarSize={22}>
                      {top10ByQty.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? "#F59E0B" : i === 1 ? "#3B82F6" : i === 2 ? "#8B5CF6" : "#10B981"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>

          {/* Top 10 by revenue */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-gray-900">সেরা ১০ পণ্য — রাজস্ব অনুযায়ী</h3>
                <p className="text-xs text-gray-400 mt-0.5">সবচেয়ে বেশি আয় হয়েছে</p>
              </div>
              <button onClick={() => downloadExcel(top10ByRevenue.map(r => ({ পণ্য: r.name, "রাজস্ব (৳)": r.revenue, পরিমাণ: r.qty })), "best-selling-revenue.xlsx")}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors font-semibold">
                <Download size={12} /> Excel
              </button>
            </div>
            {top10ByRevenue.length === 0
              ? <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Star size={28} className="mb-2 opacity-30" />
                  <p className="text-sm">এই সময়ে কোনো বিক্রি নেই।</p>
                </div>
              : <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={top10ByRevenue.map(p => ({ name: p.name.length > 15 ? p.name.slice(0, 15) + "…" : p.name, "রাজস্ব (৳)": p.revenue }))}
                    layout="vertical" margin={{ left: 0, right: 60 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`৳${(Number(v)||0).toLocaleString()}`, "রাজস্ব"]} />
                    <Bar dataKey="রাজস্ব (৳)" radius={[0, 6, 6, 0]} maxBarSize={22}>
                      {top10ByRevenue.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? "#F59E0B" : i === 1 ? "#10B981" : i === 2 ? "#8B5CF6" : "#3B82F6"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>

          {/* Category breakdown */}
          {categoryRevenue.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">ক্যাটাগরি অনুযায়ী বিক্রি</h3>
              <div className="flex gap-6 items-center flex-wrap">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie data={categoryRevenue} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                      {categoryRevenue.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`৳${(Number(v)||0).toLocaleString()}`, "বিক্রি"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2 min-w-[160px]">
                  {[...categoryRevenue].sort((a, b) => b.value - a.value).map((cat, i) => (
                    <div key={cat.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-sm text-gray-700 flex-1 font-medium">{cat.name}</span>
                      <span className="text-sm font-bold text-gray-900">{formatBDT(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Full table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">সব পণ্যের বিক্রি বিবরণী</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["#", "পণ্য", "ক্যাটাগরি", "পরিমাণ বিক্রি", "রাজস্ব"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...bestSellingData].sort((a, b) => b.qty - a.qty).map((p, i) => (
                    <tr key={p.name} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-black w-8" style={{ color: i === 0 ? "#F59E0B" : i === 1 ? "#9CA3AF" : i === 2 ? "#D97706" : "#D1D5DB" }}>#{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{p.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{p.category ?? "—"}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{p.qty} পিস</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{formatBDT(p.revenue)}</td>
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
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="মোট বিক্রয় রাজস্ব" value={formatBDT(totalRevAll)}
              sub="সব সময়ের" icon={TrendingUp} gradient="linear-gradient(135deg,#3B82F6,#1D4ED8)" />
            <StatCard label="মোট COGS" value={formatBDT(totalCogs)}
              sub="ক্রয়মূল্য" icon={Package} gradient="linear-gradient(135deg,#F59E0B,#D97706)" />
            <StatCard label="মোট লাভ" value={formatBDT(totalProfit)}
              icon={DollarSign}
              gradient={totalProfit >= 0 ? "linear-gradient(135deg,#10B981,#059669)" : "linear-gradient(135deg,#EF4444,#DC2626)"}
              color={totalProfit >= 0 ? "#059669" : "#DC2626"}
              sub="gross profit" />
            <StatCard label="গড় মার্জিন" value={`${overallMargin}%`}
              icon={Activity}
              gradient={overallMargin >= 20 ? "linear-gradient(135deg,#10B981,#059669)" : overallMargin >= 10 ? "linear-gradient(135deg,#F59E0B,#D97706)" : "linear-gradient(135deg,#EF4444,#DC2626)"}
              sub="gross margin" />
          </div>

          {/* Profit bar chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-5">সেরা ৮ পণ্যের গ্রস প্রফিট</h3>
            {top5ProfitChart.length === 0
              ? <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <DollarSign size={28} className="mb-2 opacity-30" />
                  <p className="text-sm">কোনো বিক্রির তথ্য নেই।</p>
                </div>
              : <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={top5ProfitChart} margin={{ left: -10, right: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`৳${(Number(v)||0).toLocaleString()}`, "লাভ"]} />
                    <Bar dataKey="profit" name="লাভ (৳)" radius={[6, 6, 0, 0]} maxBarSize={44}>
                      {top5ProfitChart.map((p, i) => <Cell key={i} fill={p.profit < 0 ? "#EF4444" : i === 0 ? "#10B981" : i === 1 ? "#3B82F6" : i === 2 ? "#8B5CF6" : "#10B981"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>

          {/* Sort + table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-gray-900">পণ্য অনুযায়ী লাভ-ক্ষতি</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-semibold">সাজান:</span>
                {[{ v: "profit", l: "লাভ" }, { v: "margin", l: "মার্জিন" }, { v: "revenue", l: "রাজস্ব" }].map(s =>
                  sortBtn(s.l, sortProfitBy === s.v, () => setSortProfitBy(s.v as typeof sortProfitBy))
                )}
                <button onClick={() => downloadExcel(sortedProfitProducts.map(r => ({ পণ্য: r.name, "বিক্রি (৳)": r.revenue, "COGS (৳)": r.cogs, "লাভ (৳)": r.profit, "মার্জিন (%)": r.margin })), "profit-per-product.xlsx")}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors font-semibold">
                  <Download size={12} /> Excel
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["পণ্য", "ক্যাটাগরি", "বিক্রিত পিস", "বিক্রি (৳)", "COGS (৳)", "লাভ (৳)", "মার্জিন"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedProfitProducts.map((p) => (
                    <tr key={p.name} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900">{p.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{p.category ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600 font-medium">{p.qty} পিস</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{formatBDT(p.revenue)}</td>
                      <td className="px-4 py-3 font-semibold text-amber-600">{formatBDT(p.cogs)}</td>
                      <td className="px-4 py-3 font-black" style={{ color: p.profit >= 0 ? "#059669" : "#DC2626" }}>{formatBDT(p.profit)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: p.margin >= 30 ? "#D1FAE5" : p.margin >= 15 ? "#FEF3C7" : "#FEE2E2",
                            color: p.margin >= 30 ? "#059669" : p.margin >= 15 ? "#D97706" : "#DC2626",
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

          {/* Buy vs sell price table */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">ক্রয়মূল্য vs বিক্রয়মূল্য (স্টকে থাকা পণ্য)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["পণ্য", "ক্রয়মূল্য", "বিক্রয়মূল্য", "লাভ/পিস", "মার্জিন"].map(h => (
                      <th key={h} className="text-left px-3 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...products].filter(p => p.stockQty > 0).sort((a, b) => {
                    const mA = a.sellPrice > 0 ? Math.round(((a.sellPrice - a.buyPrice) / a.sellPrice) * 100) : 0;
                    const mB = b.sellPrice > 0 ? Math.round(((b.sellPrice - b.buyPrice) / b.sellPrice) * 100) : 0;
                    return mB - mA;
                  }).map((p) => {
                    const profitPer = p.sellPrice - p.buyPrice;
                    const margin = p.sellPrice > 0 ? Math.round((profitPer / p.sellPrice) * 100) : 0;
                    return (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5 font-semibold text-gray-900">{p.name}</td>
                        <td className="px-3 py-2.5 text-gray-500 font-medium">{formatBDT(p.buyPrice)}</td>
                        <td className="px-3 py-2.5 font-bold text-gray-900">{formatBDT(p.sellPrice)}</td>
                        <td className="px-3 py-2.5 font-bold" style={{ color: profitPer >= 0 ? "#059669" : "#DC2626" }}>{formatBDT(profitPer)}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-gray-100">
                              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, margin))}%`, backgroundColor: margin >= 30 ? "#10B981" : margin >= 15 ? "#F59E0B" : "#EF4444" }} />
                            </div>
                            <span className="text-xs font-bold w-10 text-right" style={{ color: margin >= 30 ? "#059669" : margin >= 15 ? "#D97706" : "#DC2626" }}>{margin}%</span>
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
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3 flex-wrap">
            <span className="text-sm font-bold text-gray-600">বিশ্লেষণ সময়কাল:</span>
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => { setIntelDays(d); setIntelFetched(false); }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                style={{
                  backgroundColor: intelDays === d ? "#10B981" : "white",
                  color: intelDays === d ? "white" : "#6B7280",
                  borderColor: intelDays === d ? "#10B981" : "#E5E7EB",
                }}>
                {d} দিন
              </button>
            ))}
            <button onClick={exportIntelCsv}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors ml-auto">
              <Download size={13} /> CSV Export
            </button>
          </div>

          {intelLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-100" />)}
            </div>
          ) : (
            <>
              {intelKPIs && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <StatCard label="সর্বোচ্চ মার্জিন পণ্য" value={intelKPIs.bestMargin?.name?.slice(0,14) ?? "—"}
                    sub={intelKPIs.bestMargin ? `${intelKPIs.bestMargin.margin.toFixed(1)}% margin` : ""}
                    icon={Star} gradient="linear-gradient(135deg,#10B981,#059669)" />
                  <StatCard label="সর্বনিম্ন মার্জিন পণ্য" value={intelKPIs.worstMargin?.name?.slice(0,14) ?? "—"}
                    sub={intelKPIs.worstMargin ? `${intelKPIs.worstMargin.margin.toFixed(1)}% margin` : ""}
                    icon={TrendingDown} gradient="linear-gradient(135deg,#EF4444,#DC2626)" color="#DC2626" />
                  <StatCard label="শেষ হওয়ার পথে" value={String(intelKPIs.stockoutSoon)}
                    sub="৭ দিনের মধ্যে শেষ"
                    icon={AlertTriangle}
                    gradient={intelKPIs.stockoutSoon > 0 ? "linear-gradient(135deg,#EF4444,#DC2626)" : "linear-gradient(135deg,#10B981,#059669)"}
                    color={intelKPIs.stockoutSoon > 0 ? "#DC2626" : "#059669"} />
                  <StatCard label="স্লো মুভার" value={String(intelKPIs.slowMovers)}
                    sub="<১ পিস/সপ্তাহ, ৩০+ স্টক"
                    icon={Package} gradient="linear-gradient(135deg,#F59E0B,#D97706)" color="#D97706" />
                  <StatCard label="মোট গ্রস প্রফিট" value={formatBDT(intelKPIs.totalGrossProfit)}
                    sub={`গত ${intelDays} দিন`}
                    icon={DollarSign}
                    gradient={intelKPIs.totalGrossProfit >= 0 ? "linear-gradient(135deg,#10B981,#059669)" : "linear-gradient(135deg,#EF4444,#DC2626)"}
                    color={intelKPIs.totalGrossProfit >= 0 ? "#059669" : "#DC2626"} />
                </div>
              )}

              {/* Sub-view tabs */}
              <div className="bg-white rounded-2xl border border-gray-100 p-1.5 shadow-sm inline-flex gap-1">
                {[{ key: "profitability", label: "লাভজনকতা বিশ্লেষণ" }, { key: "stock", label: "স্টক ইন্টেলিজেন্স" }].map(v => (
                  <button key={v.key} onClick={() => setIntelView(v.key as typeof intelView)}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{
                      backgroundColor: intelView === v.key ? "#10B981" : "transparent",
                      color: intelView === v.key ? "white" : "#6B7280",
                    }}>
                    {v.label}
                  </button>
                ))}
              </div>

              {/* Search + sort */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={intelSearch} onChange={e => setIntelSearch(e.target.value)}
                    placeholder="পণ্য, ক্যাটাগরি বা SKU খুঁজুন..."
                    className="w-full pl-9 pr-3 h-9 rounded-xl border border-gray-200 text-sm outline-none text-gray-700 focus:border-emerald-400 transition-colors" />
                </div>
                <span className="text-xs font-bold text-gray-400">সাজান:</span>
                {intelView === "profitability"
                  ? [{ v: "profit", l: "লাভ" }, { v: "margin", l: "মার্জিন" }, { v: "revenue", l: "রাজস্ব" }, { v: "unitsSold", l: "বিক্রয়" }].map(s =>
                      sortBtn(s.l, intelSort === s.v, () => setIntelSort(s.v as typeof intelSort))
                    )
                  : [{ v: "daysRemaining", l: "জরুরি" }, { v: "unitsSold", l: "বিক্রয়" }].map(s =>
                      sortBtn(s.l, intelSort === s.v, () => setIntelSort(s.v as typeof intelSort))
                    )
                }
              </div>

              {/* Profitability table */}
              {intelView === "profitability" && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[800px]">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
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
                              className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap cursor-pointer select-none transition-colors hover:text-emerald-600"
                              style={{ color: intelSort === h.key ? "#10B981" : "#9CA3AF" }}>
                              {h.label}{intelSort === h.key ? " ↓" : ""}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredIntelProducts.length === 0 ? (
                          <tr><td colSpan={8} className="text-center py-12 text-sm text-gray-400">কোনো পণ্য পাওয়া যায়নি।</td></tr>
                        ) : filteredIntelProducts.map((p) => (
                          <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <Link href={`/inventory/${p.id}`} className="font-semibold text-gray-900 hover:text-emerald-600 transition-colors">{p.name}</Link>
                              {p.sku && <p className="text-[10px] font-mono mt-0.5 text-gray-400">{p.sku}</p>}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400">{p.category ?? "—"}</td>
                            <td className="px-4 py-3 text-gray-500 font-medium">{formatBDT(p.buyPrice)}</td>
                            <td className="px-4 py-3 font-bold text-gray-900">{formatBDT(p.sellPrice)}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-xs font-black"
                                style={{
                                  backgroundColor: p.margin >= 40 ? "#D1FAE5" : p.margin >= 20 ? "#FEF3C7" : "#FEE2E2",
                                  color: p.margin >= 40 ? "#059669" : p.margin >= 20 ? "#D97706" : "#DC2626",
                                }}>
                                {p.margin.toFixed(1)}%
                              </span>
                              <p className="text-[10px] mt-0.5 text-gray-400">৳{(p.sellPrice - p.buyPrice).toFixed(0)}/পিস</p>
                            </td>
                            <td className="px-4 py-3 font-bold text-emerald-600">{p.unitsSold}</td>
                            <td className="px-4 py-3 font-semibold text-gray-900">{formatBDT(p.revenue)}</td>
                            <td className="px-4 py-3 font-black" style={{ color: p.grossProfit >= 0 ? "#059669" : "#DC2626" }}>{formatBDT(p.grossProfit)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Stock Intelligence table */}
              {intelView === "stock" && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[750px]">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          {["পণ্য", "বর্তমান স্টক", "সাপ্তাহিক বিক্রি", "দিন বাকি", "স্ট্যাটাস", "সরবরাহকারী", ""].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredIntelProducts.length === 0 ? (
                          <tr><td colSpan={7} className="text-center py-12 text-sm text-gray-400">কোনো পণ্য পাওয়া যায়নি।</td></tr>
                        ) : filteredIntelProducts.map((p) => {
                          const stockoutSoon = p.daysRemaining !== null && p.daysRemaining < 7 && p.stockQty > 0;
                          const slowMover = p.weeklyVelocity < 1 && p.stockQty > 30;
                          const outOfStock = p.stockQty === 0;
                          const isLowStock = p.stockQty > 0 && p.stockQty <= p.lowStockAt;
                          const needsPO = outOfStock || stockoutSoon || isLowStock;
                          const poParams = new URLSearchParams();
                          poParams.set("product", p.name);
                          if (p.supplierId) poParams.set("supplierId", p.supplierId);
                          return (
                            <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                              style={{ backgroundColor: (stockoutSoon || outOfStock) ? "#FFF8F8" : undefined }}>
                              <td className="px-4 py-3">
                                <Link href={`/inventory/${p.id}`} className="font-semibold text-gray-900 hover:text-emerald-600 transition-colors">{p.name}</Link>
                                {p.sku && <p className="text-[10px] font-mono mt-0.5 text-gray-400">{p.sku}</p>}
                              </td>
                              <td className="px-4 py-3 font-black text-sm"
                                style={{ color: p.stockQty === 0 ? "#DC2626" : p.stockQty <= p.lowStockAt ? "#D97706" : "#111827" }}>
                                {p.stockQty}
                              </td>
                              <td className="px-4 py-3 text-gray-500 font-medium">
                                {p.weeklyVelocity > 0 ? `${p.weeklyVelocity}/সপ্তাহ` : "বিক্রি নেই"}
                              </td>
                              <td className="px-4 py-3 font-bold"
                                style={{ color: stockoutSoon ? "#DC2626" : p.daysRemaining !== null && p.daysRemaining < 14 ? "#D97706" : "#6B7280" }}>
                                {outOfStock ? "শেষ" : p.daysRemaining !== null ? `${p.daysRemaining} দিন` : "—"}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {outOfStock && <span className="flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600"><Package size={9} /> শেষ</span>}
                                  {!outOfStock && stockoutSoon && <span className="flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600"><AlertTriangle size={9} /> শেষ হবে শীঘ্রই</span>}
                                  {!outOfStock && !stockoutSoon && isLowStock && <span className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><AlertTriangle size={9} /> কম স্টক</span>}
                                  {slowMover && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Slow Mover</span>}
                                  {!outOfStock && !stockoutSoon && !isLowStock && !slowMover && p.weeklyVelocity > 0 && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">স্বাভাবিক</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-400">{p.supplierName ?? "—"}</td>
                              <td className="px-4 py-3">
                                {needsPO && (
                                  <Link href={`/purchase-orders?${poParams.toString()}`}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors whitespace-nowrap">
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

      {/* ─── TAB 5: CUSTOMER LTV ──────────────────────────────────────── */}
      {tab === "ltv" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="মোট কাস্টমার" value={customers.length.toString()}
              sub="সব মিলিয়ে" icon={Users} gradient="linear-gradient(135deg,#3B82F6,#1D4ED8)" />
            <StatCard label="Repeat Customer" value={ltvData.filter(c => c.orderCount > 1).length.toString()}
              sub={`${ltvData.length > 0 ? Math.round((ltvData.filter(c => c.orderCount > 1).length / ltvData.length) * 100) : 0}% retention`}
              icon={TrendingUp} gradient="linear-gradient(135deg,#10B981,#059669)" />
            <StatCard label="সর্বোচ্চ LTV" value={formatBDT(sortedLtv[0]?.revenue ?? 0)}
              sub={sortedLtv[0]?.name?.slice(0, 16) ?? "—"}
              icon={Star} gradient="linear-gradient(135deg,#F59E0B,#D97706)" />
            <StatCard label="গড় LTV" value={formatBDT(ltvData.length > 0 ? ltvData.reduce((s, c) => s + c.revenue, 0) / ltvData.length : 0)}
              sub="per customer" icon={DollarSign} gradient="linear-gradient(135deg,#8B5CF6,#6D28D9)" />
          </div>

          {/* LTV bar chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-5">সেরা ৮ কাস্টমার — মোট কেনাকাটা</h3>
            {topLtv10Chart.length === 0
              ? <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Users size={28} className="mb-2 opacity-30" />
                  <p className="text-sm">কোনো তথ্য নেই।</p>
                </div>
              : <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topLtv10Chart} margin={{ left: -10, right: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`৳${(Number(v)||0).toLocaleString()}`, "মোট কেনা"]} />
                    <Bar dataKey="revenue" name="মোট কেনা (৳)" radius={[6, 6, 0, 0]} maxBarSize={44}>
                      {topLtv10Chart.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? "#F59E0B" : i === 1 ? "#10B981" : i === 2 ? "#8B5CF6" : "#3B82F6"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* New vs repeat pie */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">নতুন vs পুরনো কাস্টমার</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={repeatCustomers} cx="45%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                    {repeatCustomers.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Legend iconSize={10} iconType="circle" formatter={v => <span style={{ fontSize: 11, color: "#6B7280" }}>{v}</span>} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Due leaderboard */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">বাকির তালিকা — শীর্ষ ১০</h3>
              </div>
              {topDueCustomers.length === 0
                ? <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <p className="text-sm">কোনো due নেই! সব clear।</p>
                  </div>
                : topDueCustomers.slice(0, 6).map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                      <span className="text-xs font-black w-6 text-center" style={{ color: i === 0 ? "#F59E0B" : i === 1 ? "#9CA3AF" : i === 2 ? "#D97706" : "#D1D5DB" }}>#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{c.name}</p>
                        <p className="text-xs text-gray-400">{c._count.orders}টি অর্ডার</p>
                      </div>
                      <p className="font-black text-red-500 text-sm">{formatBDT(c.dueAmount)}</p>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Full LTV table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-gray-900">Customer Lifetime Value র‍্যাংকিং</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400">সাজান:</span>
                {[{ v: "revenue", l: "মোট কেনা" }, { v: "orders", l: "অর্ডার" }, { v: "avg", l: "গড় অর্ডার" }].map(s =>
                  sortBtn(s.l, ltvSort === s.v, () => setLtvSort(s.v as typeof ltvSort))
                )}
                <button onClick={() => downloadExcel(sortedLtv.map((r, i) => ({ র‍্যাংক: i + 1, নাম: r.name, ফোন: r.phone ?? "", Group: r.group, "মোট কেনা (৳)": r.revenue, "অর্ডার সংখ্যা": r.orderCount, "গড় অর্ডার (৳)": r.avgOrder, "প্রথম অর্ডার": r.firstOrder.slice(0, 10), "শেষ অর্ডার": r.lastOrder.slice(0, 10) })), "customer-ltv.xlsx")}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors font-semibold">
                  <Download size={12} /> Excel
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["#", "নাম", "Group", "মোট কেনা", "অর্ডার", "গড় অর্ডার", "প্রথম অর্ডার", "শেষ অর্ডার"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedLtv.map((c, i) => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-black w-6" style={{ color: i === 0 ? "#F59E0B" : i === 1 ? "#9CA3AF" : i === 2 ? "#D97706" : "#D1D5DB" }}>#{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{c.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ backgroundColor: c.group === "vip" ? "#FEF3C7" : c.group === "wholesale" ? "#EFF6FF" : "#F9FAFB", color: c.group === "vip" ? "#D97706" : c.group === "wholesale" ? "#2563EB" : "#6B7280" }}>
                          {c.group}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-black text-emerald-600">{formatBDT(c.revenue)}</td>
                      <td className="px-4 py-3 text-gray-600 font-medium">{c.orderCount}টি</td>
                      <td className="px-4 py-3 text-gray-600 font-medium">{formatBDT(c.avgOrder)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{c.firstOrder.slice(0, 10)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{c.lastOrder.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 6: COD COLLECTION REPORT ────────────────────────────── */}
      {tab === "cod" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-9 h-9 rounded-xl mb-3 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}>
                <TrendingUp size={17} color="#fff" />
              </div>
              <p className="text-2xl font-black text-emerald-700">{formatBDT(codSummary.all.collectedAmt)}</p>
              <p className="text-xs font-bold text-gray-400 mt-1">সংগ্রহ হয়েছে</p>
              <p className="text-xs text-emerald-600 font-semibold mt-0.5">{codSummary.all.collected}টি অর্ডার</p>
            </div>
            <div className="bg-white rounded-2xl border border-amber-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-9 h-9 rounded-xl mb-3 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)" }}>
                <Truck size={17} color="#fff" />
              </div>
              <p className="text-2xl font-black text-amber-600">{formatBDT(codSummary.all.pendingAmt)}</p>
              <p className="text-xs font-bold text-gray-400 mt-1">Courier-এ আছে</p>
              <p className="text-xs text-amber-600 font-semibold mt-0.5">{codSummary.all.pending}টি অর্ডার</p>
            </div>
            <div className="bg-white rounded-2xl border border-red-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-9 h-9 rounded-xl mb-3 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)" }}>
                <ArrowDownRight size={17} color="#fff" />
              </div>
              <p className="text-2xl font-black text-red-600">{formatBDT(codSummary.all.returnedAmt)}</p>
              <p className="text-xs font-bold text-gray-400 mt-1">Return হয়েছে</p>
              <p className="text-xs text-red-600 font-semibold mt-0.5">{codSummary.all.returned}টি অর্ডার</p>
            </div>
          </div>

          {/* COD collection rate */}
          {codSummary.all.total > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">COD সংগ্রহের হার</h3>
                <span className="text-2xl font-black text-emerald-600">
                  {Math.round((codSummary.all.collected / codSummary.all.total) * 100)}%
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden bg-gray-100">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all" style={{
                  width: `${Math.round((codSummary.all.collected / codSummary.all.total) * 100)}%`,
                }} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400 font-medium">
                <span>মোট {codSummary.all.total}টি COD অর্ডার</span>
                <span>মোট COD মূল্য: {formatBDT(codSummary.all.totalAmt)}</span>
              </div>
            </div>
          )}

          {/* Per courier breakdown */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { key: "pathao", label: "Pathao", emoji: "🚚", data: codSummary.pathao },
              { key: "ecourier", label: "eCourier", emoji: "📦", data: codSummary.ecourier },
              { key: "other", label: "অন্যান্য", emoji: "🏍️", data: codSummary.other },
            ].map(cn => (
              <div key={cn.key} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{cn.emoji}</span>
                  <div>
                    <h3 className="font-bold text-gray-900">{cn.label}</h3>
                    <p className="text-xs text-gray-400">{cn.data.total}টি অর্ডার</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: "সংগ্রহ হয়েছে", count: cn.data.collected, amt: cn.data.collectedAmt, color: "#059669", bg: "#D1FAE5" },
                    { label: "Pending", count: cn.data.pending, amt: cn.data.pendingAmt, color: "#D97706", bg: "#FEF3C7" },
                    { label: "Return", count: cn.data.returned, amt: cn.data.returnedAmt, color: "#DC2626", bg: "#FEE2E2" },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
                        <span className="text-gray-500 font-medium">{row.label} ({row.count}টি)</span>
                      </div>
                      <span className="font-bold" style={{ color: row.color }}>{formatBDT(row.amt)}</span>
                    </div>
                  ))}
                  <div className="pt-2 mt-1 border-t border-gray-100 flex justify-between text-xs font-bold">
                    <span className="text-gray-400">মোট</span>
                    <span className="text-gray-900">{formatBDT(cn.data.totalAmt)}</span>
                  </div>
                  {cn.data.total > 0 && (
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                        style={{ width: `${Math.round((cn.data.collected / cn.data.total) * 100)}%` }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Monthly COD trend */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-5">মাসিক COD ট্রেন্ড</h3>
            {codMonthly.length === 0
              ? <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Truck size={28} className="mb-2 opacity-30" />
                  <p className="text-sm">কোনো COD collected হয়নি।</p>
                </div>
              : <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={codMonthly} margin={{ left: -10, right: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`৳${(Number(v)||0).toLocaleString()}`]} />
                    <Legend iconSize={10} iconType="circle" formatter={v => <span style={{ fontSize: 11, color: "#6B7280" }}>{v}</span>} />
                    <Bar dataKey="collected" name="সংগ্রহ" fill="#10B981" radius={[4, 4, 0, 0]} stackId="a" />
                    <Bar dataKey="pending" name="Pending" fill="#F59E0B" radius={[0, 0, 0, 0]} stackId="a" />
                    <Bar dataKey="returned" name="Return" fill="#EF4444" radius={[4, 4, 0, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>
        </div>
      )}

      {/* ─── TAB 7: P&L ───────────────────────────────────────────────── */}
      {tab === "pl" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-gray-400 font-medium">সব সময়ের P&L হিসাব</p>
            <div className="flex gap-2">
              <button onClick={exportPL}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                <FileSpreadsheet size={15} className="text-green-600" /> Excel
              </button>
              <button onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                <Download size={15} /> Print
              </button>
            </div>
          </div>

          {/* Monthly P&L summary cards */}
          {monthlyPL.length > 0 && (() => {
            const latest = monthlyPL[monthlyPL.length - 1];
            const totalNetProfit = monthlyPL.reduce((s, r) => s + r.netProfit, 0);
            const totalExpenses = monthlyPL.reduce((s, r) => s + r.expenses, 0);
            const overallPLMargin = monthlyPL.reduce((s,r)=>s+r.revenue,0) > 0
              ? Math.round((totalNetProfit / monthlyPL.reduce((s,r)=>s+r.revenue,0)) * 100) : 0;
            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="সর্বোচ্চ মাসের বিক্রি" value={formatBDT(Math.max(...monthlyPL.map(r=>r.revenue)))}
                  icon={TrendingUp} gradient="linear-gradient(135deg,#3B82F6,#1D4ED8)" />
                <StatCard label="মোট খরচ (সব মাস)" value={formatBDT(totalExpenses)}
                  icon={CreditCard} gradient="linear-gradient(135deg,#EF4444,#DC2626)" />
                <StatCard label="মোট নেট লাভ" value={formatBDT(totalNetProfit)}
                  icon={DollarSign}
                  gradient={totalNetProfit >= 0 ? "linear-gradient(135deg,#10B981,#059669)" : "linear-gradient(135deg,#EF4444,#DC2626)"}
                  color={totalNetProfit >= 0 ? "#059669" : "#DC2626"} />
                <StatCard label="সামগ্রিক নেট মার্জিন" value={`${overallPLMargin}%`}
                  icon={Activity}
                  gradient={overallPLMargin >= 20 ? "linear-gradient(135deg,#10B981,#059669)" : overallPLMargin >= 10 ? "linear-gradient(135deg,#F59E0B,#D97706)" : "linear-gradient(135deg,#EF4444,#DC2626)"} />
              </div>
            );
          })()}

          {/* P&L grouped bar chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-5">মাসিক আয়, খরচ ও লাভ</h3>
            {monthlyPL.length === 0
              ? <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Activity size={28} className="mb-2 opacity-30" />
                  <p className="text-sm">কোনো তথ্য নেই।</p>
                </div>
              : <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyPL} margin={{ left: -10, right: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`৳${(Number(v)||0).toLocaleString()}`]} />
                    <Legend iconSize={10} iconType="circle" formatter={v => <span style={{ fontSize: 11, color: "#6B7280" }}>{v}</span>} />
                    <Bar dataKey="revenue" name="বিক্রি" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={18} />
                    <Bar dataKey="cogs" name="COGS" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={18} />
                    <Bar dataKey="expenses" name="খরচ" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={18} />
                    <Bar dataKey="netProfit" name="নেট লাভ" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Expense category pie */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">ক্যাটাগরি অনুযায়ী খরচ</h3>
              {expenseByCategory.length === 0
                ? <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <p className="text-sm">কোনো manual খরচ নেই।</p>
                  </div>
                : <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={expenseByCategory} cx="45%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={2}>
                        {expenseByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Legend iconSize={9} iconType="circle" formatter={v => <span style={{ fontSize: 10, color: "#6B7280" }}>{v}</span>} />
                      <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`৳${(Number(v)||0).toLocaleString()}`, "খরচ"]} />
                    </PieChart>
                  </ResponsiveContainer>
              }
            </div>

            {/* Net profit area chart */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">নেট লাভের ট্রেন্ড</h3>
              {monthlyPL.length === 0
                ? <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <p className="text-sm">কোনো তথ্য নেই।</p>
                  </div>
                : <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={monthlyPL} margin={{ left: -10, right: 4 }}>
                      <defs>
                        <linearGradient id="plGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`৳${(Number(v)||0).toLocaleString()}`, "নেট লাভ"]} />
                      <Area type="monotone" dataKey="netProfit" stroke="#10B981" strokeWidth={2.5} fill="url(#plGradient)" dot={{ r: 4, fill: "#10B981", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </AreaChart>
                  </ResponsiveContainer>
              }
            </div>
          </div>

          {/* P&L table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">মাসিক বিবরণী</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["মাস", "বিক্রি", "COGS", "অন্যান্য খরচ", "নেট লাভ", "মার্জিন"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthlyPL.map((row) => {
                    const margin = row.revenue > 0 ? Math.round((row.netProfit / row.revenue) * 100) : 0;
                    return (
                      <tr key={row.month} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-gray-900">{row.month}</td>
                        <td className="px-4 py-3 font-semibold text-blue-600">{formatBDT(row.revenue)}</td>
                        <td className="px-4 py-3 font-semibold text-amber-600">{formatBDT(row.cogs)}</td>
                        <td className="px-4 py-3 font-semibold text-red-500">{formatBDT(row.expenses)}</td>
                        <td className="px-4 py-3 font-black" style={{ color: row.netProfit >= 0 ? "#059669" : "#DC2626" }}>{formatBDT(row.netProfit)}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{ backgroundColor: margin >= 20 ? "#D1FAE5" : margin >= 10 ? "#FEF3C7" : "#FEE2E2", color: margin >= 20 ? "#059669" : margin >= 10 ? "#D97706" : "#DC2626" }}>
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

      {/* ─── TAB 8: AI বিশ্লেষণ ────────────────────────────────────────── */}
      {tab === "ai" && (
        <div className="space-y-4">
          {/* Header card */}
          <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl border border-emerald-100 p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                  style={{ background: "linear-gradient(135deg,#8B5CF6,#6D28D9)" }}>
                  <Sparkles size={22} color="#fff" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg">AI বিক্রয় বিশ্লেষণ</h3>
                  <p className="text-sm text-gray-500 mt-0.5">গত ৩০ দিনের ডেটা বিশ্লেষণ করে AI পরামর্শ দেবে</p>
                </div>
              </div>
              {!aiInsight ? (
                <button onClick={() => fetchAiInsight()} disabled={aiInsightLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all shadow-sm hover:shadow-md"
                  style={{ background: "linear-gradient(135deg,#8B5CF6,#6D28D9)" }}>
                  {aiInsightLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {aiInsightLoading ? "বিশ্লেষণ হচ্ছে..." : "বিশ্লেষণ শুরু করুন"}
                </button>
              ) : (
                <button onClick={() => fetchAiInsight(true)} disabled={aiInsightLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border border-gray-200 font-semibold text-gray-600 disabled:opacity-60 hover:bg-white transition-colors">
                  {aiInsightLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  আপডেট করুন
                </button>
              )}
            </div>
          </div>

          {aiInsightError && (
            <div className="p-4 rounded-xl text-sm bg-red-50 border border-red-200 text-red-700 font-medium">
              {aiInsightError}
            </div>
          )}

          {!aiInsight && !aiInsightLoading && !aiInsightError && (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#EDE9FE,#DDD6FE)" }}>
                <Sparkles size={28} className="text-violet-400" />
              </div>
              <p className="font-bold text-gray-900 text-lg mb-2">AI বিশ্লেষণ শুরু হয়নি</p>
              <p className="text-sm text-gray-400">উপরের বাটনে ক্লিক করুন — AI আপনার বিক্রয় ডেটা বিশ্লেষণ করে পরামর্শ দেবে।</p>
            </div>
          )}

          {aiInsightLoading && (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center shadow-sm">
              <Loader2 size={36} className="animate-spin mx-auto mb-4 text-violet-500" />
              <p className="font-bold text-gray-900 mb-1">বিশ্লেষণ চলছে...</p>
              <p className="text-sm text-gray-400">AI আপনার ব্যবসার ডেটা বিশ্লেষণ করছে</p>
            </div>
          )}

          {aiInsight && !aiInsightLoading && (
            <div className="space-y-4">
              {aiInsight.cached && (
                <p className="text-xs text-gray-400 font-medium">
                  ক্যাশ থেকে দেখানো হচ্ছে · {aiInsight.cachedAt ? new Date(aiInsight.cachedAt).toLocaleTimeString("bn-BD") : ""}
                </p>
              )}

              {/* Alert */}
              {aiInsight.alert && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-amber-800">{aiInsight.alert}</p>
                </div>
              )}

              {/* Top Opportunity */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
                    <Zap size={14} color="#fff" />
                  </div>
                  <span className="text-sm font-black text-emerald-800">সবচেয়ে বড় সুযোগ</span>
                </div>
                <p className="text-sm text-gray-800 font-medium leading-relaxed">{aiInsight.topOpportunity}</p>
              </div>

              {/* Insights */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#3B82F6,#1D4ED8)" }}>
                    <Activity size={14} color="#fff" />
                  </div>
                  <h4 className="text-sm font-black text-gray-900">মূল পর্যবেক্ষণ</h4>
                </div>
                <div className="divide-y divide-gray-50">
                  {aiInsight.insights.map((item, i) => (
                    <div key={i} className="px-5 py-4 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                      <span className="w-6 h-6 rounded-full text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5 bg-blue-100 text-blue-600">{i + 1}</span>
                      <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#8B5CF6,#6D28D9)" }}>
                    <Target size={14} color="#fff" />
                  </div>
                  <h4 className="text-sm font-black text-gray-900">AI পরামর্শ</h4>
                </div>
                <div className="divide-y divide-gray-50">
                  {aiInsight.recommendations.map((item, i) => (
                    <div key={i} className="px-5 py-4 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                      <span className="text-xl flex-shrink-0">{["💡", "📈", "🎯", "⚡", "🔑"][i % 5]}</span>
                      <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
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
