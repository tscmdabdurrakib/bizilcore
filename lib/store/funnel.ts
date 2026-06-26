"use client";

const SESSION_KEY = "bizilcore-funnel-session";

export type FunnelEventType = "visit" | "product_view" | "add_to_cart" | "checkout_start" | "purchase";

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function trackFunnelEvent(
  shopId: string,
  eventType: FunnelEventType,
  productId?: string,
  metadata?: Record<string, unknown>,
) {
  fetch("/api/store/funnel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      shopId,
      sessionId: getSessionId(),
      eventType,
      productId,
      metadata,
    }),
  }).catch(() => {});
}
