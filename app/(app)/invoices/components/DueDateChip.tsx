"use client";

import { isPastDue, daysUntilDue } from "@/lib/invoices/utils";

export function DueDateChip({ dueDate, status }: { dueDate: string | null; status: string }) {
  if (!dueDate || status === "paid" || status === "cancelled") return null;
  const diff = daysUntilDue(dueDate);
  if (diff < 0) {
    return (
      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
        {Math.abs(diff)} দিন অতিক্রান্ত
      </span>
    );
  }
  if (diff === 0) {
    return (
      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
        আজ ডেডলাইন
      </span>
    );
  }
  if (diff <= 7) {
    return (
      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
        {diff} দিন বাকি
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
      {diff} দিন বাকি
    </span>
  );
}

export { isPastDue };
