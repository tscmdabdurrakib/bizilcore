"use client";

import { formatBDT } from "@/lib/utils";

interface Bill {
  id: string;
  billNumber: string;
  supplierName: string;
  billDate: string;
  dueDate: string | null;
  totalAmount: number;
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
  bills: Bill[];
  onRecordPayment: (bill: Bill) => void;
}

export default function APAgingTable({ bills, onRecordPayment }: Props) {
  return (
    <div className="bg-white rounded-2xl border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
            <th className="px-4 py-3 text-left">Bill #</th>
            <th className="px-4 py-3 text-left">Supplier</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3 text-right">Balance</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {bills.map((b) => (
            <tr key={b.id}>
              <td className="px-4 py-3 font-mono">{b.billNumber}</td>
              <td className="px-4 py-3">{b.supplierName}</td>
              <td className="px-4 py-3 text-right">{formatBDT(b.totalAmount)}</td>
              <td className="px-4 py-3 text-right font-bold">{formatBDT(b.balance)}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_STYLE[b.status] ?? "bg-gray-100"}`}>
                  {b.status}
                </span>
              </td>
              <td className="px-4 py-3">
                {b.balance > 0 && (
                  <button
                    onClick={() => onRecordPayment(b)}
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
      {bills.length === 0 && (
        <p className="text-center py-10 text-gray-400 text-sm">No supplier bills</p>
      )}
    </div>
  );
}
