"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishlistItem {
  productId: string;
  productName: string;
  productImage: string | null;
  sellPrice: number;
  slug: string;
}

interface WishlistState {
  items: WishlistItem[];
  toggle: (item: WishlistItem) => void;
  remove: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (item) => {
        set((state) => {
          const exists = state.items.some((i) => i.productId === item.productId);
          if (exists) {
            return { items: state.items.filter((i) => i.productId !== item.productId) };
          }
          return { items: [...state.items, item] };
        });
      },

      remove: (productId) => {
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) }));
      },

      isWishlisted: (productId) => {
        return get().items.some((i) => i.productId === productId);
      },

      clear: () => set({ items: [] }),
    }),
    { name: "bizilcore-wishlist" }
  )
);
