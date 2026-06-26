"use client";

import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";
import { INVOICE_STATUS_CONFIG } from "@/lib/invoices/types";

export default function InvoiceFilters({
  search,
  onSearchChange,
  filterStatus,
  onStatusChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  sort,
  onSortChange,
  page,
  pages,
  total,
  onPageChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  filterStatus: string;
  onStatusChange: (v: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  sort: string;
  onSortChange: (v: string) => void;
  page: number;
  pages: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  const tabs = [
    { value: "", label: "সব" },
    ...Object.entries(INVOICE_STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label })),
  ];

  return (
    <div className="border-b border-gray-50">
      <div className="flex items-center gap-3 px-5 py-4 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ইনভয়েস নং বা কাস্টমার..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200 text-sm bg-gray-50 outline-none focus:border-gray-400"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white"
        >
          <option value="createdAt">নতুন আগে</option>
          <option value="total">পরিমাণ (বেশি)</option>
          <option value="dueDate">ডেডলাইন</option>
        </select>
      </div>

      <div className="flex items-center gap-2 px-5 pb-3 flex-wrap">
        <Filter size={14} className="text-gray-400" />
        <DatePicker
          value={dateFrom}
          onChange={onDateFromChange}
          placeholder="শুরু"
          className="h-9 w-36 border border-gray-200 rounded-xl px-3 text-sm"
        />
        <span className="text-gray-400 text-xs">—</span>
        <DatePicker
          value={dateTo}
          onChange={onDateToChange}
          placeholder="শেষ"
          className="h-9 w-36 border border-gray-200 rounded-xl px-3 text-sm"
        />
      </div>

      <div className="flex gap-1 px-5 pb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onStatusChange(tab.value)}
            className="px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
            style={{
              backgroundColor: filterStatus === tab.value ? "#0F6E56" : "#F3F4F6",
              color: filterStatus === tab.value ? "#fff" : "#6B7280",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between px-5 pb-4">
          <span className="text-xs text-gray-500">{total}টি ইনভয়েস</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold text-gray-600">
              {page} / {pages}
            </span>
            <button
              disabled={page >= pages}
              onClick={() => onPageChange(page + 1)}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
