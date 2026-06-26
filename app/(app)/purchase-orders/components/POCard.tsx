"use client";

import Link from "next/link";
import {
  Trash2, PackageCheck, ChevronDown, ChevronUp, Send, Ban, Building2,
  Printer, MessageCircle, Copy, Pencil, ExternalLink,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";
import type { PurchaseOrder } from "@/lib/purchase-orders/types";
import POStatusBadge from "./POStatusBadge";
import ExpectedChip from "./ExpectedChip";

export default function POCard({
  order,
  isExpanded,
  onToggle,
  onChangeStatus,
  onDeleteRequest,
  onEdit,
  onDuplicate,
  onReceiveRequest,
  onSendWA,
  onSendSMS,
  sendingWA,
  sendingSMS,
  duplicating,
  showCheckbox,
  selected,
  onSelect,
}: {
  order: PurchaseOrder;
  isExpanded: boolean;
  onToggle: () => void;
  onChangeStatus: (id: string, status: string) => void;
  onDeleteRequest: (order: PurchaseOrder) => void;
  onEdit: (order: PurchaseOrder) => void;
  onDuplicate: (order: PurchaseOrder) => void;
  onReceiveRequest: (order: PurchaseOrder) => void;
  onSendWA: (id: string) => void;
  onSendSMS: (id: string) => void;
  sendingWA: boolean;
  sendingSMS: boolean;
  duplicating: boolean;
  showCheckbox?: boolean;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
}) {
  const canEdit = ["draft", "sent", "partially_received"].includes(order.status);
  const canReceive = ["sent", "partially_received"].includes(order.status);
  const canDelete = ["draft", "cancelled"].includes(order.status);

  return (
    <div className="border-b border-gray-50 last:border-0">
      <div className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50/40 transition-colors">
        {showCheckbox && onSelect && ["draft", "sent"].includes(order.status) && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(order.id, e.target.checked)}
            className="mt-3 w-4 h-4 rounded accent-emerald-600"
          />
        )}

        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: order.supplier
              ? "linear-gradient(135deg,#0F6E56,#065E48)"
              : "#F3F4F6",
          }}
        >
          {order.supplier ? (
            <span className="text-white font-black text-xs">
              {order.supplier.name.slice(0, 2).toUpperCase()}
            </span>
          ) : (
            <Building2 size={16} className="text-gray-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/purchase-orders/${order.id}`}
                className="font-mono text-sm font-black text-emerald-700 hover:underline"
              >
                {order.poNumber}
              </Link>
              <POStatusBadge status={order.status} />
              <ExpectedChip date={order.expectedDate} status={order.status} />
            </div>
            <p className="font-black text-gray-900 text-base">{formatBDT(order.total)}</p>
          </div>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-sm text-gray-700 font-medium">
              {order.supplier?.name ?? (
                <span className="text-gray-400 italic">সরবরাহকারী নেই</span>
              )}
            </span>
            <span className="text-xs text-gray-400">
              • {new Date(order.createdAt).toLocaleDateString("bn-BD")}
            </span>
            {order.expectedDate && order.status !== "received" && (
              <span className="text-xs text-gray-400">
                • প্রত্যাশিত:{" "}
                {new Date(order.expectedDate).toLocaleDateString("bn-BD")}
              </span>
            )}
            {order.receivedAt && (
              <span className="text-xs text-emerald-600 font-semibold">
                • পাওয়া: {new Date(order.receivedAt).toLocaleDateString("bn-BD")}
              </span>
            )}
            {order.purchase && (
              <Link
                href="/hisab/purchases"
                className="text-xs text-purple-600 font-semibold hover:underline flex items-center gap-0.5"
              >
                <ExternalLink size={10} /> Purchase তৈরি
              </Link>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {order.status === "draft" && (
              <button
                onClick={() => onChangeStatus(order.id, "sent")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                <Send size={11} /> Supplier-এ পাঠান
              </button>
            )}
            {canReceive && (
              <button
                onClick={() => onReceiveRequest(order)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              >
                <PackageCheck size={11} /> পণ্য পাওয়া গেছে
              </button>
            )}
            {(order.status === "draft" || order.status === "sent") && (
              <button
                onClick={() => onChangeStatus(order.id, "cancelled")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100"
              >
                <Ban size={11} /> বাতিল
              </button>
            )}

            <span className="w-px h-4 bg-gray-200" />

            {canEdit && (
              <button
                onClick={() => onEdit(order)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-gray-50 text-gray-600 hover:bg-gray-100"
              >
                <Pencil size={11} /> সম্পাদনা
              </button>
            )}
            <Link
              href={`/purchase-orders/${order.id}/print`}
              target="_blank"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-gray-50 text-gray-600 hover:bg-gray-100"
            >
              <Printer size={11} /> প্রিন্ট
            </Link>
            {order.supplier && (
              <>
                <button
                  onClick={() => onSendWA(order.id)}
                  disabled={sendingWA}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50"
                >
                  <MessageCircle size={11} /> {sendingWA ? "..." : "WA"}
                </button>
                <button
                  onClick={() => onSendSMS(order.id)}
                  disabled={sendingSMS}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                >
                  SMS {sendingSMS ? "..." : ""}
                </button>
              </>
            )}
            <button
              onClick={() => onDuplicate(order)}
              disabled={duplicating}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              <Copy size={11} /> {duplicating ? "..." : "অনুলিপি"}
            </button>

            {canDelete && (
              <button
                onClick={() => onDeleteRequest(order)}
                className="p-1.5 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>

          {order.notes && (
            <p className="mt-2 text-xs text-gray-500">📝 {order.notes}</p>
          )}
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
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">
                    পণ্যের নাম
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500">
                    পরিমাণ
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500">
                    পাওয়া
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">
                    একক মূল্য
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">মোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-gray-800 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{item.quantity}</td>
                    <td className="px-4 py-3 text-center text-gray-500">
                      {item.receivedQuantity ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {formatBDT(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">
                      {formatBDT(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-100">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right font-bold text-gray-700">
                    মোট:
                  </td>
                  <td className="px-4 py-3 text-right font-black text-emerald-700 text-base">
                    {formatBDT(order.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
