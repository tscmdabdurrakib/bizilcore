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

const MEMBER_TIERS = new Set(["silver", "gold", "platinum"]);

/** Maps CRM customer `group` to loyalty tier when it matches Silver/Gold/Platinum. */
export function customerGroupToMemberTier(group: string | null | undefined): string | null {
  if (!group) return null;
  const g = group.trim().toLowerCase();
  return MEMBER_TIERS.has(g) ? g : null;
}

export function mapPrismaCouponToEngine(c: {
  id: string;
  code: string;
  name?: string | null;
  type: string;
  value: number;
  minOrder?: number | null;
  maxDiscount?: number | null;
  maxUse?: number | null;
  usedCount: number;
  expiresAt?: Date | null;
  isActive: boolean;
  applicableItemIds?: unknown;
  applicableCategories?: unknown;
  happyHourStart?: string | null;
  happyHourEnd?: string | null;
  happyHourDays?: unknown;
  memberTier?: string | null;
  bogoGetItemId?: string | null;
  bogoGetQty?: number;
  bogoGetDiscount?: number;
}): EngineCoupon {
  return {
    ...c,
    applicableItemIds: (c.applicableItemIds as string[] | null) ?? [],
    applicableCategories: (c.applicableCategories as string[] | null) ?? [],
    happyHourDays: (c.happyHourDays as number[] | null) ?? [0, 1, 2, 3, 4, 5, 6],
  };
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

function fmtBdt(amount: number): string {
  return `৳${amount.toLocaleString("bn-BD", { maximumFractionDigits: 2 })}`;
}

function tryCodeCoupon(
  coupon: EngineCoupon,
  items: EngineCartItem[],
  scopedItems: EngineCartItem[],
  subtotal: number,
  requestedCode: string | null
): DiscountResult | null {
  const code = requestedCode?.toUpperCase();
  if (!code || coupon.code.toUpperCase() !== code) return null;

  if (coupon.type === "percent") {
    if (coupon.minOrder && subtotal < coupon.minOrder) return null;
    const amount = calcPercentDiscount(items, scopedItems, coupon.value, coupon.maxDiscount);
    if (amount <= 0) return null;
    return {
      type: "coupon",
      label: `কুপন ${coupon.code} — ${fmtBdt(amount)}`,
      amount,
      couponId: coupon.id,
      couponCode: coupon.code,
    };
  }

  if (coupon.type === "fixed") {
    if (coupon.minOrder && subtotal < coupon.minOrder) return null;
    const amount = calcFixedDiscount(items, coupon.value, coupon.maxDiscount);
    if (amount <= 0) return null;
    return {
      type: "coupon",
      label: `কুপন ${coupon.code} — ${fmtBdt(amount)}`,
      amount,
      couponId: coupon.id,
      couponCode: coupon.code,
    };
  }

  return null;
}

function tryHappyHour(
  coupon: EngineCoupon,
  items: EngineCartItem[],
  scopedItems: EngineCartItem[],
  subtotal: number,
  now: Date
): DiscountResult | null {
  if (coupon.type !== "happyhour" || !isHappyHour(coupon, now)) return null;
  if (coupon.minOrder && subtotal < coupon.minOrder) return null;
  const amount = calcPercentDiscount(items, scopedItems, coupon.value, coupon.maxDiscount);
  if (amount <= 0) return null;
  return {
    type: "happyhour",
    label: `হ্যাপি আওয়ার — ${fmtBdt(amount)}`,
    amount,
    couponId: coupon.id,
  };
}

function tryMember(
  coupon: EngineCoupon,
  items: EngineCartItem[],
  scopedItems: EngineCartItem[],
  subtotal: number,
  customerTier: string | null
): DiscountResult | null {
  if (coupon.type !== "member" || !customerTier || coupon.memberTier !== customerTier) return null;
  if (coupon.minOrder && subtotal < coupon.minOrder) return null;
  const amount = calcPercentDiscount(items, scopedItems, coupon.value, coupon.maxDiscount);
  if (amount <= 0) return null;
  return {
    type: "member",
    label: `${customerTier.charAt(0).toUpperCase() + customerTier.slice(1)} মেম্বার — ${fmtBdt(amount)}`,
    amount,
    couponId: coupon.id,
  };
}

function tryCombo(
  coupon: EngineCoupon,
  items: EngineCartItem[],
  scopedItems: EngineCartItem[],
  subtotal: number
): DiscountResult | null {
  if (coupon.type !== "combo") return null;
  const requiredIds = coupon.applicableItemIds ?? [];
  if (requiredIds.length === 0) return null;
  const allPresent = requiredIds.every(id => items.some(i => i.menuItemId === id && i.quantity >= 1));
  if (!allPresent) return null;
  if (coupon.minOrder && subtotal < coupon.minOrder) return null;
  const amount = coupon.value <= 100
    ? calcPercentDiscount(items, scopedItems, coupon.value, coupon.maxDiscount)
    : calcFixedDiscount(items, coupon.value, coupon.maxDiscount);
  if (amount <= 0) return null;
  return {
    type: "combo",
    label: `কম্বো অফার — ${fmtBdt(amount)}`,
    amount,
    couponId: coupon.id,
    couponCode: coupon.code,
  };
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
  const appliedIds = new Set<string>();

  const eligible = activeCoupons.filter(c => {
    if (!c.isActive) return false;
    if (isCouponExpired(c)) return false;
    if (isCouponExhausted(c)) return false;
    return true;
  });

  const requestedCode = requestedCouponCode?.toUpperCase() ?? null;

  // 1) Coupon code (percent / fixed) — highest priority
  for (const coupon of eligible) {
    const scoped = itemsInScope(items, coupon.applicableItemIds, coupon.applicableCategories);
    const result = tryCodeCoupon(coupon, items, scoped, subtotal, requestedCode);
    if (result && !appliedIds.has(coupon.id)) {
      appliedIds.add(coupon.id);
      discounts.push(result);
      break;
    }
  }

  // 2) Happy hour OR member (not both) — happy hour wins
  let tierAuto: DiscountResult | null = null;
  for (const coupon of eligible) {
    const scoped = itemsInScope(items, coupon.applicableItemIds, coupon.applicableCategories);
    const hh = tryHappyHour(coupon, items, scoped, subtotal, now);
    if (hh && !appliedIds.has(coupon.id)) {
      tierAuto = hh;
      appliedIds.add(coupon.id);
      break;
    }
  }
  if (!tierAuto) {
    for (const coupon of eligible) {
      const scoped = itemsInScope(items, coupon.applicableItemIds, coupon.applicableCategories);
      const mem = tryMember(coupon, items, scoped, subtotal, customerTier);
      if (mem && !appliedIds.has(coupon.id)) {
        tierAuto = mem;
        appliedIds.add(coupon.id);
        break;
      }
    }
  }
  if (tierAuto) discounts.push(tierAuto);

  // 3) Combo offers (stack with coupon + happy hour/member)
  for (const coupon of eligible) {
    const scoped = itemsInScope(items, coupon.applicableItemIds, coupon.applicableCategories);
    const combo = tryCombo(coupon, items, scoped, subtotal);
    if (combo && !appliedIds.has(coupon.id)) {
      appliedIds.add(coupon.id);
      discounts.push(combo);
    }
  }

  // 4) BOGO suggestions (waiter accepts in POS — not added to totalDiscount)
  for (const coupon of eligible) {
    if (coupon.type !== "bogo") continue;
    const triggerIds = coupon.applicableItemIds ?? [];
    const triggerItem = items.find(i => triggerIds.includes(i.menuItemId));
    if (!triggerItem || triggerItem.quantity < 1) continue;
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
  if (!["percent", "fixed"].includes(coupon.type)) {
    return { valid: false, error: "এই কোডটি ম্যানুয়ালি প্রয়োগযোগ্য নয়" };
  }
  return { valid: true, coupon };
}
