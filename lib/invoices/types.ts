export interface InvoiceCustomer {
  id: string;
  name: string;
  phone: string | null;
  address?: string | null;
  email?: string | null;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productId?: string | null;
  product?: { id: string; name: string } | null;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  method: string;
  note: string | null;
  paidAt: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  token: string | null;
  status: string;
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  paymentMethod: string | null;
  notes: string | null;
  dueDate: string | null;
  paidAt: string | null;
  viewedAt: string | null;
  createdAt: string;
  customer: InvoiceCustomer | null;
  items: InvoiceItem[];
  payments?: InvoicePayment[];
}

export interface InvoiceFormItem {
  description: string;
  quantity: number;
  unitPrice: number;
  productId?: string | null;
}

export interface InvoiceStats {
  totalCount: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  overdueCount: number;
}

export const INVOICE_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  draft:     { label: "খসড়া",      color: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF" },
  sent:      { label: "পাঠানো",     color: "#2563EB", bg: "#EFF6FF", dot: "#3B82F6" },
  partial:   { label: "আংশিক",      color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B" },
  paid:      { label: "পরিশোধিত",   color: "#059669", bg: "#ECFDF5", dot: "#10B981" },
  overdue:   { label: "বকেয়া",     color: "#DC2626", bg: "#FEF2F2", dot: "#EF4444" },
  cancelled: { label: "বাতিল",      color: "#9CA3AF", bg: "#F3F4F6", dot: "#6B7280" },
};

export const PAYMENT_METHODS = [
  { value: "cash", label: "নগদ" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "bank", label: "ব্যাংক" },
  { value: "card", label: "কার্ড" },
  { value: "other", label: "অন্যান্য" },
] as const;
