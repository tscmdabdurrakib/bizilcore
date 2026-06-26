"use client";

import { formatBDT } from "@/lib/utils";

interface Tx {
  id: string;
  transactionDate: string;
  transactionType: string;
  amount: number;
  description: string;
  referenceNumber: string | null;
  isReconciled: boolean;
}

interface Props {
  transactions: Tx[];
  onToggleReconciled: (id: string, value: boolean) => void;
}

export default function TransactionList({ transactions, onToggleReconciled }: Props) {
  return (
    <div className="bg-white rounded-2xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3 text-left">Description</th>
            <th className="px-4 py-3 text-center">Reconciled</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {transactions.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50/50">
              <td className="px-4 py-3">{t.transactionDate.split("T")[0]}</td>
              <td className="px-4 py-3 capitalize">{t.transactionType}</td>
              <td className="px-4 py-3 text-right font-bold">{formatBDT(t.amount)}</td>
              <td className="px-4 py-3 text-gray-600">{t.description}</td>
              <td className="px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={t.isReconciled}
                  onChange={(e) => onToggleReconciled(t.id, e.target.checked)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {transactions.length === 0 && (
        <p className="text-center py-10 text-gray-400 text-sm">No transactions</p>
      )}
    </div>
  );
}
