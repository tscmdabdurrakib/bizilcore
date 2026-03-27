export const PLAN_LIMITS = {
  free: {
    products: 50,
    ordersPerMonth: 100,
    staff: 0,
    sms: false,
    courier: false,
    export: false,
    reports: false,
    taskManagement: false,
    multiShop: false,
    affiliate: false,
    maxShops: 1,
    label: "Free",
    price: 0,
  },
  pro: {
    products: -1,
    ordersPerMonth: -1,
    staff: 3,
    sms: true,
    courier: true,
    export: true,
    reports: true,
    taskManagement: true,
    multiShop: false,
    affiliate: true,
    maxShops: 1,
    label: "Pro",
    price: 299,
  },
  business: {
    products: -1,
    ordersPerMonth: -1,
    staff: -1,
    sms: true,
    courier: true,
    export: true,
    reports: true,
    taskManagement: true,
    multiShop: true,
    affiliate: true,
    maxShops: 3,
    label: "Business",
    price: 699,
  },
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;
export type FeatureName = "sms" | "courier" | "export" | "reports" | "staff" | "taskManagement" | "multiShop" | "affiliate";

export function canAccessFeature(plan: PlanName, feature: FeatureName): boolean {
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  if (feature === "staff") return limits.staff !== 0;
  return limits[feature] as boolean;
}

export function isWithinLimit(plan: PlanName, limitKey: "products" | "ordersPerMonth" | "staff", current: number): boolean {
  const limit = (PLAN_LIMITS[plan] ?? PLAN_LIMITS.free)[limitKey];
  if (limit === -1) return true;
  return current < limit;
}

export const PLAN_DISPLAY = {
  free:     { label: "Free", color: "#A8A69E", bg: "#F7F6F2" },
  pro:      { label: "Pro",  color: "#0F6E56", bg: "#E1F5EE" },
  business: { label: "Business", color: "#7C3AED", bg: "#F0E8FF" },
};
