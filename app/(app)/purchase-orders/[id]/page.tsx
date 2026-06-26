"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, ShoppingCart, Send, PackageCheck, Ban, Printer,
  MessageCircle, Copy, Pencil, Loader2, CheckCircle2, X, ExternalLink,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";
import type { PurchaseOrder } from "@/lib/purchase-orders/types";
import POStatusBadge from "../components/POStatusBadge";
import ExpectedChip from "../components/ExpectedChip";
import POFormPanel from "../components/POFormPanel";
import ReceiveConfirmModal from "../components/ReceiveConfirmModal";
import { PageShell, Card, SectionTitle } from "@/components/ui";

export default function PODetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOrder, setEditOrder] = useState<PurchaseOrder | null>(null);
  const [receiveTarget, setReceiveTarget] = useState<PurchaseOrder | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [isDesktop, setIsDesktop] = useState(true);
  const [sendingWA, setSendingWA] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function load() {
    const res = await fetch(`/api/purchase-orders/${id}`);
    if (!res.ok) {
      setLoading(false);
      return;
    }
    setOrder(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
  }, [id]);

  async function changeStatus(status: string) {
    const res = await fetch(`/api/purchase-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json();
      showToast(data.error ?? "ব্যর্থ", "error");
      return;
    }
    showToast("আপডেট হয়েছে ✓", "success");
    load();
  }

  async function handleReceive(items: { itemId: string; receivedQuantity: number }[]) {
    const res = await fetch(`/api/purchase-orders/${id}`, {
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
    showToast("পণ্য গ্রহণ সম্পন্ন ✓", "success");
    load();
  }

  async function sendWhatsApp() {
    setSendingWA(true);
    const res = await fetch(`/api/purchase-orders/${id}/send-whatsapp`, { method: "POST" });
    const data = await res.json();
    setSendingWA(false);
    if (res.ok) {
      showToast("WhatsApp পাঠানো হয়েছে ✓", "success");
      load();
    } else showToast(data.error ?? "ব্যর্থ", "error");
  }

  async function duplicate() {
    setDuplicating(true);
    const res = await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duplicateFromId: id }),
    });
    setDuplicating(false);
    if (res.ok) {
      const po = await res.json();
      showToast("অনুলিপি তৈরি ✓", "success");
      router.push(`/purchase-orders/${po.id}`);
    } else showToast("অনুলিপি ব্যর্থ", "error");
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-12 flex items-center justify-center gap-3 text-gray-400">
        <Loader2 size={20} className="animate-spin" /> লোড হচ্ছে...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto p-12 text-center text-gray-500">
        PO পাওয়া যায়নি
        <Link href="/purchase-orders" className="block mt-4 text-emerald-600 hover:underline">
          ← ফিরে যান
        </Link>
      </div>
    );
  }

  const canEdit = ["draft", "sent", "partially_received"].includes(order.status);
  const canReceive = ["sent", "partially_received"].includes(order.status);

  const timeline = [
    { label: "তৈরি", date: order.createdAt, done: true },
    { label: "পাঠানো", date: order.sentAt, done: !!order.sentAt },
    { label: "গ্রহণ", date: order.receivedAt, done: !!order.receivedAt },
  ];

  return (
    <PageShell
      title={order.poNumber}
      subtitle={`${order.supplier?.name ?? "সরবরাহকারী নেই"} · ${new Date(order.createdAt).toLocaleDateString("bn-BD")}`}
      breadcrumbs={[{ label: "ক্রয় অর্ডার", href: "/purchase-orders" }, { label: order.poNumber }]}
      actions={<p className="text-xl font-bold">{formatBDT(order.total)}</p>}
    >
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl flex items-center gap-2"
          style={{ backgroundColor: toast.type === "success" ? "#059669" : "#DC2626" }}
        >
          {toast.type === "success" ? <CheckCircle2 size={14} /> : <X size={14} />} {toast.msg}
        </div>
      )}

      {editOrder && (
        <POFormPanel
          onClose={() => setEditOrder(null)}
          onSave={load}
          isDesktop={isDesktop}
          editOrder={editOrder}
        />
      )}

      {receiveTarget && (
        <ReceiveConfirmModal
          order={receiveTarget}
          onClose={() => setReceiveTarget(null)}
          onConfirm={handleReceive}
        />
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <POStatusBadge status={order.status} />
        <ExpectedChip date={order.expectedDate} status={order.status} />
      </div>

      <Card padding="md">
        <SectionTitle title="Timeline" />
        <div className="flex gap-4">
          {timeline.map((step, i) => (
            <div key={step.label} className="flex-1 text-center">
              <div
                className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-xs font-bold ${
                  step.done ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"
                }`}
              >
                {i + 1}
              </div>
              <p className="text-xs font-bold text-gray-700">{step.label}</p>
              {step.date && (
                <p className="text-[10px] text-gray-400">
                  {new Date(step.date).toLocaleDateString("bn-BD")}
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {order.status === "draft" && (
          <button
            onClick={() => changeStatus("sent")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700"
          >
            <Send size={13} /> Supplier-এ পাঠান
          </button>
        )}
        {canReceive && (
          <button
            onClick={() => setReceiveTarget(order)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700"
          >
            <PackageCheck size={13} /> পণ্য পাওয়া গেছে
          </button>
        )}
        {(order.status === "draft" || order.status === "sent") && (
          <button
            onClick={() => changeStatus("cancelled")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600"
          >
            <Ban size={13} /> বাতিল
          </button>
        )}
        {canEdit && (
          <button
            onClick={() => setEditOrder(order)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gray-100"
          >
            <Pencil size={13} /> সম্পাদনা
          </button>
        )}
        <Link
          href={`/purchase-orders/${id}/print`}
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gray-100"
        >
          <Printer size={13} /> প্রিন্ট
        </Link>
        {order.supplier && (
          <button
            onClick={sendWhatsApp}
            disabled={sendingWA}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-green-50 text-green-700 disabled:opacity-50"
          >
            <MessageCircle size={13} /> {sendingWA ? "..." : "WhatsApp"}
          </button>
        )}
        <button
          onClick={duplicate}
          disabled={duplicating}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 disabled:opacity-50"
        >
          <Copy size={13} /> {duplicating ? "..." : "অনুলিপি"}
        </button>
      </div>

      {order.purchase && (
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-purple-800">Hisab Purchase তৈরি হয়েছে</p>
            <p className="text-xs text-purple-600">
              ৳{order.purchase.totalAmount.toLocaleString("bn-BD")} · বাকি ৳
              {order.purchase.dueAmount.toLocaleString("bn-BD")}
            </p>
          </div>
          <Link
            href="/hisab/purchases"
            className="flex items-center gap-1 text-xs font-bold text-purple-700 hover:underline"
          >
            <ExternalLink size={12} /> দেখুন
          </Link>
        </div>
      )}

      <Card padding="none">
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <ShoppingCart size={16} style={{ color: "var(--c-primary)" }} />
          <SectionTitle title="পণ্যসমূহ" className="mb-0" />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">পণ্য</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500">অর্ডার</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500">পাওয়া</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">মূল্য</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">মোট</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-center text-gray-500">{item.quantity}</td>
                <td className="px-4 py-3 text-center text-gray-500">
                  {item.receivedQuantity ?? 0}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">
                  {formatBDT(item.unitPrice)}
                </td>
                <td className="px-4 py-3 text-right font-bold">{formatBDT(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {order.notes && (
        <Card padding="md" className="text-sm" style={{ color: "var(--bg-warning-text)", backgroundColor: "var(--bg-warning-soft)" }}>
          📝 {order.notes}
        </Card>
      )}
    </PageShell>
  );
}
