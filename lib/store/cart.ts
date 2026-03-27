"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
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
  removeItem: (productId: string, variantId: string | null) => void;
  updateQty: (productId: string, variantId: string | null, qty: number) => void;
  clearCart: () => void;
  ensureShop: (slug: string) => void;
  getTotal: () => number;
  getCount: () => number;
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
          const idx = items.findIndex(
            (i) => i.productId === item.productId && i.variantId === item.variantId
          );
          if (idx >= 0) {
            items[idx] = { ...items[idx], quantity: items[idx].quantity + item.quantity };
          } else {
            items.push(item);
          }
          return { items, shopSlug: slug };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        }));
      },

      updateQty: (productId, variantId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.variantId === variantId
              ? { ...i, quantity: qty }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [], shopSlug: null }),

      getTotal: () =>
        get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),

      getCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "bizilcore-cart" }
  )
);
