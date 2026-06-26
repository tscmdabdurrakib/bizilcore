"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

interface TrackEventOptions {
  action_type: string;
  action_label?: string;
  metadata?: Record<string, unknown>;
}

const DEBOUNCE_MS = 5000;

export function useActivityTracker() {
  const pathname = usePathname();
  const pageEntryTime = useRef<number>(Date.now());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPath = useRef<string | null>(null);

  const logActivity = useCallback(
    async (data: {
      action_type: string;
      action_label?: string;
      page_path?: string;
      duration_seconds?: number;
      metadata?: Record<string, unknown>;
    }) => {
      try {
        await fetch("/api/activity/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } catch {
        // Silent fail
      }
    },
    [],
  );

  useEffect(() => {
    pageEntryTime.current = Date.now();
    pendingPath.current = pathname;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const path = pendingPath.current;
      if (!path) return;
      logActivity({
        action_type: "page_view",
        action_label: `পেজ দেখা হয়েছে: ${path}`,
        page_path: path,
      });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      const duration = Math.floor((Date.now() - pageEntryTime.current) / 1000);
      if (duration > 2) {
        logActivity({
          action_type: "page_leave",
          page_path: pathname,
          duration_seconds: duration,
        });
      }
    };
  }, [pathname, logActivity]);

  const trackEvent = useCallback(
    (options: TrackEventOptions) => {
      logActivity({
        action_type: options.action_type,
        action_label: options.action_label,
        page_path: pathname,
        metadata: options.metadata,
      });
    },
    [pathname, logActivity],
  );

  return { trackEvent };
}
