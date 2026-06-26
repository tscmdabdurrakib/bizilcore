"use client";

import { daysUntil } from "@/lib/purchase-orders/utils";

export default function ExpectedChip({ date, status }: { date: string | null; status: string }) {
  if (!date || status === "received" || status === "cancelled") return null;
  const diff = daysUntil(date);
  if (diff < 0) {
    return (
      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
        {Math.abs(diff)} দিন বিলম্ব
      </span>
    );
  }
  if (diff === 0) {
    return (
      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
        আজ পাওয়ার কথা
      </span>
    );
  }
  if (diff <= 3) {
    return (
      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
        {diff} দিনে আসবে
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
      {diff} দিনে আসবে
    </span>
  );
}
