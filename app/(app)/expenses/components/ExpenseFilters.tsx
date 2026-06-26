"use client";

import {
  Search, CalendarRange, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, Upload, Trash2,
} from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/expenses/categories";
import type { ExpenseSort, ExpenseViewMode } from "@/lib/expenses/types";

export default function ExpenseFilters({
  search, onSearchChange,
  filterCat, onFilterCatChange,
  paymentMethod, onPaymentMethodChange,
  fromDate, toDate, onFromDateChange, onToDateChange,
  showDateFilter, onToggleDateFilter,
  viewMode, onViewModeChange,
  refDate, onRefDateChange,
  sort, onSortChange,
  page, pages, total, onPageChange,
  selectedCount, onBulkDelete, onImportClick,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  filterCat: string;
  onFilterCatChange: (v: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (v: string) => void;
  fromDate: string;
  toDate: string;
  onFromDateChange: (v: string) => void;
  onToDateChange: (v: string) => void;
  showDateFilter: boolean;
  onToggleDateFilter: () => void;
  viewMode: ExpenseViewMode;
  onViewModeChange: (v: ExpenseViewMode) => void;
  refDate: string;
  onRefDateChange: (v: string) => void;
  sort: ExpenseSort;
  onSortChange: (v: ExpenseSort) => void;
  page: number;
  pages: number;
  total: number;
  onPageChange: (p: number) => void;
  selectedCount: number;
  onBulkDelete: () => void;
  onImportClick: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50 flex-wrap">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
          {(["daily", "weekly", "monthly"] as ExpenseViewMode[]).map(m => (
            <button
              key={m}
              onClick={() => onViewModeChange(m)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{
                backgroundColor: viewMode === m ? "#fff" : "transparent",
                color: viewMode === m ? "#111827" : "#6B7280",
                boxShadow: viewMode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {m === "daily" ? "দৈনিক" : m === "weekly" ? "সাপ্তাহিক" : "মাসিক"}
            </button>
          ))}
        </div>
        {!fromDate && !toDate && (
          <DatePicker
            value={refDate}
            onChange={onRefDateChange}
            className="h-9 w-36 border border-gray-200 rounded-xl px-3 text-sm bg-white"
          />
        )}
        <select
          value={sort}
          onChange={e => onSortChange(e.target.value as ExpenseSort)}
          className="h-9 px-3 rounded-xl border border-gray-200 text-xs bg-white"
        >
          <option value="date">তারিখ</option>
          <option value="amount">পরিমাণ (বেশি)</option>
          <option value="title">শিরোনাম</option>
        </select>
        <select
          value={paymentMethod}
          onChange={e => onPaymentMethodChange(e.target.value)}
          className="h-9 px-3 rounded-xl border border-gray-200 text-xs bg-white"
        >
          <option value="">সব পেমেন্ট</option>
          {PAYMENT_METHODS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <button
          onClick={onImportClick}
          className="flex items-center gap-1 px-3 h-9 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          <Upload size={13} /> CSV Import
        </button>
        {selectedCount > 0 && (
          <button
            onClick={onBulkDelete}
            className="flex items-center gap-1 px-3 h-9 rounded-xl bg-red-50 text-xs font-bold text-red-600 hover:bg-red-100"
          >
            <Trash2 size={13} /> {selectedCount}টি মুছুন
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="খরচ খুঁজুন..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-800 outline-none focus:border-gray-400 transition-colors"
          />
        </div>
        <button
          onClick={onToggleDateFilter}
          className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl border text-xs font-semibold transition-all flex-shrink-0"
          style={{
            borderColor: (fromDate || toDate) ? "#EF4444" : "#E5E7EB",
            color: (fromDate || toDate) ? "#DC2626" : "#6B7280",
            backgroundColor: (fromDate || toDate) ? "#FEF2F2" : "#fff",
          }}
        >
          <CalendarRange size={14} /> তারিখ
          {showDateFilter ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {(fromDate || toDate) && (
          <button
            onClick={() => { onFromDateChange(""); onToDateChange(""); }}
            className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
          >
            সরিয়ে দিন
          </button>
        )}
      </div>

      {showDateFilter && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 bg-gray-50">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-semibold text-gray-500 flex-shrink-0">থেকে:</span>
            <DatePicker value={fromDate} onChange={onFromDateChange}
              className="flex-1 h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white outline-none focus:border-gray-400" />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-semibold text-gray-500 flex-shrink-0">পর্যন্ত:</span>
            <DatePicker value={toDate} onChange={onToDateChange}
              className="flex-1 h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white outline-none focus:border-gray-400" />
          </div>
        </div>
      )}

      <div className="flex gap-1 px-4 py-3 overflow-x-auto border-b border-gray-50">
        <button
          onClick={() => onFilterCatChange("")}
          className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0"
          style={{ backgroundColor: filterCat === "" ? "#EF4444" : "#F3F4F6", color: filterCat === "" ? "#fff" : "#6B7280" }}
        >
          সব
        </button>
        {EXPENSE_CATEGORIES.map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.value}
              onClick={() => onFilterCatChange(cat.value === filterCat ? "" : cat.value)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0"
              style={{
                backgroundColor: filterCat === cat.value ? cat.color : "#F3F4F6",
                color: filterCat === cat.value ? "#fff" : "#6B7280",
              }}
            >
              <Icon size={11} /> {cat.label}
            </button>
          );
        })}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-50 text-xs text-gray-500">
          <span>{total}টি খরচ</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30">
              <ChevronLeft size={14} />
            </button>
            <span className="font-semibold">{page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => onPageChange(page + 1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
