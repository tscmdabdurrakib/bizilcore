"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus, X, ShoppingCart, Trash2, Download, Loader2, CheckCircle2, Send, Ban, AlertTriangle,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";
import type { PurchaseOrder, POStats } from "@/lib/purchase-orders/types";
import POFormPanel from "./components/POFormPanel";
import POCard from "./components/POCard";
import POFilters from "./components/POFilters";
import POStatsCards from "./components/POStatsCards";
import ReceiveConfirmModal from "./components/ReceiveConfirmModal";
import { PageShell, Button, Card, SectionTitle, EmptyState } from "@/components/ui";

function PurchaseOrdersContent() {
  const searchParams = useSearchParams();
  const prefillProduct = searchParams.get("product") ?? undefined;
  const prefillSupplierId = searchParams.get("supplierId") ?? undefined;
  const initialOverdue = searchParams.get("overdue") === "1";

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [stats, setStats] = useState<POStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [editOrder, setEditOrder] = useState<PurchaseOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showOverdue, setShowOverdue] = useState(initialOverdue);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);
  const [receiveTarget, setReceiveTarget] = useState<PurchaseOrder | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sendingWA, setSendingWA] = useState<string | null>(null);
  const [sendingSMS, setSendingSMS] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  useEffect(() => {
    if (prefillProduct || prefillSupplierId) setShowPanel(true);
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [prefillProduct, prefillSupplierId]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [filterStatus, debouncedSearch, dateFrom, dateTo, sort, showOverdue]);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (showOverdue) params.set("overdue", "1");
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "30");

    const [listRes, statsRes] = await Promise.all([
      fetch(`/api/purchase-orders?${params}`),
      fetch("/api/purchase-orders/stats"),
    ]);

    if (!listRes.ok) {
      showToast("ক্রয় অর্ডার লোড করা যায়নি", "error");
      setLoading(false);
      return;
    }

    const data = await listRes.json();
    const statsData = statsRes.ok ? await statsRes.json() : null;
    setOrders(data.purchaseOrders ?? []);
    setPages(data.pages ?? 1);
    setTotal(data.total ?? 0);
    setStats(statsData);
    setLoading(false);
  }, [filterStatus, debouncedSearch, dateFrom, dateTo, sort, page, showOverdue]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(id: string, status: string) {
    const res = await fetch(`/api/purchase-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json();
      showToast(data.error ?? "Status আপডেট ব্যর্থ", "error");
      return;
    }
    const msgs: Record<string, string> = {
      sent: "Supplier-এ পাঠানো হয়েছে ✓",
      cancelled: "অর্ডার বাতিল করা হয়েছে",
    };
    showToast(msgs[status] ?? "Status আপডেট হয়েছে", "success");
    load();
  }

  async function handleReceive(items: { itemId: string; receivedQuantity: number }[]) {
    if (!receiveTarget) return;
    const res = await fetch(`/api/purchase-orders/${receiveTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "receive", items }),
    });
    if (!res.ok) {
      const data = await res.json();
      showToast(data.error ?? "গ্রহণ ব্যর্থ", "error");
      return;
    }
    setReceiveTarget(null);
    showToast("পণ্য গ্রহণ সম্পন্ন — স্টক ও হিসাব আপডেট ✓", "success");
    load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/purchase-orders/${deleteTarget.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      showToast(data.error ?? "মুছতে ব্যর্থ", "error");
      return;
    }
    setDeleteTarget(null);
    showToast("ক্রয় অর্ডার মুছে দেওয়া হয়েছে ✓", "success");
    load();
  }

  async function duplicatePO(order: PurchaseOrder) {
    setDuplicating(order.id);
    const res = await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duplicateFromId: order.id }),
    });
    setDuplicating(null);
    if (res.ok) {
      showToast("PO অনুলিপি তৈরি হয়েছে ✓", "success");
      load();
    } else showToast("অনুলিপি তৈরি ব্যর্থ", "error");
  }

  async function sendWhatsApp(id: string) {
    setSendingWA(id);
    const res = await fetch(`/api/purchase-orders/${id}/send-whatsapp`, { method: "POST" });
    const data = await res.json();
    setSendingWA(null);
    if (res.ok) {
      showToast("WhatsApp বার্তা পাঠানো হয়েছে ✓", "success");
      load();
    } else showToast(data.error ?? "WhatsApp পাঠানো যায়নি", "error");
  }

  async function sendSMS(id: string) {
    setSendingSMS(id);
    const res = await fetch(`/api/purchase-orders/${id}/send-sms`, { method: "POST" });
    const data = await res.json();
    setSendingSMS(null);
    if (res.ok) {
      showToast("SMS পাঠানো হয়েছে ✓", "success");
      load();
    } else showToast(data.error ?? "SMS পাঠানো যায়নি", "error");
  }

  async function bulkAction(action: "send" | "cancel") {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    const res = await fetch("/api/purchase-orders/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds), action }),
    });
    const data = await res.json();
    setBulkLoading(false);
    setSelectedIds(new Set());
    if (res.ok) {
      showToast(`${data.updated}টি PO আপডেট হয়েছে ✓`, "success");
      load();
    } else showToast("Bulk action ব্যর্থ", "error");
  }

  function handleExport() {
    setExporting(true);
    try {
      const rows = [
        ["PO নং", "সরবরাহকারী", "তারিখ", "প্রত্যাশিত", "স্ট্যাটাস", "পণ্য", "পরিমাণ", "একক মূল্য", "সাবটোটাল"],
      ];
      for (const o of orders) {
        for (const item of o.items) {
          rows.push([
            o.poNumber,
            o.supplier?.name ?? "—",
            new Date(o.createdAt).toLocaleDateString("bn-BD"),
            o.expectedDate ? new Date(o.expectedDate).toLocaleDateString("bn-BD") : "—",
            o.status,
            item.name,
            String(item.quantity),
            String(item.unitPrice),
            String(item.subtotal),
          ]);
        }
      }
      const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "purchase-orders.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Export ব্যর্থ", "error");
    }
    setExporting(false);
  }

  const overdueCount = stats?.overdueCount ?? 0;

  return (
    <PageShell
      title="ক্রয় অর্ডার (PO)"
      subtitle="Supplier থেকে মাল কেনার formal অর্ডার তৈরি ও ট্র্যাক করুন"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          {selectedIds.size > 0 && (
            <>
              <Button variant="secondary" size="sm" icon={Send} onClick={() => bulkAction("send")} loading={bulkLoading}>
                পাঠান ({selectedIds.size})
              </Button>
              <Button variant="danger" size="sm" icon={Ban} onClick={() => bulkAction("cancel")} loading={bulkLoading}>
                বাতিল ({selectedIds.size})
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" icon={Download} onClick={handleExport} loading={exporting}>CSV</Button>
          <Button icon={Plus} onClick={() => setShowPanel(true)}>নতুন PO</Button>
        </div>
      }
    >
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl flex items-center gap-2"
          style={{ backgroundColor: toast.type === "success" ? "#059669" : "#DC2626" }}
        >
          {toast.type === "success" ? <CheckCircle2 size={14} /> : <X size={14} />} {toast.msg}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">অর্ডার মুছবেন?</h3>
            <p className="text-sm text-gray-500 mb-1">
              <span className="font-semibold text-gray-800">{deleteTarget.poNumber}</span> —{" "}
              {formatBDT(deleteTarget.total)}
            </p>
            <p className="text-xs text-gray-400 mb-6">এই ক্রয় অর্ডারটি স্থায়ীভাবে মুছে যাবে।</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700"
              >
                বাতিল
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold"
              >
                মুছে দিন
              </button>
            </div>
          </div>
        </div>
      )}

      {receiveTarget && (
        <ReceiveConfirmModal
          order={receiveTarget}
          onClose={() => setReceiveTarget(null)}
          onConfirm={handleReceive}
        />
      )}

      {(showPanel || editOrder) && (
        <POFormPanel
          onClose={() => {
            setShowPanel(false);
            setEditOrder(null);
          }}
          onSave={load}
          isDesktop={isDesktop}
          initialProduct={prefillProduct}
          initialSupplierId={prefillSupplierId}
          editOrder={editOrder}
        />
      )}

      {overdueCount > 0 && !dismissedBanner && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-red-50 border border-red-100">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            <p className="text-sm font-bold text-red-700">
              {overdueCount}টি PO ডেলিভারি বিলম্বিত
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowOverdue(true)}
              className="text-xs font-bold text-red-600 hover:underline"
            >
              সব দেখুন
            </button>
            <button onClick={() => setDismissedBanner(true)} className="text-gray-400">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <POStatsCards stats={stats} loading={loading && !stats} />

      <Card padding="none">
        <POFilters
          search={search}
          onSearchChange={setSearch}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          sort={sort}
          onSortChange={setSort}
          page={page}
          pages={pages}
          total={total}
          onPageChange={setPage}
          showOverdue={showOverdue}
          onOverdueChange={setShowOverdue}
        />

        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-5 animate-pulse">
                <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-48" />
                  <div className="h-3 bg-gray-100 rounded w-64" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="কোনো ক্রয় অর্ডার পাওয়া যায়নি"
            description="Supplier-এর কাছে প্রথম PO পাঠান"
            action={{ label: "নতুন PO", onClick: () => setShowPanel(true) }}
          />
        ) : (
          <>
            {orders.map((order) => (
              <POCard
                key={order.id}
                order={order}
                isExpanded={expandedId === order.id}
                onToggle={() =>
                  setExpandedId(expandedId === order.id ? null : order.id)
                }
                onChangeStatus={changeStatus}
                onDeleteRequest={setDeleteTarget}
                onEdit={setEditOrder}
                onDuplicate={duplicatePO}
                onReceiveRequest={setReceiveTarget}
                onSendWA={sendWhatsApp}
                onSendSMS={sendSMS}
                sendingWA={sendingWA === order.id}
                sendingSMS={sendingSMS === order.id}
                duplicating={duplicating === order.id}
                showCheckbox
                selected={selectedIds.has(order.id)}
                onSelect={(id, checked) => {
                  setSelectedIds((prev) => {
                    const next = new Set(prev);
                    if (checked) next.add(id);
                    else next.delete(id);
                    return next;
                  });
                }}
              />
            ))}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">{total}টি অর্ডার</span>
              <span className="font-black text-gray-900 text-base">
                {formatBDT(orders.reduce((s, o) => s + o.total, 0))}
              </span>
            </div>
          </>
        )}
      </Card>
    </PageShell>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto p-12 flex items-center justify-center gap-3 text-gray-400">
          <Loader2 size={20} className="animate-spin" /> লোড হচ্ছে...
        </div>
      }
    >
      <PurchaseOrdersContent />
    </Suspense>
  );
}
