export const PO_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  draft:              { label: "খসড়া",              color: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF" },
  sent:               { label: "পাঠানো হয়েছে",      color: "#2563EB", bg: "#EFF6FF", dot: "#3B82F6" },
  partially_received: { label: "আংশিক পাওয়া গেছে", color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B" },
  received:           { label: "পণ্য পাওয়া গেছে",  color: "#059669", bg: "#ECFDF5", dot: "#10B981" },
  cancelled:          { label: "বাতিল",              color: "#EF4444", bg: "#FEF2F2", dot: "#F87171" },
};

export interface POSupplier {
  id: string;
  name: string;
  phone?: string | null;
}

export interface POItem {
  id: string;
  name: string;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  subtotal: number;
  productId?: string | null;
  product?: { id: string; name: string } | null;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  total: number;
  notes: string | null;
  expectedDate: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  supplier: POSupplier | null;
  items: POItem[];
  purchase?: { id: string; totalAmount: number; dueAmount: number } | null;
}

export interface POStats {
  totalCount: number;
  draftCount: number;
  sentCount: number;
  partiallyReceivedCount: number;
  receivedCount: number;
  cancelledCount: number;
  totalReceivedValue: number;
  totalPendingValue: number;
  overdueCount: number;
}

export interface POFormItem {
  name: string;
  productId?: string;
  quantity: number;
  unitPrice: number;
}
