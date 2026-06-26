export interface Branch {
  id: string;
  name: string;
  category: string | null;
  phone: string | null;
  address: string | null;
  logoUrl?: string | null;
  note: string | null;
  isActive?: boolean;
  linkedShopId?: string | null;
  createdAt: string;
  productCount?: number;
  totalStockQty?: number;
  lowStockCount?: number;
}

export interface MainShop {
  id: string;
  name: string;
  category: string | null;
  phone: string | null;
  address: string | null;
  logoUrl?: string | null;
  productCount?: number;
  customerCount?: number;
}

export interface ShopData {
  mainShop: MainShop;
  branches: Branch[];
  maxShops: number;
  totalShops: number;
  transferCount: number;
  productCount: number;
  customerCount: number;
  childShops?: AccessibleShop[];
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  stockQty: number;
  sellPrice?: number;
}

export interface TransferRecord {
  id: string;
  productId: string;
  productName: string;
  productSku: string | null;
  quantity: number;
  branchName: string;
  branchId?: string | null;
  note: string | null;
  direction?: string | null;
  createdAt: string;
}

export interface BranchStockRow {
  id: string;
  productId: string;
  productName: string;
  sku: string | null;
  quantity: number;
  sellPrice: number;
  lowStockAt: number;
  lastTransferAt: string | null;
}

export interface TransferLineItem {
  productId: string;
  quantity: number;
}

export interface AccessibleShop {
  id: string;
  name: string;
  logoUrl: string | null;
  isPrimary: boolean;
  isBranch: boolean;
  parentShopId: string | null;
  role: string;
}

export type ToastType = "success" | "error";
export type ShopsTab = "shops" | "log" | "analytics" | "advanced";

export const SHOP_CATEGORIES = [
  "পোশাক", "জুয়েলারি", "খাবার", "সৌন্দর্য", "গৃহস্থালি", "ইলেকট্রনিক্স", "অন্যান্য",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  পোশাক: "#F59E0B",
  জুয়েলারি: "#EC4899",
  খাবার: "#EF4444",
  সৌন্দর্য: "#8B5CF6",
  গৃহস্থালি: "#10B981",
  ইলেকট্রনিক্স: "#3B82F6",
  অন্যান্য: "#6B7280",
};

export function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 86400) return `${Math.floor(d / 3600) || 1} ঘণ্টা আগে`;
  if (d < 86400 * 30) return `${Math.floor(d / 86400)} দিন আগে`;
  return new Date(iso).toLocaleDateString("bn-BD", { day: "numeric", month: "short" });
}
