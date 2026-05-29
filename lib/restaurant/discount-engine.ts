export interface EngineCartItem {
  menuItemId: string;
  name: string;
  category: string;
  unitPrice: number;
  quantity: number;
}

export interface EngineCoupon {
  id: string;
  code: string;
  name?: string | null;
  type: string;
  value: number;
  minOrder?: number | null;
  maxDiscount?: number | null;
  maxUse?: number | null;
  usedCount: number;
  expiresAt?: Date | string | null;
  isActive: boolean;
  applicableItemIds?: string[] | null;
  applicableCategories?: string[] | null;
  happyHourStart?: string | null;
  happyHourEnd?: string | null;
  happyHourDays?: number[] | null;
  memberTier?: string | null;
  bogoGetItemId?: string | null;
  bogoGetQty?: number;
  bogoGetDiscount?: number;
  // combo: all items in applicableItemIds must be present → percent/fixed discount
}

export interface DiscountResult {
  type: "coupon" | "happyhour" | "member" | "bogo" | "manual" | "combo";
  label: string;
  amount: number;
  couponId?: string;
  couponCode?: string;
}

export interface BogoSuggestion {
  couponId: string;
  couponCode: string;
  triggerItemId: string;
  triggerItemName: string;
  getItemId: string | null;
  getItemName: string | null;
  getQty: number;
  getDiscountPct: number;
  discountAmount: number;
}

