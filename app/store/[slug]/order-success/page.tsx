"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle, MapPin, ShoppingBag, Copy, Check, MessageCircle, Share2 } from "lucide-react";
import { useStoreTheme } from "@/components/store/ThemeProvider";

export default function OrderSuccessPage() {
  const { primary, defaults } = useStoreTheme();
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = params.slug;
  const orderNumber = searchParams.get("order") || "";
  const [copied, setCopied] = useState(false);

  const text = defaults.text;
  const muted = defaults.muted;
  const surface = defaults.surface;
  const border = defaults.border;

  function copyOrderNumber() {
    if (!orderNumber) return;
    navigator.clipboard.writeText(orderNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const shareText = `আমার অর্ডার নম্বর: ${orderNumber}। অর্ডার ট্র্যাক করুন: ${window?.location?.origin}/store/${slug}/track`;

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="relative inline-flex">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "#ECFDF5" }}>
            <CheckCircle size={52} color="#10B981" strokeWidth={1.5} />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-base">🎉</div>
        </div>
        <h1 className="text-2xl font-bold mt-5 mb-2" style={{ color: text }}>অর্ডার সফল হয়েছে!</h1>
        <p className="text-sm" style={{ color: muted }}>আপনার অর্ডারটি আমরা পেয়েছি এবং শীঘ্রই প্রক্রিয়া করা হবে।</p>
      </div>

      {orderNumber && (
        <div className="p-5 rounded-2xl border mb-5 text-center" style={{ borderColor: "#BBF7D0", backgroundColor: "#F0FDF4" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "#059669" }}>আপনার অর্ডার নম্বর</p>
          <p className="text-2xl font-bold tracking-wide mb-3" style={{ color: "#065F46" }}>{orderNumber}</p>
          <button
            onClick={copyOrderNumber}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors"
            style={{ borderColor: "#059669", color: copied ? "#059669" : "#059669", backgroundColor: copied ? "#DCFCE7" : "transparent" }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "কপি হয়েছে!" : "অর্ডার নম্বর কপি করুন"}
          </button>
        </div>
      )}

      <div className="p-4 rounded-2xl border mb-5 space-y-3" style={{ borderColor: border, backgroundColor: surface }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm" style={{ backgroundColor: primary + "18" }}>📦</div>
          <div>
            <p className="text-sm font-semibold" style={{ color: text }}>অর্ডার প্রসেসিং</p>
            <p className="text-xs" style={{ color: muted }}>আমরা আপনার অর্ডারটি যাচাই করে প্যাক করব</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm" style={{ backgroundColor: primary + "18" }}>🚚</div>
          <div>
            <p className="text-sm font-semibold" style={{ color: text }}>ডেলিভারি</p>
            <p className="text-xs" style={{ color: muted }}>কনফার্মেশনের পর ২-৫ কার্যদিবসের মধ্যে পৌঁছে যাবে</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm" style={{ backgroundColor: primary + "18" }}>📱</div>
          <div>
            <p className="text-sm font-semibold" style={{ color: text }}>আপডেট</p>
            <p className="text-xs" style={{ color: muted }}>অর্ডার নম্বর দিয়ে যেকোনো সময় ট্র্যাক করুন</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Link href={`/store/${slug}/track`}
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold"
          style={{ backgroundColor: primary }}>
          <MapPin size={16} /> অর্ডার ট্র্যাক করুন
        </Link>
        {orderNumber && (
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white"
            style={{ backgroundColor: "#25D366" }}
          >
            <MessageCircle size={16} /> WhatsApp এ শেয়ার করুন
          </a>
        )}
        <Link href={`/store/${slug}`}
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold border"
          style={{ borderColor: border, color: muted }}>
          <ShoppingBag size={16} /> আরো কেনাকাটা করুন
        </Link>
      </div>
    </div>
  );
}
