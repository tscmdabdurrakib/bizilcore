export interface Expense {
  id: string;
  title: string | null;
  amount: number;
  category: string | null;
  date: string;
  notes: string | null;
  paymentMethod: string | null;
  receiptUrl: string | null;
  supplierId: string | null;
  supplier?: { id: string; name: string } | null;
  taxRate: number;
  taxAmount: number;
  isRecurring: boolean;
  recurringInterval: string | null;
  nextDueDate: string | null;
}

export interface ExpenseStats {
  thisMonthTotal: number;
  lastMonthTotal: number;
  monthChangePct: number | null;
  filteredTotal: number;
  filteredCount: number;
  topCategory: string | null;
  topCategoryAmount: number;
  monthIncome: number;
  monthProfit: number;
  monthlyTrend: { month: string; total: number }[];
  categoryBreakdown: { category: string; total: number }[];
  budgetAlerts: { category: string; spent: number; budget: number; pct: number }[];
}

export type ExpenseViewMode = "daily" | "weekly" | "monthly";

export type ExpenseSort = "date" | "amount" | "title";
