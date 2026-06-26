"use client";

import { formatBDT } from "@/lib/utils";

interface Row {
  id: string;
  invoiceNumber: string;
  customer?: { name: string };
  createdAt: string;
  dueDate: string | null;
  total: number;
  paidAmount: number;
  balance: number;
  status: string;
  daysOverdue: number;
}

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-50 text-blue-700",
  partial: "bg-yellow-50 text-yellow-700",
  paid: "bg-emerald-50 text-emerald-700",
  overdue: "bg-red-50 text-red-700",
};

interface Props {
  invoices: Row[];
  onRecordPayment: (inv: Row) => void;
  aging?: { buckets: Record<string, number>; byCustomer: Array<{ name: string; buckets: Record<string, number> }> };
}

export default function ARAgingTable({ invoices, onRecordPayment, aging }: Props) {
  return (
    <div className="space-y-5">
      {aging && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { key: "current", label: "0-30 days" },
            { key: "31-60", label: "31-60 days" },
            { key: "61-90", label: "61-90 days" },
            { key: "90+", label: "90+ days" },
          ].map(({ key, label }) => (
            <div key={key} className="bg-white rounded-2xl border p-4">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xl font-black">{formatBDT(aging.buckets[key] ?? 0)}</p>
            </div>
          ))}
        </div>
      )}
      <div className="bg-white rounded-2xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
              <th className="px-4 py-3 text-left">Invoice #</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Overdue</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="px-4 py-3 font-mono">{inv.invoiceNumber}</td>
                <td className="px-4 py-3">{inv.customer?.name ?? "—"}</td>
                <td className="px-4 py-3 text-right">{formatBDT(inv.total)}</td>
                <td className="px-4 py-3 text-right font-bold">{formatBDT(inv.balance)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_STYLE[inv.status] ?? "bg-gray-100"}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3">{inv.daysOverdue > 0 ? `${inv.daysOverdue}d` : "—"}</td>
                <td className="px-4 py-3">
                  {inv.balance > 0 && (
                    <button
                      onClick={() => onRecordPayment(inv)}
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      Record Payment
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
