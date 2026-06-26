"use client";

import { Pencil, Trash2, Copy, TrendingDown, Plus, ImageIcon, Repeat } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { getExpenseCategory, getPaymentMethodLabel } from "@/lib/expenses/categories";
import type { Expense } from "@/lib/expenses/types";

export default function ExpenseList({
  expenses,
  loading,
  totalAmount,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onDuplicate,
  onAdd,
}: {
  expenses: Expense[];
  loading: boolean;
  totalAmount: number;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onEdit: (exp: Expense) => void;
  onDelete: (exp: Expense) => void;
  onDuplicate: (exp: Expense) => void;
  onAdd: () => void;
}) {
  if (loading) {
    return (
      <div className="divide-y divide-gray-50">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-48" />
              <div className="h-3 bg-gray-100 rounded w-32" />
            </div>
            <div className="h-5 w-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-red-50">
          <TrendingDown size={28} className="text-red-400" />
        </div>
        <p className="font-semibold text-gray-700 text-sm mb-1">কোনো খরচ পাওয়া যায়নি</p>
        <p className="text-xs text-gray-400 mb-4">ফিল্টার পরিবর্তন করুন বা নতুন খরচ যোগ করুন</p>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold mx-auto"
          style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)" }}
        >
          <Plus size={14} /> নতুন খরচ
        </button>
      </div>
    );
  }

  const allSelected = expenses.length > 0 && expenses.every(e => selectedIds.has(e.id));

  return (
    <>
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3.5 w-10">
                <input type="checkbox" checked={allSelected} onChange={onSelectAll} className="rounded" />
              </th>
              {["তারিখ", "শিরোনাম", "ক্যাটাগরি", "পেমেন্ট", "পরিমাণ", ""].map(h => (
                <th key={h} className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {expenses.map(exp => {
              const cat = getExpenseCategory(exp.category);
              const Icon = cat.icon;
              return (
                <tr key={exp.id} className="hover:bg-red-50/20 transition-colors group">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(exp.id)}
                      onChange={() => onToggleSelect(exp.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-400 whitespace-nowrap">
                    {new Date(exp.date).toLocaleDateString("bn-BD")}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{exp.title ?? "—"}</p>
                        {exp.notes && <p className="text-xs text-gray-400 mt-0.5">{exp.notes}</p>}
                      </div>
                      {exp.isRecurring && (
                        <span title="পুনরাবৃত্ত"><Repeat size={12} className="text-purple-500" /></span>
                      )}
                      {exp.receiptUrl && (
                        <a href={exp.receiptUrl} target="_blank" rel="noopener noreferrer" title="রসিদ">
                          <ImageIcon size={12} className="text-blue-500" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold"
                      style={{ backgroundColor: cat.bg, color: cat.color }}>
                      <Icon size={11} /> {cat.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-500">{getPaymentMethodLabel(exp.paymentMethod)}</td>
                  <td className="px-4 py-4">
                    <span className="font-black text-red-600 text-base">{formatBDT(exp.amount)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button onClick={() => onDuplicate(exp)} className="p-2 rounded-lg hover:bg-gray-100" title="কপি">
                        <Copy size={13} className="text-gray-500" />
                      </button>
                      <button onClick={() => onEdit(exp)} className="p-2 rounded-lg hover:bg-gray-100">
                        <Pencil size={13} className="text-gray-500" />
                      </button>
                      <button onClick={() => onDelete(exp)} className="p-2 rounded-lg hover:bg-red-50">
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden divide-y divide-gray-50">
        {expenses.map(exp => {
          const cat = getExpenseCategory(exp.category);
          const Icon = cat.icon;
          return (
            <div key={exp.id} className="flex items-start gap-3 px-4 py-4">
              <input
                type="checkbox"
                checked={selectedIds.has(exp.id)}
                onChange={() => onToggleSelect(exp.id)}
                className="mt-3 rounded flex-shrink-0"
              />
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.bg }}>
                <Icon size={17} style={{ color: cat.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{exp.title ?? "—"}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs font-semibold" style={{ color: cat.color }}>{cat.label}</span>
                      <span className="text-xs text-gray-400">{new Date(exp.date).toLocaleDateString("bn-BD")}</span>
                      {exp.isRecurring && <Repeat size={11} className="text-purple-500" />}
                    </div>
                    {exp.notes && <p className="text-xs text-gray-400 mt-0.5">{exp.notes}</p>}
                  </div>
                  <p className="font-black text-red-600 text-base flex-shrink-0">{formatBDT(exp.amount)}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button onClick={() => onDuplicate(exp)} className="p-2 rounded-lg hover:bg-gray-100"><Copy size={13} className="text-gray-400" /></button>
                <button onClick={() => onEdit(exp)} className="p-2 rounded-lg hover:bg-gray-100"><Pencil size={13} className="text-gray-400" /></button>
                <button onClick={() => onDelete(exp)} className="p-2 rounded-lg hover:bg-red-50"><Trash2 size={13} className="text-red-400" /></button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <span className="text-sm text-gray-500">{expenses.length}টি খরচ (এই পৃষ্ঠায়)</span>
        <span className="font-black text-red-600 text-base">{formatBDT(totalAmount)}</span>
      </div>
    </>
  );
}
