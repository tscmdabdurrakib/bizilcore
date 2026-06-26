"use client";

const STORAGE_KEY = "bizilcore-recently-viewed";
const MAX_ITEMS = 12;

export interface RecentlyViewedProduct {
  id: string;
  name: string;
  sellPrice: number;
  imageUrl: string | null;
  slug: string;
  viewedAt: number;
}

function readAll(): Record<string, RecentlyViewedProduct[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, RecentlyViewedProduct[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function trackRecentlyViewed(slug: string, product: Omit<RecentlyViewedProduct, "viewedAt" | "slug">) {
  const all = readAll();
  const list = (all[slug] ?? []).filter((p) => p.id !== product.id);
  list.unshift({ ...product, slug, viewedAt: Date.now() });
  all[slug] = list.slice(0, MAX_ITEMS);
  writeAll(all);
}

export function getRecentlyViewed(slug: string, excludeId?: string): RecentlyViewedProduct[] {
  const list = readAll()[slug] ?? [];
  return excludeId ? list.filter((p) => p.id !== excludeId) : list;
}
