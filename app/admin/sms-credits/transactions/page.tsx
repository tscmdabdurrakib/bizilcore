"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X, Loader2 } from "lucide-react";

const S = { primary: "#0F6E56", surface: "#FFFFFF", border: "#E8E6DF", text: "#1A1A18", textMuted: "#A8A69E" };

interface Tx {
  id: string;
  transactionType: string;
  smsType: string;
  creditsAmount: number;
  amountBdt: number | null;
  paymentMethod: string | null;
  paymentStatus: string;
  paymentReference: string | null;
  createdAt: string;
  user: { name: string; email: string };
}

export default function SmsTransactionsPage() {
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const q = statusFilter ? `?status=${statusFilter}` : "";
    const r = await fetch(`/api/admin/sms/transactions${q}`);
    const d = await r.json();
    setTransactions(d.transactions ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [statusFilter]);

  async function handleAction(id: string, action: "confirm" | "reject") {
    setActing(id);
    await fetch(`/api/admin/sms/transactions/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setActing(null);
    load();
  }

  function exportCsv() {
    const headers = ["Tenant", "Email", "Type", "SMS Type", "Credits", "Amount", "Method", "Status", "Reference", "Date"];
    const rows = transactions.map((t) => [
      t.user.name, t.user.email, t.transactionType, t.smsType ?? "non_masking", t.creditsAmount,
      t.amountBdt ?? "", t.paymentMethod ?? "", t.paymentStatus,
      t.paymentReference ?? "", new Date(t.createdAt).toISOString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sms-transactions.csv";
    a.click();
  }

  return (
    <div>
      <Link href="/admin/sms-credits" className="flex items-center gap-1 text-sm mb-4" style={{ color: S.textMuted }}>
        <ArrowLeft size={14} /> SMS Credits
      </Link>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-xl font-bold" style={{ color: S.text }}>All Transactions</h1>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border text-sm" style={{ borderColor: S.border }}>
            <option value="">All status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <button onClick={exportCsv} className="px-4 py-2 rounded-xl border text-sm font-bold" style={{ borderColor: S.border }}>
            Export CSV
          </button>
        </div>
      </div>

      {loading ? <p>লোড হচ্ছে...</p> : (
        <div className="rounded-2xl border overflow-x-auto" style={{ background: S.surface, borderColor: S.border }}>
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr style={{ background: "#F7F6F2", color: S.textMuted }}>
                <th className="text-left px-4 py-3">Tenant</th>
                <th className="text-left px-4 py-3">SMS Type</th>
                <th className="text-left px-4 py-3">পরিমাণ</th>
                <th className="text-left px-4 py-3">ক্রেডিট</th>
                <th className="text-left px-4 py-3">পদ্ধতি</th>
                <th className="text-left px-4 py-3">স্ট্যাটাস</th>
                <th className="text-left px-4 py-3">তারিখ</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} style={{ borderTop: `1px solid ${S.border}` }}>
                  <td className="px-4 py-3">
                    <p className="font-bold">{t.user.name}</p>
                    <p style={{ color: S.textMuted }}>{t.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        background: t.smsType === "masking" ? "#EDE9FE" : "#E0E7FF",
                        color: t.smsType === "masking" ? "#6D28D9" : "#3730A3",
                      }}>
                      {t.smsType === "masking" ? "Masking" : "Non-Masking"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{t.amountBdt ? `৳${t.amountBdt}` : "—"}</td>
                  <td className="px-4 py-3 font-bold">{t.creditsAmount >= 0 ? "+" : ""}{t.creditsAmount}</td>
                  <td className="px-4 py-3">{t.paymentMethod ?? "—"}</td>
                  <td className="px-4 py-3">{t.paymentStatus}</td>
                  <td className="px-4 py-3">{new Date(t.createdAt).toLocaleDateString("bn-BD")}</td>
                  <td className="px-4 py-3">
                    {t.transactionType === "purchase" && t.paymentStatus === "pending" && (
                      <div className="flex gap-1">
                        <button disabled={acting === t.id} onClick={() => handleAction(t.id, "confirm")}
                          className="p-1 rounded" style={{ background: "#DCFCE7" }}>
                          {acting === t.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} color="#16A34A" />}
                        </button>
                        <button disabled={acting === t.id} onClick={() => handleAction(t.id, "reject")}
                          className="p-1 rounded" style={{ background: "#FEE2E2" }}>
                          <X size={12} color="#DC2626" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
