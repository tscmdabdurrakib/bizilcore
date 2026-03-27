"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle, MapPin, ShoppingBag } from "lucide-react";
import { useStoreTheme } from "@/components/store/ThemeProvider";

export default function OrderSuccessPage() {
  const { primary, theme, defaults } = useStoreTheme();
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = params.slug;
  const orderNumber = searchParams.get("order") || "";

  const text = defaults.text;
  const muted = defaults.muted;
  const surface = defaults.surface;
  const border = defaults.border;

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "#ECFDF5" }}>
        <CheckCircle size={40} color="#10B981" />
      </div>

      <h1 className="text-2xl font-bold mb-2" style={{ color: text }}>অর্ডার সফলভাবে দেওয়া হয়েছে!</h1>
      <p className="text-sm mb-6" style={{ color: muted }}>আপনার অর্ডারটি আমরা পেয়েছি এবং শীঘ্রই প্রক্রিয়া করা হবে।</p>

      {orderNumber && (
        <div className="p-4 rounded-2xl border mb-6" style={{ borderColor: "#BBF7D0", backgroundColor: "#F0FDF4" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "#059669" }}>অর্ডার নম্বর</p>
          <p className="text-2xl font-bold" style={{ color: "#065F46" }}>{orderNumber}</p>
        </div>
      )}

      <div className="p-4 rounded-2xl border mb-8" style={{ borderColor: border, backgroundColor: surface }}>
        <p className="text-sm" style={{ color: muted }}>আপনার ফোনে SMS পাঠানো হয়েছে। অর্ডার ট্র্যাক করতে নিচের বোতামে ক্লিক করুন।</p>
      </div>

      <div className="flex flex-col gap-3">
        <Link href={`/store/${slug}/track`}
          className="flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold"
          style={{ backgroundColor: primary }}>
          <MapPin size={16} /> অর্ডার ট্র্যাক করুন
        </Link>
        <Link href={`/store/${slug}`}
          className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold border"
          style={{ borderColor: primary, color: primary }}>
          <ShoppingBag size={16} /> আরো কেনাকাটা করুন
        </Link>
      </div>
    </div>
  );
}
