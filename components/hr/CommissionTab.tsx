"use client";

import { Loader2, Scissors, DollarSign } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import type { CommissionEntry } from "@/lib/hr/types";
import { MONTH_NAMES } from "@/lib/hr/types";

interface Props {
  month: number;
  year: number;
  onMonthChange: (m: number) => void;
  commissionData: CommissionEntry[];
  commissionLoading: boolean;
  payingStaffId: string | null;
  onMarkPaid: (staffId: string) => void;
}

export default function CommissionTab({
  month, year, onMonthChange, commissionData, commissionLoading, payingStaffId, onMarkPaid,
}: Props) {
  return (
    <div className="space-y-4">
      <select value={month} onChange={e => onMonthChange(parseInt(e.target.value))}
        className="h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white font-medium">
        {MONTH_NAMES.map((name, idx) => <option key={idx} value={idx + 1}>{name} {year}</option>)}
      </select>

      {commissionLoading ? (
        <div className="py-16 flex justify-center"><Loader2 size={28} className="animate-spin text-gray-400" /></div>
      ) : commissionData.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-pink-50">
            <Scissors size={28} className="text-pink-500" />
          </div>
          <p className="font-bold text-gray-900">এই মাসে কোনো কমিশন নেই</p>
          <p className="text-xs text-gray-400 mt-1">সম্পন্ন অ্যাপয়েন্টমেন্ট থেকে কমিশন হিসাব হবে</p>
        </div>
      ) : (
        <div className="space-y-4">
          {commissionData.map(entry => {
            const unpaid = entry.totalCommission - entry.paidCommission;
            return (
              <div key={entry.staffId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white"
                      style={{ background: "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)" }}>
                      {entry.staffName[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{entry.staffName}</p>
                      <p className="text-xs text-gray-400">রাজস্ব: {formatBDT(entry.totalRevenue)} · কমিশন: {formatBDT(entry.totalCommission)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">বাকি</p>
                      <p className="font-black text-sm" style={{ color: unpaid > 0 ? "#EF4444" : "#10B981" }}>{formatBDT(unpaid)}</p>
                    </div>
                    {unpaid > 0 && (
                      <button onClick={() => onMarkPaid(entry.staffId)} disabled={payingStaffId === entry.staffId}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-60 bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {payingStaffId === entry.staffId ? <Loader2 size={12} className="animate-spin" /> : <DollarSign size={12} />}
                        দিয়েছি
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[450px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {["সার্ভিস", "রাজস্ব", "কমিশন", "অবস্থা"].map(h => (
                          <th key={h} className="px-5 py-2.5 text-left text-xs font-bold text-gray-400 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {entry.services.map((svc, i) => (
                        <tr key={i} className="hover:bg-gray-50" style={{ borderBottom: i < entry.services.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                          <td className="px-5 py-3">
                            <div className="text-sm font-medium text-gray-900">{svc.serviceName}</div>
                            <div className="text-[11px] text-gray-400">{new Date(svc.date).toLocaleDateString("bn-BD")}</div>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-700">{formatBDT(svc.revenue)}</td>
                          <td className="px-5 py-3 text-sm font-bold text-pink-600">{formatBDT(svc.commission)}</td>
                          <td className="px-5 py-3">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ backgroundColor: svc.paid ? "#ECFDF5" : "#FEF2F2", color: svc.paid ? "#10B981" : "#EF4444" }}>
                              {svc.paid ? "পরিশোধিত" : "বাকি"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
