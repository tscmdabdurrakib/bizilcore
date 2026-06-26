"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus, X, FileText, Check, Trash2, Download, Loader2, AlertTriangle,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { getPublicInvoiceUrl, getStatusLabel } from "@/lib/invoices/utils";
import type { Invoice, InvoiceStats } from "@/lib/invoices/types";
import InvoiceFormPanel from "./components/InvoiceFormPanel";
import InvoicePaymentModal from "./components/InvoicePaymentModal";
import InvoiceCard from "./components/InvoiceCard";
import InvoiceFilters from "./components/InvoiceFilters";
import InvoiceStatsCards from "./components/InvoiceStatsCards";
import { isPastDue } from "./components/DueDateChip";
import { PageShell, Button, Card, EmptyState } from "@/components/ui";

function InvoicesContent() {
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [sendingWA, setSendingWA] = useState<string | null>(null);
  const [sendingSMS, setSendingSMS] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = useState(false);

  useEffect(() => {
    if (searchParams.get("create") === "1") setShowPanel(true);
  }, [searchParams]);

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
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "30");

    const [listRes, statsRes] = await Promise.all([
      fetch(`/api/invoices?${params}`),
      fetch("/api/invoices/stats"),
    ]);
    if (!listRes.ok) {
      showToast("ইনভয়েস লোড করা যায়নি", "error");
      setLoading(false);
      return;
    }
    const data = await listRes.json();
    const statsData = statsRes.ok ? await statsRes.json() : null;
    setInvoices(data.invoices ?? []);
    setPages(data.pages ?? 1);
    setTotal(data.total ?? 0);
    setStats(statsData);
    setLoading(false);
  }, [filterStatus, debouncedSearch, dateFrom, dateTo, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(id: string, status: string) {
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    showToast(status === "paid" ? "পরিশোধিত চিহ্নিত হয়েছে ✓" : "Status আপডেট হয়েছে ✓", "success");
    load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/invoices/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    showToast("ইনভয়েস মুছে দেওয়া হয়েছে ✓", "success");
    load();
  }

  async function duplicateInvoice(inv: Invoice) {
    setDuplicating(inv.id);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: inv.customer?.id ?? null,
        items: inv.items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          productId: i.productId,
        })),
        discount: inv.discount,
        taxRate: inv.taxRate,
        notes: inv.notes || "",
        dueDate: inv.dueDate,
      }),
    });
    setDuplicating(null);
    if (res.ok) {
      showToast("ইনভয়েসের অনুলিপি তৈরি হয়েছে!", "success");
      load();
    } else showToast("অনুলিপি তৈরি করা যায়নি", "error");
  }

  async function sendWhatsApp(id: string) {
    setSendingWA(id);
    const res = await fetch(`/api/invoices/${id}/send-whatsapp`, { method: "POST" });
    const data = await res.json();
    setSendingWA(null);
    if (res.ok) showToast("WhatsApp বার্তা পাঠানো হয়েছে!", "success");
    else showToast(data.error ?? "WhatsApp পাঠানো যায়নি", "error");
  }

  async function sendSMSReminder(id: string) {
    setSendingSMS(id);
    const res = await fetch(`/api/invoices/${id}/send-sms`, { method: "POST" });
    const data = await res.json();
    setSendingSMS(null);
    if (res.ok) showToast("SMS পাঠানো হয়েছে!", "success");
    else showToast(data.error ?? "SMS পাঠানো যায়নি", "error");
  }

  function copyLink(inv: Invoice) {
    navigator.clipboard.writeText(getPublicInvoiceUrl(inv.token));
    showToast("পাবলিক লিংক কপি হয়েছে!", "success");
  }

  async function markAllOverdue() {
    const toMark = invoices.filter((inv) => inv.status === "sent" && isPastDue(inv.dueDate));
    await Promise.all(
      toMark.map((inv) =>
        fetch(`/api/invoices/${inv.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "overdue" }),
        })
      )
    );
    setDismissedBanner(true);
    showToast(`${toMark.length}টি ইনভয়েস বকেয়া চিহ্নিত হয়েছে`, "success");
    load();
  }

  async function bulkSendReminder(channel: "whatsapp" | "sms") {
    if (selectedIds.size === 0) return;
    setBulkSending(true);
    const ids = Array.from(selectedIds);
    const results = await Promise.all(
      ids.map((id) =>
        fetch(`/api/invoices/${id}/send-${channel === "whatsapp" ? "whatsapp" : "sms"}`, { method: "POST" })
      )
    );
    const ok = results.filter((r) => r.ok).length;
    setBulkSending(false);
    setSelectedIds(new Set());
    showToast(`${ok}/${ids.length}টি ${channel === "whatsapp" ? "WhatsApp" : "SMS"} পাঠানো হয়েছে`, ok ? "success" : "error");
  }

  function handleExport(selectedOnly = false) {
    setExporting(true);
    try {
      const list = selectedOnly
        ? invoices.filter((i) => selectedIds.has(i.id))
        : invoices;
      const rows = [["ইনভয়েস নং", "কাস্টমার", "ফোন", "তারিখ", "স্ট্যাটাস", "সাবটোটাল", "ছাড়", "VAT", "মোট", "পরিশোধিত"]];
      for (const inv of list) {
        rows.push([
          inv.invoiceNumber,
          inv.customer?.name ?? "অতিথি",
          inv.customer?.phone ?? "",
          new Date(inv.createdAt).toLocaleDateString("bn-BD"),
          getStatusLabel(inv.status),
          String(inv.subtotal),
          String(inv.discount),
          String(inv.taxAmount),
          String(inv.total),
          String(inv.paidAmount),
        ]);
      }
      const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "invoices.csv";
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
      title="ইনভয়েস"
      subtitle="কাস্টমারদের ইনভয়েস তৈরি ও ট্র্যাক করুন"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          {selectedIds.size > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={() => bulkSendReminder("whatsapp")} loading={bulkSending}>
                WA ({selectedIds.size})
              </Button>
              <Button variant="outline" size="sm" onClick={() => bulkSendReminder("sms")} loading={bulkSending}>
                SMS ({selectedIds.size})
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport(true)}>Export</Button>
            </>
          )}
          <Button variant="outline" size="sm" icon={Download} onClick={() => handleExport(false)} loading={exporting}>CSV</Button>
          <Button icon={Plus} onClick={() => setShowPanel(true)}>নতুন ইনভয়েস</Button>
        </div>
      }
    >
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl flex items-center gap-2"
          style={{ backgroundColor: toast.type === "success" ? "#059669" : "#DC2626" }}
        >
          {toast.type === "success" ? <Check size={14} /> : <X size={14} />} {toast.msg}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">ইনভয়েস মুছবেন?</h3>
            <p className="text-sm text-gray-500 mb-1">
              <span className="font-semibold text-gray-800">{deleteTarget.invoiceNumber}</span> —{" "}
              {formatBDT(deleteTarget.total)}
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-2xl border text-sm font-bold">
                বাতিল
              </button>
              <button onClick={handleDelete} className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold">
                মুছে দিন
              </button>
            </div>
          </div>
        </div>
      )}

      {showPanel && (
        <InvoiceFormPanel mode="create" onClose={() => setShowPanel(false)} onSave={load} isDesktop={isDesktop} />
      )}
      {editInvoice && (
        <InvoiceFormPanel
          mode="edit"
          invoice={editInvoice}
          onClose={() => setEditInvoice(null)}
          onSave={load}
          isDesktop={isDesktop}
        />
      )}
      {paymentInvoice && (
        <InvoicePaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onSaved={load}
        />
      )}

      {duplicating && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl flex items-center gap-2 bg-emerald-700">
          <Loader2 size={14} className="animate-spin" /> অনুলিপি তৈরি হচ্ছে...
        </div>
      )}

      <InvoiceStatsCards stats={stats} loading={loading && !stats} />

      {overdueCount > 0 && !dismissedBanner && (
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-red-50 border border-red-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={17} className="text-red-500" />
            <p className="text-sm font-bold text-red-700">{overdueCount}টি ইনভয়েস বকেয়া</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={markAllOverdue} className="text-xs font-bold px-3 py-1.5 rounded-xl text-white bg-red-500">
              বকেয়া চিহ্নিত
            </button>
            <button onClick={() => setDismissedBanner(true)} className="p-1 rounded-lg hover:bg-red-100">
              <X size={14} className="text-red-500" />
            </button>
          </div>
        </div>
      )}

      <Card padding="none">
        <InvoiceFilters
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          filterStatus={filterStatus}
          onStatusChange={(v) => {
            setFilterStatus(v);
            setPage(1);
          }}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={(v) => {
            setDateFrom(v);
            setPage(1);
          }}
          onDateToChange={(v) => {
            setDateTo(v);
            setPage(1);
          }}
          sort={sort}
          onSortChange={setSort}
          page={page}
          pages={pages}
          total={total}
          onPageChange={setPage}
        />

        {loading ? (
          <div className="divide-y divide-gray-50 p-5 space-y-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              ))}
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="কোনো ইনভয়েস পাওয়া যায়নি"
            action={{ label: "নতুন ইনভয়েস", onClick: () => setShowPanel(true) }}
          />
        ) : (
          <>
            {invoices.map((inv) => (
              <InvoiceCard
                key={inv.id}
                inv={inv}
                isExpanded={expandedId === inv.id}
                onToggle={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                onChangeStatus={changeStatus}
                onDeleteRequest={setDeleteTarget}
                onDuplicate={duplicateInvoice}
                onSendWA={sendWhatsApp}
                onSendSMS={sendSMSReminder}
                onCopyLink={copyLink}
                onEdit={setEditInvoice}
                onPayment={setPaymentInvoice}
                sendingWA={sendingWA === inv.id}
                sendingSMS={sendingSMS === inv.id}
                showCheckbox
                selected={selectedIds.has(inv.id)}
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
            <div className="px-5 py-4 bg-gray-50 border-t flex justify-between">
              <span className="text-sm text-gray-500">{total}টি ইনভয়েস</span>
              <span className="font-black">{formatBDT(invoices.reduce((s, i) => s + i.total, 0))}</span>
            </div>
          </>
        )}
      </Card>
    </PageShell>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">লোড হচ্ছে...</div>}>
      <InvoicesContent />
    </Suspense>
  );
}
