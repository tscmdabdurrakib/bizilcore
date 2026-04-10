"use client";
import { useState } from "react";
import { CheckCircle, XCircle, PackageCheck, Clock } from "lucide-react";

interface Order {
  id: string;
  commenterName: string;
  commentText: string;
  pageName?: string | null;
  status: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "#FFF3DC", color: "#EF9F27", label: "অপেক্ষায়" },
  confirmed: { bg: "#E1F0FF", color: "#2B7CE9", label: "কনফার্ম" },
  delivered: { bg: "#E1F5EE", color: "#0F6E56", label: "ডেলিভারি" },
  cancelled: { bg: "#FFE8E8", color: "#E24B4A", label: "বাতিল" },
};

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "এইমাত্র";
  if (diff < 3600) return `${Math.floor(diff / 60)} মিনিট আগে`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ঘণ্টা আগে`;
  return `${Math.floor(diff / 86400)} দিন আগে`;
}

export default function OrdersTable({
  orders,
  onStatusChange,
}: {
  orders: Order[];
  onStatusChange: (id: string, status: string) => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const change = async (id: string, status: string) => {
    setLoading(id + status);
    await onStatusChange(id, status);
    setLoading(null);
  };

  if (!orders.length) {
    return (
      <div
        className="rounded-2xl border text-center py-16"
        style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}
      >
        <div className="text-4xl mb-3">📭</div>
        <p className="font-semibold" style={{ color: "var(--c-text)" }}>কোনো অর্ডার নেই</p>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>
          Facebook Webhook সেটআপ করুন ও কমেন্ট থেকে অর্ডার আসার অপেক্ষা করুন।
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "var(--c-bg)" }}>
              {["কাস্টমার", "কমেন্ট", "পেজ", "স্ট্যাটাস", "সময়", "একশন"].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide"
                  style={{ color: "var(--c-text-muted)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order, i) => {
              const s = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
              return (
                <tr
                  key={order.id}
                  style={{
                    borderTop: i > 0 ? `1px solid var(--c-border)` : "none",
                  }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--c-text)" }}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: "#1877F2" }}
                      >
                        {order.commenterName[0]?.toUpperCase()}
                      </div>
                      <span className="truncate max-w-[120px]">{order.commenterName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]" style={{ color: "var(--c-text-sub)" }}>
                    <span title={order.commentText} className="line-clamp-2 block leading-snug">
                      {order.commentText.length > 60 ? order.commentText.slice(0, 60) + "…" : order.commentText}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--c-text-sub)" }}>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "#EEF3FD", color: "#1877F2" }}>
                      {order.pageName ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: s.bg, color: s.color }}
                    >
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--c-text-muted)" }}>
                    <Clock size={12} className="inline mr-1 opacity-60" />
                    {relativeTime(order.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {order.status === "pending" && (
                        <button
                          onClick={() => change(order.id, "confirmed")}
                          disabled={loading === order.id + "confirmed"}
                          title="কনফার্ম করুন"
                          className="p-1.5 rounded-lg transition-colors hover:bg-blue-50"
                          style={{ color: "#2B7CE9" }}
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {order.status === "confirmed" && (
                        <button
                          onClick={() => change(order.id, "delivered")}
                          disabled={loading === order.id + "delivered"}
                          title="ডেলিভারি হয়েছে"
                          className="p-1.5 rounded-lg transition-colors hover:bg-green-50"
                          style={{ color: "#0F6E56" }}
                        >
                          <PackageCheck size={16} />
                        </button>
                      )}
                      {(order.status === "pending" || order.status === "confirmed") && (
                        <button
                          onClick={() => change(order.id, "cancelled")}
                          disabled={loading === order.id + "cancelled"}
                          title="বাতিল করুন"
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                          style={{ color: "#E24B4A" }}
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
