"use client";

import Link from "next/link";
import {
  ChevronDown, ChevronUp, Check, Send, Trash2, Copy, Printer,
  MessageCircle, MessageSquare, Users, Eye, Link2, BadgeDollarSign, Ban, Pencil,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { DueDateChip, isPastDue } from "./DueDateChip";
import { InvoiceAvatar } from "./InvoiceAvatar";
import type { Invoice } from "@/lib/invoices/types";

export default function InvoiceCard({
  inv,
  isExpanded,
  onToggle,
  onChangeStatus,
  onDeleteRequest,
  onDuplicate,
  onSendWA,
  onSendSMS,
  onCopyLink,
  onEdit,
  onPayment,
  sendingWA,
  sendingSMS,
  selected,
  onSelect,
  showCheckbox,
}: {
  inv: Invoice;
  isExpanded: boolean;
  onToggle: () => void;
  onChangeStatus: (id: string, s: string) => void;
  onDeleteRequest: (inv: Invoice) => void;
  onDuplicate: (inv: Invoice) => void;
  onSendWA: (id: string) => void;
  onSendSMS: (id: string) => void;
  onCopyLink: (inv: Invoice) => void;
  onEdit: (inv: Invoice) => void;
  onPayment: (inv: Invoice) => void;
  sendingWA: boolean;
  sendingSMS: boolean;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  showCheckbox?: boolean;
}) {
  const hasPhone =
    !!inv.customer?.phone &&
    ["sent", "overdue", "partial"].includes(inv.status);
  const canPay = ["sent", "overdue", "partial"].includes(inv.status);

  return (
    <div className="border-b border-gray-50 last:border-0">
      <div className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50/40 transition-colors">
        {showCheckbox && onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(inv.id, e.target.checked)}
            className="mt-3 rounded border-gray-300"
          />
        )}
        {inv.customer ? (
          <InvoiceAvatar name={inv.customer.name} />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
            <Users size={16} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/invoices/${inv.id}`}
                className="font-mono text-sm font-black text-emerald-700 hover:underline"
              >
                {inv.invoiceNumber}
              </Link>
              <InvoiceStatusBadge status={inv.status} />
              <DueDateChip dueDate={inv.dueDate} status={inv.status} />
            </div>
            <p className="font-black text-gray-900 text-base">{formatBDT(inv.total)}</p>
          </div>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-sm text-gray-700 font-medium">
              {inv.customer?.name ?? "অতিথি কাস্টমার"}
            </span>
            {inv.customer?.phone && (
              <span className="text-xs text-gray-400">• {inv.customer.phone}</span>
            )}
            <span className="text-xs text-gray-400">
              • {new Date(inv.createdAt).toLocaleDateString("bn-BD")}
            </span>
            {inv.paidAmount > 0 && inv.status !== "paid" && (
              <span className="text-xs text-amber-600 font-semibold">
                • {formatBDT(inv.paidAmount)} পরিশোধিত
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            <Link
              href={`/invoices/${inv.id}`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-gray-50 text-gray-700 hover:bg-gray-100"
            >
              <Eye size={11} /> বিস্তারিত
            </Link>

            {(inv.status === "draft" || ["sent", "overdue", "partial"].includes(inv.status)) && (
              <button
                onClick={() => onEdit(inv)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-gray-50 text-gray-700 hover:bg-gray-100"
              >
                <Pencil size={11} /> সম্পাদনা
              </button>
            )}

            {hasPhone && (
              <>
                <button
                  onClick={() => onSendWA(inv.id)}
                  disabled={sendingWA}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50"
                >
                  <MessageCircle size={12} /> {sendingWA ? "..." : "WhatsApp"}
                </button>
                <button
                  onClick={() => onSendSMS(inv.id)}
                  disabled={sendingSMS}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                >
                  <MessageSquare size={12} /> SMS
                </button>
              </>
            )}

            <button
              onClick={() => onCopyLink(inv)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100"
            >
              <Link2 size={11} /> লিংক
            </button>

            {inv.status === "draft" && (
              <button
                onClick={() => onChangeStatus(inv.id, "sent")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                <Send size={11} /> পাঠান
              </button>
            )}

            {canPay && (
              <>
                <button
                  onClick={() => onPayment(inv)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100"
                >
                  <BadgeDollarSign size={11} /> পেমেন্ট
                </button>
                <button
                  onClick={() => onChangeStatus(inv.id, "paid")}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                >
                  <Check size={11} /> পরিশোধিত
                </button>
              </>
            )}

            {inv.status === "sent" && isPastDue(inv.dueDate) && (
              <button
                onClick={() => onChangeStatus(inv.id, "overdue")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100"
              >
                বকেয়া
              </button>
            )}

            {!["paid", "cancelled"].includes(inv.status) && (
              <button
                onClick={() => onChangeStatus(inv.id, "cancelled")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-gray-50 text-gray-500 hover:bg-gray-100"
              >
                <Ban size={11} /> বাতিল
              </button>
            )}

            <span className="w-px h-4 bg-gray-200" />

            <button onClick={() => onDuplicate(inv)} title="অনুলিপি" className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400">
              <Copy size={13} />
            </button>
            <Link
              href={`/invoices/${inv.id}/print`}
              target="_blank"
              className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 inline-flex"
            >
              <Printer size={13} />
            </Link>
            <button
              onClick={() => onDeleteRequest(inv)}
              className="p-1.5 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <button
          onClick={onToggle}
          className="flex-shrink-0 w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 mt-0.5"
        >
          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 bg-gray-50/60">
          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">পণ্য / সেবা</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500">পরিমাণ</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">একক মূল্য</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">মোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {inv.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-gray-800 font-medium">{item.description}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{formatBDT(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">{formatBDT(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-100">
                {inv.discount > 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-xs text-gray-500">ছাড়:</td>
                    <td className="px-4 py-2 text-right text-xs text-gray-500">− {formatBDT(inv.discount)}</td>
                  </tr>
                )}
                {inv.taxAmount > 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-xs text-gray-500">VAT:</td>
                    <td className="px-4 py-2 text-right text-xs text-gray-500">+ {formatBDT(inv.taxAmount)}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-700">মোট:</td>
                  <td className="px-4 py-3 text-right font-black text-emerald-700 text-base">{formatBDT(inv.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {inv.notes && <p className="mt-2 text-xs text-gray-500 px-1">📝 {inv.notes}</p>}
          {inv.paidAt && (
            <p className="mt-1 text-xs text-emerald-600 font-semibold px-1">
              ✓ পরিশোধিত: {new Date(inv.paidAt).toLocaleDateString("bn-BD")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
