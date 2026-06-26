"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    ttq?: { track: (...args: unknown[]) => void; load: (...args: unknown[]) => void };
  }
}

interface Props {
  fbPixelId?: string | null;
  gaId?: string | null;
  tiktokPixelId?: string | null;
}

export function StorePixelTracker({ fbPixelId, gaId, tiktokPixelId }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    if (fbPixelId && !document.getElementById("fb-pixel")) {
      const s = document.createElement("script");
      s.id = "fb-pixel";
      s.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${fbPixelId}');fbq('track','PageView');`;
      document.head.appendChild(s);
    }
    if (gaId && !document.getElementById("ga-script")) {
      const s = document.createElement("script");
      s.id = "ga-script";
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(s);
      const inline = document.createElement("script");
      inline.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`;
      document.head.appendChild(inline);
    }
    if (tiktokPixelId && !document.getElementById("tt-pixel")) {
      const s = document.createElement("script");
      s.id = "tt-pixel";
      s.innerHTML = `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${tiktokPixelId}');ttq.page();}(window,document,'ttq');`;
      document.head.appendChild(s);
    }
  }, [fbPixelId, gaId, tiktokPixelId]);

  useEffect(() => {
    window.fbq?.("track", "PageView");
    window.gtag?.("event", "page_view", { page_path: pathname });
    window.ttq?.track("PageView");
  }, [pathname]);

  return null;
}

export function trackStorePurchase(value: number, orderId: string) {
  window.fbq?.("track", "Purchase", { value, currency: "BDT", content_ids: [orderId] });
  window.gtag?.("event", "purchase", { transaction_id: orderId, value, currency: "BDT" });
  window.ttq?.track("CompletePayment", { value, currency: "BDT" });
}

export function trackStoreAddToCart(productId: string, value: number) {
  window.fbq?.("track", "AddToCart", { content_ids: [productId], value, currency: "BDT" });
  window.gtag?.("event", "add_to_cart", { items: [{ id: productId }], value, currency: "BDT" });
  window.ttq?.track("AddToCart", { content_id: productId, value, currency: "BDT" });
}
