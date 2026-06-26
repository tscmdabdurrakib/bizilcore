"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { formatBDT } from "@/lib/utils";
import { MONTH_NAMES } from "@/lib/hr/types";

interface SlipData {
  staff: { user: { name: string }; jobTitle: string | null };
  baseSalary: number;
  bonus: number;
  deductions: number;
  advance: number;
  netPay: number;
  paidAmount: number;
  notes: string | null;
}

export default function SalarySlipClient() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const month = parseInt(searchParams.get("month") ?? "1");
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
  const [item, setItem] = useState<SlipData | null>(null);
  const [shopName, setShopName] = useState("");

  useEffect(() => {
    fetch(`/api/hr/payroll?month=${month}&year=${year}`)
      .then(r => r.json())
      .then(d => {
        const found = d.payroll?.items?.find((i: { id: string }) => i.id === id);
        if (found) setItem(found);
      });
    fetch("/api/settings").then(r => r.json()).then(d => setShopName(d.shop?.name ?? "BizilCore"));
  }, [id, month, year]);

  if (!item) {
    return <div className="p-12 text-center text-gray-400">লোড হচ্ছে...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-6 print:p-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 print:border-0 print:shadow-none">
        <div className="text-center mb-6 border-b border-gray-100 pb-4">
          <h1 className="text-lg font-black text-gray-900">{shopName}</h1>
          <p className="text-sm text-gray-500">বেতন স্লিপ — {MONTH_NAMES[month - 1]} {year}</p>
        </div>
        <div className="mb-4">
          <p className="font-bold text-gray-900">{item.staff.user.name}</p>
          {item.staff.jobTitle && <p className="text-xs text-gray-400">{item.staff.jobTitle}</p>}
        </div>
        <table className="w-full text-sm mb-4">
          <tbody>
            {[
              ["মূল বেতন", formatBDT(item.baseSalary)],
              ["বোনাস", formatBDT(item.bonus)],
              ["কাটা", `- ${formatBDT(item.deductions)}`],
              ["অ্যাডভান্স", `- ${formatBDT(item.advance)}`],
            ].map(([label, val]) => (
              <tr key={label as string} className="border-b border-gray-50">
                <td className="py-2 text-gray-500">{label}</td>
                <td className="py-2 text-right font-semibold text-gray-900">{val}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-200">
              <td className="py-3 font-bold text-gray-900">নেট বেতন</td>
              <td className="py-3 text-right font-black text-emerald-700">{formatBDT(item.netPay)}</td>
            </tr>
            <tr>
              <td className="py-1 text-gray-500">পরিশোধিত</td>
              <td className="py-1 text-right text-emerald-600">{formatBDT(item.paidAmount)}</td>
            </tr>
            <tr>
              <td className="py-1 text-gray-500">বাকি</td>
              <td className="py-1 text-right text-red-500">{formatBDT(item.netPay - item.paidAmount)}</td>
            </tr>
          </tbody>
        </table>
        {item.notes && <p className="text-xs text-gray-400 mb-4">নোট: {item.notes}</p>}
        <button onClick={() => window.print()}
          className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold print:hidden">
          প্রিন্ট করুন
        </button>
      </div>
    </div>
  );
}
