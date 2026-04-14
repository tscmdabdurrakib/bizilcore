"use client";

import { create } from "zustand";

export interface StoreCustomerSession {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  shopId: string;
}

interface StoreCustomerState {
  customer: StoreCustomerSession | null;
  loading: boolean;
  setCustomer: (c: StoreCustomerSession | null) => void;
  fetchCustomer: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useStoreCustomer = create<StoreCustomerState>((set) => ({
  customer: null,
  loading: true,

  setCustomer: (customer) => set({ customer }),

  fetchCustomer: async () => {
    try {
      const res = await fetch("/api/store/customer/me");
      const data = await res.json();
      set({ customer: data.customer ?? null, loading: false });
    } catch {
      set({ customer: null, loading: false });
    }
  },

  signOut: async () => {
    await fetch("/api/store/customer/signout", { method: "POST" });
    set({ customer: null });
  },
}));
