import { useCallback, useEffect, useState } from "react";
import type { ShopData } from "@/lib/shops/types";

export function useShops() {
  const [data, setData] = useState<ShopData | null>(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shops");
      const d = await res.json();
      if (d.locked) {
        setLocked(true);
        setData(null);
        return;
      }
      if (!res.ok) {
        setError(d.error ?? "ডেটা লোড করতে সমস্যা");
        return;
      }
      setLocked(false);
      setData(d);
    } catch {
      setError("সংযোগ সমস্যা");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, locked, loading, error, reload: load };
}

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
