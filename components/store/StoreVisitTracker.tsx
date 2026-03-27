"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function StoreVisitTracker({ slug }: { slug: string }) {
  const pathname = usePathname();
  const lastPath = useRef<string>("");

  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;

    fetch("/api/store/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, path: pathname }),
    }).catch(() => {});
  }, [pathname, slug]);

  return null;
}
