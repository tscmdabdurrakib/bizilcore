"use client";

import { useEffect, useState } from "react";
import { Loader2, History } from "lucide-react";
import { useSmsCredits } from "@/hooks/useSmsCredits";

interface Transaction {
  id: string;
  transactionType: string;
  smsType: string;
  creditsAmount: number;
  amountBdt: number | null;
  paymentMethod: string | null;
  paymentStatus: string;
  paymentReference: string | null;
  createdAt: string;
  discount?: { code: string | null } | null;
}

const TYPE_LABEL: Record<string, string> = {
  purchase: "ক্রয়",
  usage: "ব্যবহার",
  refund: "রিফান্ড",
  bonus: "বোনাস",
  signup_bonus: "সাইনআপ বোনাস",
  gift: "গিফট",
  manual_adjustment: "সমন্বয়",
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "পেন্ডিং", color: "#F59E0B" },
  completed: { label: "সম্পন্ন", color: "#16A34A" },
  failed: { label: "ব্যর্থ", color: "#DC2626" },
  refunded: { label: "রিফান্ড", color: "#6B7280" },
};

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  textMuted: "var(--c-text-muted)",
  bg: "var(--c-bg)",
};

interface Props {
  refreshKey?: number;
}

export default function SmsCreditHistoryTable({ refreshKey }: Props) {
  const { maskingEnabled } = useSmsCredits();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/sms-credits/transactions")
      .then((r) => r.json())
      .then((d) => setTransactions(d.transactions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border, background: S.surface }}>
      <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${S.border}` }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--icon-blue-bg)" }}>
          <History size={16} style={{ color: "var(--icon-blue-text)" }} />
        </div>
        <div>
          <h3 className="font-bold text-sm" style={{ color: S.text }}>ক্রেডিট ব্যবহারের ইতিহাস</h3>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--c-primary)" }} />
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-12 text-center text-sm" style={{ color: S.textMuted }}>
          কোনো transaction নেই
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: S.bg, color: S.textMuted }}>
                <th className="text-left px-4 py-3 font-semibold">তারিখ</th>
                <th className="text-left px-4 py-3 font-semibold">ধরন</th>
                {maskingEnabled && (
                <th className="text-left px-4 py-3 font-semibold">SMS Type</th>
                )}
                <th className="text-left px-4 py-3 font-semibold">ক্রেডিট</th>
                <th className="text-left px-4 py-3 font-semibold">পরিমাণ</th>
                <th className="text-left px-4 py-3 font-semibold">স্ট্যাটাস</th>
                <th className="text-left px-4 py-3 font-semibold">রেফারেন্স</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const st = STATUS_LABEL[tx.paymentStatus] ?? STATUS_LABEL.pending;
                return (
                  <tr key={tx.id} style={{ borderTop: `1px solid ${S.border}` }}>
                    <td className="px-4 py-3" style={{ color: S.text }}>
                      {new Date(tx.createdAt).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="px-4 py-3">{TYPE_LABEL[tx.transactionType] ?? tx.transactionType}</td>
                    {maskingEnabled && (
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px]"
                        style={{
                          background: tx.smsType === "masking" ? "#EDE9FE" : "#E0E7FF",
                          color: tx.smsType === "masking" ? "#6D28D9" : "#3730A3",
                        }}>
                        {tx.smsType === "masking" ? "Masking" : "Non-Masking"}
                      </span>
                    </td>
                    )}
                    <td className="px-4 py-3 font-bold" style={{ color: tx.creditsAmount >= 0 ? "#16A34A" : "#DC2626" }}>
                      {tx.creditsAmount >= 0 ? "+" : ""}{tx.creditsAmount}
                    </td>
                    <td className="px-4 py-3">{tx.amountBdt ? `৳${tx.amountBdt}` : "—"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full font-bold" style={{ color: st.color, background: `${st.color}15` }}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono" style={{ color: S.textMuted }}>
                      {tx.paymentReference ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
