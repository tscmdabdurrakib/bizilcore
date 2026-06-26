"use client";

import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

export function useDashboardFetch<T>(
  key: string | null,
  options?: { refreshInterval?: number; revalidateOnFocus?: boolean },
) {
  return useSWR<T>(key, fetcher, {
    revalidateOnFocus: options?.revalidateOnFocus ?? false,
    dedupingInterval: 30_000,
    refreshInterval: options?.refreshInterval,
  });
}
