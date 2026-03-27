"use client";

import { useEffect, useState } from "react";
import { PLAN_LIMITS, type PlanName, type FeatureName, canAccessFeature } from "@/lib/features";

interface Subscription {
  id: string; plan: string; status: string; startDate: string; endDate: string | null; autoRenew: boolean;
}
interface Payment {
  id: string; amount: number; method: string; plan: string; months: number; status: string; createdAt: string; transactionId: string | null;
}

interface UseSubscriptionReturn {
  loading: boolean;
  subscription: Subscription | null;
  payments: Payment[];
  daysLeft: number | null;
  plan: PlanName;
  canAccess: (feature: FeatureName) => boolean;
  isExpiringSoon: boolean;
  refresh: () => void;
}

export function useSubscription(): UseSubscriptionReturn {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ subscription: Subscription | null; payments: Payment[]; daysLeft: number | null }>({
    subscription: null, payments: [], daysLeft: null,
  });

  function load() {
    setLoading(true);
    fetch("/api/subscription")
      .then(r => r.json())
      .then(d => setData({ subscription: d.subscription ?? null, payments: d.payments ?? [], daysLeft: d.daysLeft ?? null }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const plan = (data.subscription?.plan ?? "free") as PlanName;
  const isExpiringSoon = data.daysLeft !== null && data.daysLeft <= 7 && plan !== "free";

  return {
    loading,
    subscription: data.subscription,
    payments: data.payments,
    daysLeft: data.daysLeft,
    plan,
    canAccess: (feature: FeatureName) => canAccessFeature(plan, feature),
    isExpiringSoon,
    refresh: load,
  };
}
