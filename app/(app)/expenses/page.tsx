"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus, Trash2, Download, Settings2,
} from "lucide-react";
import Link from "next/link";
import PageHint from "@/components/PageHint";
import { downloadExcel } from "@/lib/excel";
import { formatBDT } from "@/lib/utils";
import { getExpenseCategory } from "@/lib/expenses/categories";
import { getMonthRange, getWeekRange, monthKey } from "@/lib/expenses/utils";
import type { Expense, ExpenseSort, ExpenseStats, ExpenseViewMode } from "@/lib/expenses/types";
import ExpenseFormPanel from "./components/ExpenseFormPanel";
import ExpenseFilters from "./components/ExpenseFilters";
import ExpenseStatsCards from "./components/ExpenseStatsCards";
import ExpenseList from "./components/ExpenseList";
import ExpenseTrendChart from "./components/ExpenseTrendChart";
import ExpenseCategoryChart from "./components/ExpenseCategoryChart";
import ExpensePLWidget from "./components/ExpensePLWidget";
import ExpenseBudgetBanner from "./components/ExpenseBudgetBanner";
import { PageShell, Button, Card } from "@/components/ui";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [viewMode, setViewMode] = useState<ExpenseViewMode>("monthly");
  const [refDate, setRefDate] = useState(new Date().toISOString().slice(0, 10));
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [sort, setSort] = useState<ExpenseSort>("date");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [panel, setPanel] = useState<{ edit?: Expense } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetCat, setBudgetCat] = useState("other");
  const [budgetAmount, setBudgetAmount] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  function getViewDates(): { from: string; to: string } {
    if (fromDate || toDate) return { from: fromDate, to: toDate };
    if (viewMode === "weekly") return getWeekRange(refDate);
    if (viewMode === "monthly") return getMonthRange(refDate.slice(0, 7));
    return { from: refDate, to: refDate };
  }

  const load = useCallback(async () => {
    setLoading(true);
    const { from, to } = getViewDates();
    const params = new URLSearchParams();
    if (filterCat) params.set("category", filterCat);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (paymentMethod) params.set("paymentMethod", paymentMethod);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "30");

    const statsParams = new URLSearchParams();
    if (filterCat) statsParams.set("category", filterCat);
    if (from) statsParams.set("from", from);
    if (to) statsParams.set("to", to);

    const [listRes, statsRes] = await Promise.all([
      fetch(`/api/expenses?${params}`),
      fetch(`/api/expenses/stats?${statsParams}`),
    ]);

    if (listRes.ok) {
      const data = await listRes.json();
      setExpenses(data.expenses ?? []);
      setPages(data.pages ?? 1);
      setTotal(data.total ?? 0);
    }
    if (statsRes.ok) {
      setStats(await statsRes.json());
    }
    setLoading(false);
  }, [filterCat, debouncedSearch, fromDate, toDate, viewMode, refDate, paymentMethod, sort, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [filterCat, debouncedSearch, fromDate, toDate, viewMode, refDate, paymentMethod, sort]);

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/expenses/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    showToast("success", "খরচ মুছে দেওয়া হয়েছে ✓");
    load();
  }

  async function handleDuplicate(exp: Expense) {
    const r = await fetch(`/api/expenses/${exp.id}/duplicate`, { method: "POST" });
    if (r.ok) {
      showToast("success", "খরচ কপি হয়েছে ✓");
      load();
    } else {
      showToast("error", "কপি ব্যর্থ");
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    await fetch("/api/expenses/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selectedIds], action: "delete" }),
    });
    setSelectedIds(new Set());
    showToast("success", `${count}টি মুছে ফেলা হয়েছে ✓`);
    load();
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (expenses.every(e => selectedIds.has(e.id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(expenses.map(e => e.id)));
    }
  }

  async function handleExportExcel() {
    setExporting(true);
    try {
      const { from, to } = getViewDates();
      const params = new URLSearchParams({ limit: "500", sort });
      if (filterCat) params.set("category", filterCat);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (debouncedSearch) params.set("search", debouncedSearch);
      const r = await fetch(`/api/expenses?${params}`);
      const data = await r.json();
      const rows = (data.expenses ?? []).map((e: Expense) => ({
        তারিখ: e.date?.split("T")[0] ?? "",
        শিরোনাম: e.title ?? "",
        ক্যাটাগরি: getExpenseCategory(e.category).label,
        পরিমাণ: e.amount,
        "পেমেন্ট": e.paymentMethod ?? "",
        নোট: e.notes ?? "",
      }));
      await downloadExcel(rows, `expenses-${from || "all"}.xlsx`, "খরচ");
    } catch {
      showToast("error", "Export ব্যর্থ");
    }
    setExporting(false);
  }

  async function handleImport(file: File) {
    const text = await file.text();
    const lines = text.split("\n").slice(1);
    const rows = lines.map(line => {
      const cols = line.match(/(".*?"|[^,]+)/g)?.map(c => c.replace(/^"|"$/g, "").trim()) ?? [];
      return {
        date: cols[0] ?? "",
        title: cols[1] ?? "",
        category: cols[2] ?? "other",
        amount: parseFloat(cols[3] ?? "0"),
        notes: cols[4] ?? "",
      };
    }).filter(r => r.title && r.amount);

    const r = await fetch("/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    const d = await r.json();
    showToast("success", `${d.created ?? 0}টি খরচ ইমপোর্ট হয়েছে ✓`);
    load();
  }

  async function saveBudget() {
    if (!budgetAmount) return;
    await fetch("/api/expenses/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: budgetCat,
        amount: budgetAmount,
        month: monthKey(new Date()),
      }),
    });
    setShowBudgetModal(false);
    setBudgetAmount("");
    showToast("success", "বাজেট সেট হয়েছে ✓");
    load();
  }

  const pageTotal = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <PageShell
      title="খরচ ট্র্যাকার"
      subtitle="ড্যাশবোর্ড ও রিপোর্টের সাথে সিঙ্ক"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" icon={Settings2} onClick={() => setShowBudgetModal(true)}>বাজেট</Button>
          <Button variant="outline" size="sm" icon={Download} onClick={handleExportExcel} loading={exporting}>Excel</Button>
          <Button variant="danger" icon={Plus} onClick={() => setPanel({})}>নতুন খরচ</Button>
        </div>
      }
    >
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl"
          style={{ backgroundColor: toast.type === "success" ? "#10B981" : "#EF4444" }}>
          {toast.msg}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">খরচ মুছবেন?</h3>
            <p className="text-sm text-gray-500 mb-6">
              <span className="font-semibold">{deleteTarget.title}</span> — {formatBDT(deleteTarget.amount)}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-2xl border text-sm font-bold">বাতিল</button>
              <button onClick={handleDelete} className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold">মুছে দিন</button>
            </div>
          </div>
        </div>
      )}

      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">মাসিক বাজেট সেট করুন</h3>
            <select value={budgetCat} onChange={e => setBudgetCat(e.target.value)}
              className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm">
              {(["office_rent", "salary", "utility", "marketing", "transport", "packaging", "maintenance", "other"] as const).map(v => (
                <option key={v} value={v}>{getExpenseCategory(v).label}</option>
              ))}
            </select>
            <input type="number" value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)}
              placeholder="বাজেট (৳)" className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm" />
            <div className="flex gap-3">
              <button onClick={() => setShowBudgetModal(false)} className="flex-1 py-3 rounded-2xl border text-sm font-bold">বাতিল</button>
              <button onClick={saveBudget} className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold">সেভ</button>
            </div>
          </div>
        </div>
      )}

      {panel !== null && (
        <ExpenseFormPanel
          initial={panel.edit}
          onClose={() => setPanel(null)}
          onSave={load}
          isDesktop={isDesktop}
        />
      )}

      <PageHint
        page="expenses"
        text="খরচ এখানে যোগ করলে হিসাব বই ও ড্যাশবোর্ডে স্বয়ংক্রিয়ভাবে দেখাবে। পুনরাবৃত্ত খরচ (ভাড়া, বেতন) সেট করে রাখুন।"
      />

      <ExpenseStatsCards stats={stats} loading={loading} />
      <ExpenseBudgetBanner stats={stats} />

      <div className="grid lg:grid-cols-2 gap-4">
        <ExpenseTrendChart stats={stats} />
        <ExpensePLWidget stats={stats} />
      </div>

      <Card padding="none">
        <ExpenseFilters
          search={search}
          onSearchChange={setSearch}
          filterCat={filterCat}
          onFilterCatChange={setFilterCat}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          showDateFilter={showDateFilter}
          onToggleDateFilter={() => setShowDateFilter(v => !v)}
          viewMode={viewMode}
          onViewModeChange={v => { setViewMode(v); setFromDate(""); setToDate(""); }}
          refDate={refDate}
          onRefDateChange={setRefDate}
          sort={sort}
          onSortChange={setSort}
          page={page}
          pages={pages}
          total={total}
          onPageChange={setPage}
          selectedCount={selectedIds.size}
          onBulkDelete={handleBulkDelete}
          onImportClick={() => importRef.current?.click()}
        />
        <input ref={importRef} type="file" accept=".csv" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ""; }} />

        <ExpenseCategoryChart
          stats={stats}
          showBreakdown={showBreakdown}
          onToggle={() => setShowBreakdown(v => !v)}
        />

        <ExpenseList
          expenses={expenses}
          loading={loading}
          totalAmount={pageTotal}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onSelectAll={selectAll}
          onEdit={exp => setPanel({ edit: exp })}
          onDelete={setDeleteTarget}
          onDuplicate={handleDuplicate}
          onAdd={() => setPanel({})}
        />
      </Card>

      <p className="text-center text-xs text-gray-400">
        <Link href="/hisab" className="text-red-500 font-semibold hover:underline">হিসাব বই</Link>
        {" "}— আয় ও খরচ একসাথে দেখুন
      </p>
    </PageShell>
  );
}