export interface EngineResult {
  discounts: DiscountResult[];
  totalDiscount: number;
  bogoSuggestions: BogoSuggestion[];
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function isHappyHour(coupon: EngineCoupon, now: Date): boolean {
  if (!coupon.happyHourStart || !coupon.happyHourEnd) return false;
  const days = (coupon.happyHourDays ?? [0, 1, 2, 3, 4, 5, 6]) as number[];
  const dayOfWeek = now.getDay();
  if (!days.includes(dayOfWeek)) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = timeToMinutes(coupon.happyHourStart);
  const end = timeToMinutes(coupon.happyHourEnd);
  return cur >= start && cur < end;
}

function isCouponExpired(coupon: EngineCoupon): boolean {
  if (!coupon.expiresAt) return false;
  return new Date(coupon.expiresAt) < new Date();
}

function isCouponExhausted(coupon: EngineCoupon): boolean {
  if (!coupon.maxUse) return false;
  return coupon.usedCount >= coupon.maxUse;
}

function itemsInScope(
  items: EngineCartItem[],
  applicableItemIds: string[] | null | undefined,
  applicableCategories: string[] | null | undefined
): EngineCartItem[] {
  const itemIds = applicableItemIds ?? [];
  const cats = applicableCategories ?? [];
  if (itemIds.length === 0 && cats.length === 0) return items;
  return items.filter(i =>
    (itemIds.length > 0 && itemIds.includes(i.menuItemId)) ||
    (cats.length > 0 && cats.includes(i.category))
  );
}

function calcPercentDiscount(
  items: EngineCartItem[],
  scopedItems: EngineCartItem[],
  value: number,
  maxDiscount?: number | null
): number {
  const base = scopedItems.length > 0
    ? scopedItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    : items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const raw = Math.round(base * (value / 100) * 100) / 100;
  return maxDiscount ? Math.min(raw, maxDiscount) : raw;
}

function calcFixedDiscount(
  items: EngineCartItem[],
  value: number,
  maxDiscount?: number | null
): number {
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const raw = Math.min(value, subtotal);
  return maxDiscount ? Math.min(raw, maxDiscount) : raw;
}

export function runDiscountEngine(
  items: EngineCartItem[],
  activeCoupons: EngineCoupon[],
  now: Date,
  customerTier: string | null,
  requestedCouponCode: string | null
): EngineResult {
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discounts: DiscountResult[] = [];
  const bogoSuggestions: BogoSuggestion[] = [];

  const appliedCouponIds = new Set<string>();

  for (const coupon of activeCoupons) {
    if (!coupon.isActive) continue;
    if (isCouponExpired(coupon)) continue;
    if (isCouponExhausted(coupon)) continue;

    const scopedItems = itemsInScope(
      items,
      coupon.applicableItemIds as string[] | null,
      coupon.applicableCategories as string[] | null
    );

    if (coupon.type === "happyhour" && isHappyHour(coupon, now)) {
      if (coupon.minOrder && subtotal < coupon.minOrder) continue;
      const amount = calcPercentDiscount(items, scopedItems, coupon.value, coupon.maxDiscount);
      if (amount <= 0) continue;
      if (appliedCouponIds.has(coupon.id)) continue;
      appliedCouponIds.add(coupon.id);
      discounts.push({
        type: "happyhour",
        label: `হ্যাপি আওয়ার ${coupon.value}% ছাড়`,
        amount,
        couponId: coupon.id,
      });
    } else if (coupon.type === "member" && customerTier && coupon.memberTier === customerTier) {
      if (coupon.minOrder && subtotal < coupon.minOrder) continue;
      const amount = calcPercentDiscount(items, scopedItems, coupon.value, coupon.maxDiscount);
      if (amount <= 0) continue;
      if (appliedCouponIds.has(coupon.id)) continue;
      appliedCouponIds.add(coupon.id);
      discounts.push({
        type: "member",
        label: `${customerTier.toUpperCase()} মেম্বার ${coupon.value}% ছাড়`,
        amount,
        couponId: coupon.id,
      });
    } else if (coupon.type === "bogo") {
      const triggerItem = items.find(i =>
        (coupon.applicableItemIds as string[] ?? []).includes(i.menuItemId)
      );
      if (triggerItem && triggerItem.quantity >= 1) {
        const getQty = coupon.bogoGetQty ?? 1;
        const discountPct = coupon.bogoGetDiscount ?? 100;
        const getItemPrice = triggerItem.unitPrice;
        const discountAmount = Math.round(getItemPrice * getQty * (discountPct / 100) * 100) / 100;
        bogoSuggestions.push({
          couponId: coupon.id,
          couponCode: coupon.code,
          triggerItemId: triggerItem.menuItemId,
          triggerItemName: triggerItem.name,
          getItemId: coupon.bogoGetItemId ?? null,
          getItemName: coupon.bogoGetItemId ? null : triggerItem.name,
          getQty,
          getDiscountPct: discountPct,
          discountAmount,
        });
      }
    } else if (coupon.type === "combo") {
      // Combo: auto-applies when ALL required items are present in cart (no coupon code needed)
      const requiredIds = (coupon.applicableItemIds as string[] | null) ?? [];
      if (requiredIds.length === 0) continue; // combo with no items defined is invalid
      const allPresent = requiredIds.every(id => items.some(i => i.menuItemId === id && i.quantity >= 1));
      if (!allPresent) continue;
      if (coupon.minOrder && subtotal < coupon.minOrder) continue;
      const amount = coupon.value <= 100
        ? calcPercentDiscount(items, scopedItems, coupon.value, coupon.maxDiscount)
        : calcFixedDiscount(items, coupon.value, coupon.maxDiscount);
      if (amount <= 0) continue;
      if (appliedCouponIds.has(coupon.id)) continue;
      appliedCouponIds.add(coupon.id);
      discounts.push({
        type: "combo",
        label: `কম্বো অফার — ${coupon.value <= 100 ? coupon.value + "%" : "৳" + coupon.value} ছাড়`,
        amount,
        couponId: coupon.id,
        couponCode: coupon.code,
      });
    } else if (coupon.type === "percent" && requestedCouponCode === coupon.code) {
      if (coupon.minOrder && subtotal < coupon.minOrder) continue;
      const amount = calcPercentDiscount(items, scopedItems, coupon.value, coupon.maxDiscount);
      if (amount <= 0) continue;
      if (appliedCouponIds.has(coupon.id)) continue;
      appliedCouponIds.add(coupon.id);
      discounts.push({
        type: "coupon",
        label: `কুপন ${coupon.code} — ${coupon.value}% ছাড়`,
        amount,
        couponId: coupon.id,
        couponCode: coupon.code,
      });
    } else if (coupon.type === "fixed" && requestedCouponCode === coupon.code) {
      if (coupon.minOrder && subtotal < coupon.minOrder) continue;
      const amount = calcFixedDiscount(items, coupon.value, coupon.maxDiscount);
      if (amount <= 0) continue;
      if (appliedCouponIds.has(coupon.id)) continue;
      appliedCouponIds.add(coupon.id);
      discounts.push({
        type: "coupon",
        label: `কুপন ${coupon.code} — ৳${coupon.value} ছাড়`,
        amount,
        couponId: coupon.id,
        couponCode: coupon.code,
      });
    }
  }

  const totalDiscount = discounts.reduce((s, d) => s + d.amount, 0);
  return { discounts, totalDiscount, bogoSuggestions };
}

export function validateCouponCode(
  code: string,
  subtotal: number,
  items: EngineCartItem[],
  coupons: EngineCoupon[],
  now: Date
): { valid: boolean; error?: string; coupon?: EngineCoupon } {
  const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
  if (!coupon) return { valid: false, error: "কুপন কোড পাওয়া যায়নি" };
  if (!coupon.isActive) return { valid: false, error: "কুপন সক্রিয় নেই" };
  if (isCouponExpired(coupon)) return { valid: false, error: "কুপনের মেয়াদ শেষ হয়েছে" };
  if (isCouponExhausted(coupon)) return { valid: false, error: "কুপনের সর্বোচ্চ ব্যবহার সীমা পূর্ণ হয়েছে" };
  if (coupon.minOrder && subtotal < coupon.minOrder) {
    return { valid: false, error: `সর্বনিম্ন অর্ডার ৳${coupon.minOrder} হতে হবে` };
  }
  return { valid: true, coupon };
}
