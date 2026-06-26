"use client";

import { useEffect, useState } from "react";

interface Props {
  slug: string;
  productId: string;
  enabled?: boolean;
}

export function SocialProofBadge({ slug, productId, enabled }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    fetch(`/api/store/social-proof?slug=${slug}&productId=${productId}`)
      .then(r => r.json())
      .then(d => setCount(d.recentBuyers ?? 0))
      .catch(() => {});
  }, [slug, productId, enabled]);

  if (!enabled || !count || count < 2) return null;

  return (
    <p className="text-[10px] font-semibold mt-1" style={{ color: "#059669" }}>
      🔥 {count} জন সম্প্রতি কিনেছেন
    </p>
  );
}
