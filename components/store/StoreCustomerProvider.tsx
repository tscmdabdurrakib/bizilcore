"use client";

import { useEffect } from "react";
import { useStoreCustomer } from "@/lib/store/store-customer";

export function StoreCustomerProvider() {
  const { fetchCustomer } = useStoreCustomer();
  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);
  return null;
}
