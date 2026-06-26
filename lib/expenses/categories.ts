import {
  Building, Users, Zap, Megaphone, Truck, Package, Wrench, Tag,
  type LucideIcon,
} from "lucide-react";

export interface ExpenseCategory {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { value: "office_rent", label: "অফিস ভাড়া", icon: Building, color: "#6366F1", bg: "#EEF2FF" },
  { value: "salary", label: "কর্মী বেতন", icon: Users, color: "#EC4899", bg: "#FDF2F8" },
  { value: "utility", label: "ইউটিলিটি বিল", icon: Zap, color: "#F59E0B", bg: "#FFFBEB" },
  { value: "marketing", label: "মার্কেটিং", icon: Megaphone, color: "#3B82F6", bg: "#EFF6FF" },
  { value: "transport", label: "পরিবহন", icon: Truck, color: "#14B8A6", bg: "#F0FDFA" },
  { value: "packaging", label: "প্যাকেজিং", icon: Package, color: "#8B5CF6", bg: "#F5F3FF" },
  { value: "maintenance", label: "রক্ষণাবেক্ষণ", icon: Wrench, color: "#EF4444", bg: "#FEF2F2" },
  { value: "other", label: "অন্যান্য", icon: Tag, color: "#6B7280", bg: "#F9FAFB" },
];

export const PAYMENT_METHODS = [
  { value: "cash", label: "নগদ" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "bank", label: "ব্যাংক" },
  { value: "card", label: "কার্ড" },
] as const;

export function getExpenseCategory(value: string | null | undefined): ExpenseCategory {
  return EXPENSE_CATEGORIES.find(c => c.value === value) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
}

export function getPaymentMethodLabel(value: string | null | undefined): string {
  return PAYMENT_METHODS.find(m => m.value === value)?.label ?? value ?? "—";
}
