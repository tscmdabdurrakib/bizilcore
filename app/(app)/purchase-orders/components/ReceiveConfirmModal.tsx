"use client";

import { useState } from "react";
import { PackageCheck, X, Loader2 } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import type { PurchaseOrder } from "@/lib/purchase-orders/types";

export default function ReceiveConfirmModal({
  order,
  onClose,
  onConfirm,
}: {
  order: PurchaseOrder;
  onClose: () => void;
  onConfirm: (items: { itemId: string; receivedQuantity: number }[]) => Promise<void>;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const item of order.items) {
      map[item.id] = item.quantity - (item.receivedQuantity ?? 0);
    }
    return map;
  });
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    const items = order.items
      .map((item) => ({
        itemId: item.id,
        receivedQuantity: quantities[item.id] ?? 0,
      }))
      .filter((i) => i.receivedQuantity > 0);
    await onConfirm(items);
    setLoading(false);
  }

  const receiveTotal = order.items.reduce(
    (s, item) => s + (quantities[item.id] ?? 0) * item.unitPrice,
    0
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <PackageCheck size={22} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">পণ্য গ্রহণ নিশ্চিত করুন</h3>
              <p className="text-xs text-gray-500 font-mono">{order.poNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          স্টক বাড়বে এবং Hisab-এ Purchase এন্ট্রি তৈরি হবে।
        </p>

        <div className="space-y-3 mb-4">
          {order.items.map((item) => {
            const remaining = item.quantity - (item.receivedQuantity ?? 0);
            if (remaining <= 0) return null;
            return (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">
                    অর্ডার: {item.quantity} · ইতিমধ্যে: {item.receivedQuantity ?? 0}
                  </p>
                </div>
                <input
                  type="number"
                  min="0"
                  max={remaining}
                  value={quantities[item.id] ?? 0}
                  onChange={(e) =>
                    setQuantities((p) => ({
                      ...p,
                      [item.id]: Math.min(remaining, parseInt(e.target.value) || 0),
                    }))
                  }
                  className="w-16 h-9 border border-gray-200 rounded-xl px-2 text-sm text-center"
                />
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-5 px-1">
          <span className="text-sm font-bold text-gray-700">এই গ্রহণের মূল্য</span>
          <span className="font-black text-emerald-700">{formatBDT(receiveTotal)}</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700"
          >
            বাতিল
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || receiveTotal <= 0}
            className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <PackageCheck size={15} />}
            গ্রহণ নিশ্চিত
          </button>
        </div>
      </div>
    </div>
  );
}
