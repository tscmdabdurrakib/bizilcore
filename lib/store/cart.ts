"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  itemType: "product" | "combo";
  productId: string;
  comboId?: string | null;
  productName: string;
  productImage: string | null;
  variantId: string | null;
  variantName: string | null;
  unitPrice: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  shopSlug: string | null;
  addItem: (item: CartItem, slug: string) => void;
  removeItem: (key: { productId: string; variantId: string | null; comboId?: string | null }) => void;
  updateQty: (key: { productId: string; variantId: string | null; comboId?: string | null }, qty: number) => void;
  clearCart: () => void;
  ensureShop: (slug: string) => void;
  getTotal: () => number;
  getCount: () => number;
}

function itemKey(i: CartItem) {
  return i.itemType === "combo"
    ? `combo:${i.comboId ?? i.productId}`
    : `${i.productId}:${i.variantId ?? ""}`;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      shopSlug: null,

      ensureShop: (slug: string) => {
        const state = get();
        if (state.shopSlug !== null && state.shopSlug !== slug) {
          set({ items: [], shopSlug: slug });
        } else if (state.shopSlug === null && state.items.length > 0) {
          set({ items: [], shopSlug: slug });
        }
      },

      addItem: (item, slug) => {
        set((state) => {
          const items = state.shopSlug !== slug ? [] : [...state.items];
          const key = itemKey(item);
          const idx = items.findIndex((i) => itemKey(i) === key);
          if (idx >= 0) {
            items[idx] = { ...items[idx], quantity: items[idx].quantity + item.quantity };
          } else {
            items.push(item);
          }
          return { items, shopSlug: slug };
        });
      },

      removeItem: ({ productId, variantId, comboId }) => {
        set((state) => ({
          items: state.items.filter((i) => {
            if (comboId || i.itemType === "combo") {
              return (i.comboId ?? i.productId) !== (comboId ?? productId);
            }
            return !(i.productId === productId && i.variantId === variantId);
          }),
        }));
      },

      updateQty: (key, qty) => {
        if (qty <= 0) {
          get().removeItem(key);
          return;
        }
        const matchKey = key.comboId
          ? `combo:${key.comboId}`
          : `${key.productId}:${key.variantId ?? ""}`;
        set((state) => ({
          items: state.items.map((i) =>
            itemKey(i) === matchKey ? { ...i, quantity: qty } : i,
          ),
        }));
      },

      clearCart: () => set({ items: [], shopSlug: null }),

      getTotal: () =>
        get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),

      getCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "bizilcore-cart" },
  ),
);
