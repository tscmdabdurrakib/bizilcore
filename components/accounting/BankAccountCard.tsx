"use client";

import { formatBDT } from "@/lib/utils";
import type { BankAccountSummary } from "@/types/accounting";

const TYPE_BADGE: Record<string, string> = {
  cash: "bg-emerald-50 text-emerald-700",
  bank: "bg-blue-50 text-blue-700",
  mobile_banking: "bg-pink-50 text-pink-700",
};

interface Props {
  account: BankAccountSummary;
  onDeposit: () => void;
  onWithdraw: () => void;
  onViewTransactions: () => void;
}

export default function BankAccountCard({
  account,
  onDeposit,
  onWithdraw,
  onViewTransactions,
}: Props) {
  const badge =
    account.mobileBankingType?.toUpperCase() ??
    (account.accountType === "cash" ? "Cash" : account.accountType === "bank" ? "Bank" : "Mobile");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-bold text-gray-900">{account.name}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_BADGE[account.accountType] ?? "bg-gray-100"}`}>
            {badge}
          </span>
        </div>
        {!account.isActive && (
          <span className="text-xs text-gray-400">Inactive</span>
        )}
      </div>
      <p className="text-2xl font-black text-emerald-700">{formatBDT(account.currentBalance)}</p>
      <p className="text-xs text-gray-400 mt-1">
        {account.lastTransactionDate
          ? `Last: ${account.lastTransactionDate.split("T")[0]}`
          : "No transactions yet"}
      </p>
      <div className="flex gap-2 mt-4">
        <button onClick={onDeposit} className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700">
          Deposit
        </button>
        <button onClick={onWithdraw} className="flex-1 py-2 text-xs font-bold rounded-xl bg-red-50 text-red-600">
          Withdraw
        </button>
      </div>
      <button
        onClick={onViewTransactions}
        className="w-full mt-2 py-2 text-xs font-bold rounded-xl border"
      >
        View Transactions
      </button>
    </div>
  );
}
