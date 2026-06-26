"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Printer, Send, Check, Trash2, Copy, MessageCircle, MessageSquare,
  Link2, BadgeDollarSign, Ban, Pencil, Mail, Download, Loader2,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { getPublicInvoiceUrl, paymentMethodLabel } from "@/lib/invoices/utils";
import type { Invoice } from "@/lib/invoices/types";
import { InvoiceStatusBadge } from "../components/InvoiceStatusBadge";
import { DueDateChip } from "../components/DueDateChip";
import InvoiceFormPanel from "../components/InvoiceFormPanel";
import InvoicePaymentModal from "../components/InvoicePaymentModal";
import { PageShell, Button, Card, SectionTitle } from "@/components/ui";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<(Invoice & { shop?: Record<string, string | null> }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [sendingWA, setSendingWA] = useState(false);
  const [sendingSMS, setSendingSMS] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
  }, []);

  async function load() {
    const res = await fetch(`/api/invoices/${id}`);
    if (res.ok) setInvoice(await res.json());
    else router.push("/invoices");
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function changeStatus(status: string) {
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    showToast("আপডেট হয়েছে ✓", "success");
    load();
  }

  async function handleDelete() {
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    router.push("/invoices");
  }

  async function duplicate() {
    if (!invoice) return;
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: invoice.customer?.id ?? null,
        items: invoice.items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          productId: i.productId,
        })),
        discount: invoice.discount,
        taxRate: invoice.taxRate,
        notes: invoice.notes || "",
        dueDate: invoice.dueDate,
      }),
    });
    if (res.ok) {
      const dup = await res.json();
      router.push(`/invoices/${dup.id}`);
    }
  }

  async function sendWA() {
    setSendingWA(true);
    const res = await fetch(`/api/invoices/${id}/send-whatsapp`, { method: "POST" });
    setSendingWA(false);
    showToast(res.ok ? "WhatsApp পাঠানো হয়েছে!" : "WhatsApp পাঠানো যায়নি", res.ok ? "success" : "error");
  }

  async function sendSMS() {
    setSendingSMS(true);
    const res = await fetch(`/api/invoices/${id}/send-sms`, { method: "POST" });
    setSendingSMS(false);
    showToast(res.ok ? "SMS পাঠানো হয়েছে!" : "SMS পাঠানো যায়নি", res.ok ? "success" : "error");
  }

  async function sendEmail() {
    const email = window.prompt("গ্রাহকের ইমেইল ঠিকানা দিন:");
    if (!email?.trim()) return;
    setSendingEmail(true);
    const res = await fetch(`/api/invoices/${id}/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json();
    setSendingEmail(false);
    showToast(res.ok ? "ইমেইল পাঠানো হয়েছে!" : data.error ?? "ইমেইল পাঠানো যায়নি", res.ok ? "success" : "error");
  }

  async function downloadPdf() {
    setDownloadingPdf(true);
    window.open(`/api/invoices/${id}/pdf`, "_blank");
    setDownloadingPdf(false);
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <Loader2 className="animate-spin mx-auto text-emerald-600" />
      </div>
    );
  }

  if (!invoice) return null;

  const due = Math.max(0, invoice.total - invoice.paidAmount);
  const canPay = ["sent", "overdue", "partial"].includes(invoice.status);

  return (
    <PageShell
      title={invoice.invoiceNumber}
      subtitle={new Date(invoice.createdAt).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}
      breadcrumbs={[{ label: "ইনভয়েস", href: "/invoices" }, { label: invoice.invoiceNumber }]}
      actions={<p className="text-2xl font-bold">{formatBDT(invoice.total)}</p>}
    >
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl"
          style={{ backgroundColor: toast.type === "success" ? "#059669" : "#DC2626" }}
        >
          {toast.msg}
        </div>
      )}

      {showEdit && (
        <InvoiceFormPanel
          mode="edit"
          invoice={invoice}
          onClose={() => setShowEdit(false)}
          onSave={load}
          isDesktop={isDesktop}
        />
      )}
      {showPayment && (
        <InvoicePaymentModal invoice={invoice} onClose={() => setShowPayment(false)} onSaved={load} />
      )}

      {deleteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg mb-4">ইনভয়েস মুছবেন?</h3>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(false)} className="flex-1 py-3 rounded-2xl border font-bold">
                বাতিল
              </button>
              <button onClick={handleDelete} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold">
                মুছুন
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap mb-2">
        <InvoiceStatusBadge status={invoice.status} />
        <DueDateChip dueDate={invoice.dueDate} status={invoice.status} />
      </div>

      <Card padding="lg">
        {invoice.customer && (
          <div className="mb-5 p-4 rounded-xl" style={{ backgroundColor: "var(--shell-surface)" }}>
            <SectionTitle title="কাস্টমার" className="mb-2" />
            <Link href={`/customers/${invoice.customer.id}`} className="font-semibold hover:underline">
              {invoice.customer.name}
            </Link>
            {invoice.customer.phone && <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>{invoice.customer.phone}</p>}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {(invoice.status === "draft" || ["sent", "overdue", "partial"].includes(invoice.status)) && (
            <button onClick={() => setShowEdit(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gray-100">
              <Pencil size={13} /> সম্পাদনা
            </button>
          )}
          <Link href={`/invoices/${id}/print`} target="_blank" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gray-100">
            <Printer size={13} /> প্রিন্ট
          </Link>
          <button onClick={downloadPdf} disabled={downloadingPdf} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gray-100">
            <Download size={13} /> PDF
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(getPublicInvoiceUrl(invoice.token));
              showToast("লিংক কপি হয়েছে!", "success");
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-purple-50 text-purple-700"
          >
            <Link2 size={13} /> লিংক
          </button>
          {invoice.customer?.phone && (
            <>
              <button onClick={sendWA} disabled={sendingWA} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-green-50 text-green-700">
                <MessageCircle size={13} /> WhatsApp
              </button>
              <button onClick={sendSMS} disabled={sendingSMS} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700">
                <MessageSquare size={13} /> SMS
              </button>
              <button onClick={sendEmail} disabled={sendingEmail} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700">
                <Mail size={13} /> Email
              </button>
            </>
          )}
          {invoice.status === "draft" && (
            <button onClick={() => changeStatus("sent")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700">
              <Send size={13} /> পাঠান
            </button>
          )}
          {canPay && (
            <>
              <button onClick={() => setShowPayment(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-700">
                <BadgeDollarSign size={13} /> পেমেন্ট
              </button>
              <button onClick={() => changeStatus("paid")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700">
                <Check size={13} /> পরিশোধিত
              </button>
            </>
          )}
          {!["paid", "cancelled"].includes(invoice.status) && (
            <button onClick={() => changeStatus("cancelled")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gray-50 text-gray-500">
              <Ban size={13} /> বাতিল
            </button>
          )}
          <button onClick={duplicate} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gray-100">
            <Copy size={13} /> অনুলিপি
          </button>
          <button onClick={() => setDeleteModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600">
            <Trash2 size={13} /> মুছুন
          </button>
        </div>
      </Card>

      <Card padding="none">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">পণ্য / সেবা</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500">পরিমাণ</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">একক মূল্য</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">মোট</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium">{item.description}</td>
                <td className="px-4 py-3 text-center text-gray-500">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-gray-500">{formatBDT(item.unitPrice)}</td>
                <td className="px-4 py-3 text-right font-bold">{formatBDT(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-4 bg-gray-50 space-y-1 text-sm border-t">
          <div className="flex justify-between text-gray-600">
            <span>সাবটোটাল</span>
            <span>{formatBDT(invoice.subtotal)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>ছাড়</span>
              <span>− {formatBDT(invoice.discount)}</span>
            </div>
          )}
          {invoice.taxAmount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>VAT ({invoice.taxRate}%)</span>
              <span>+ {formatBDT(invoice.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-lg text-emerald-700 pt-2 border-t">
            <span>মোট</span>
            <span>{formatBDT(invoice.total)}</span>
          </div>
          {invoice.paidAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>পরিশোধিত</span>
              <span>{formatBDT(invoice.paidAmount)}</span>
            </div>
          )}
          {due > 0 && invoice.status !== "paid" && (
            <div className="flex justify-between text-red-600 font-bold">
              <span>বাকি</span>
              <span>{formatBDT(due)}</span>
            </div>
          )}
        </div>
      </Card>

      {invoice.notes && (
        <Card padding="md" className="text-sm" style={{ color: "var(--bg-warning-text)", backgroundColor: "var(--bg-warning-soft)" }}>
          <strong>নোট:</strong> {invoice.notes}
        </Card>
      )}

      {invoice.payments && invoice.payments.length > 0 && (
        <Card padding="none">
          <div className="px-5 py-3 font-bold text-sm" style={{ borderBottom: "1px solid var(--c-border)" }}>পেমেন্ট ইতিহাস</div>
          {invoice.payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3 border-b last:border-0 text-sm">
              <div>
                <p className="font-semibold">{formatBDT(p.amount)}</p>
                <p className="text-xs text-gray-500">
                  {paymentMethodLabel(p.method)} • {new Date(p.paidAt).toLocaleDateString("bn-BD")}
                </p>
                {p.note && <p className="text-xs text-gray-400">{p.note}</p>}
              </div>
            </div>
          ))}
        </Card>
      )}
    </PageShell>
  );
}
