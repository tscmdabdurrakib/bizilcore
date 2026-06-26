export const PLAN_COLOR: Record<string, { bg: string; text: string }> = {
  free: { bg: "#F3F4F6", text: "#6B7280" },
  pro: { bg: "#ECFDF5", text: "#059669" },
  business: { bg: "#FFF3DC", text: "#D97706" },
};

export const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "#D97706", bg: "#FEF3C7" },
  approved: { label: "Approved", color: "#059669", bg: "#ECFDF5" },
  rejected: { label: "Rejected", color: "#DC2626", bg: "#FEF2F2" },
};

export const METHOD_LABEL: Record<string, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  bank: "Bank",
};

export const SHOP_STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#059669", bg: "#ECFDF5" },
  suspended: { label: "Suspended", color: "#DC2626", bg: "#FEF2F2" },
  trial: { label: "Trial", color: "#D97706", bg: "#FEF3C7" },
};

export interface Payment {
  id: string;
  plan: string;
  months: number;
  amount: number;
  method: string;
  transactionId: string | null;
  senderPhone: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    subscription: { plan: string; status: string; endDate: string | null } | null;
  };
}

export interface PricingConfig {
  id: string;
  planKey: string;
  monthlyPrice: number;
  yearlyPrice: number;
  discountEnabled: boolean;
  discountPercent: number;
  discountLabel: string;
}

export interface NewsletterSub {
  id: string;
  email: string;
  status: string;
  subscribedAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalShops: number;
  totalOrders: number;
  totalRevenue: number;
  planCounts: { plan: string; _count: { _all: number } }[];
  recentShops: ShopRow[];
  pendingPaymentsCount?: number;
  signupsToday?: number;
  signupsThisWeek?: number;
  userTrendWeek?: number;
  recentUsers?: RecentUser[];
  topShopsByOrders?: TopShop[];
  activeShops?: number;
  inactiveShops?: number;
  lastCronRun?: string | null;
}

export interface ShopRow {
  id: string;
  name: string;
  shopStatus?: string;
  storeEnabled?: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    subscription: { plan: string; status: string; endDate: string | null } | null;
  };
  _count: { products: number; customers: number; staffMembers: number; orders?: number };
}

export interface RecentUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  subscription: { plan: string } | null;
}

export interface TopShop {
  id: string;
  name: string;
  orderCount: number;
}
