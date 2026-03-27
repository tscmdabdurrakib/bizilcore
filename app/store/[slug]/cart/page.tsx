"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Plus, Minus, Tag, ChevronRight, ShoppingBag, ImageIcon } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { useStoreTheme } from "@/components/store/ThemeProvider";
import { useParams } from "next/navigation";

export default function CartPage() {
  const { primary, theme, defaults } = useStoreTheme();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { items, removeItem, updateQty, getTotal } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [appliedCode, setAppliedCode] = useState("");

  const text = defaults.text;
  const muted = defaults.muted;
  const border = defaults.border;
  const surface = defaults.surface;
  const bg = defaults.bg;

  const subtotal = getTotal();
  const shipping = 60;
  const total = subtotal + shipping - couponDiscount;

  async function applyCoupon() {
    setCouponLoading(true);
    setCouponError("");
    setCouponSuccess("");
    const r = await fetch("/api/store/validate-coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode, slug, subtotal }),
    });
    const d = await r.json();
    if (r.ok) {
      setCouponDiscount(d.discount);
      setAppliedCode(d.code);
      setCouponSuccess(`৳${d.discount.toLocaleString()} ছাড় পেলেন!`);
    } else {
      setCouponDiscount(0);
      setAppliedCode("");
      setCouponError(d.error);
    }
    setCouponLoading(false);
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={64} style={{ color: muted, margin: "0 auto 16px" }} />
        <p className="text-lg font-semibold mb-2" style={{ color: text }}>কার্ট খালি</p>
        <p className="text-sm mb-6" style={{ color: muted }}>কেনাকাটা শুরু করুন</p>
        <Link href={`/store/${slug}/products`} className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold" style={{ backgroundColor: primary }}>
          কেনাকাটা করুন
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6" style={{ color: text }}>কার্ট ({items.length})</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {items.map(item => (
            <div key={`${item.productId}-${item.variantId}`} className="flex gap-4 p-4 rounded-2xl border" style={{ borderColor: border, backgroundColor: surface }}>
              <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden" style={{ backgroundColor: bg }}>
                {item.productImage ? (
                  <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon size={24} style={{ color: muted }} /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: text }}>{item.productName}</p>
                {item.variantName && <p className="text-xs" style={{ color: muted }}>{item.variantName}</p>}
                <p className="text-sm font-bold mt-1" style={{ color: primary }}>৳{item.unitPrice.toLocaleString()}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-0 border rounded-lg overflow-hidden" style={{ borderColor: border }}>
                    <button onClick={() => updateQty(item.productId, item.variantId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center" style={{ color: text }}>
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-sm font-bold" style={{ color: text }}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.productId, item.variantId, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center" style={{ color: text }}>
                      <Plus size={12} />
                    </button>
                  </div>
                  <p className="text-xs font-semibold" style={{ color: muted }}>= ৳{(item.unitPrice * item.quantity).toLocaleString()}</p>
                  <button onClick={() => removeItem(item.productId, item.variantId)} className="ml-auto" style={{ color: "#EF4444" }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Coupon */}
          <div className="p-4 rounded-2xl border" style={{ borderColor: border, backgroundColor: surface }}>
            <div className="flex items-center gap-2 mb-3">
              <Tag size={14} style={{ color: muted }} />
              <p className="text-sm font-semibold" style={{ color: text }}>কুপন কোড</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                placeholder="কোড লিখুন..."
                className="flex-1 text-sm border rounded-xl px-3 py-2 outline-none"
                style={{ borderColor: border, backgroundColor: bg, color: text }}
              />
              <button onClick={applyCoupon} disabled={!couponCode || couponLoading}
                className="px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: primary }}>
                {couponLoading ? "..." : "প্রয়োগ"}
              </button>
            </div>
            {couponSuccess && <p className="text-xs mt-2 font-semibold text-green-600">✓ {couponSuccess}</p>}
            {couponError && <p className="text-xs mt-2 text-red-500">{couponError}</p>}
          </div>
        </div>

        {/* Order summary */}
        <div>
          <div className="p-4 rounded-2xl border sticky top-20" style={{ borderColor: border, backgroundColor: surface }}>
            <h2 className="font-bold mb-4" style={{ color: text }}>অর্ডার সারসংক্ষেপ</h2>
            <div className="space-y-2 text-sm" style={{ color: muted }}>
              <div className="flex justify-between"><span>সাবটোটাল</span><span>৳{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>ডেলিভারি <span className="text-[10px]">(আনুমানিক)</span></span><span>৳{shipping}+</span></div>
              {couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>ছাড় ({appliedCode})</span><span>-৳{couponDiscount.toLocaleString()}</span></div>}
              <div className="flex justify-between font-bold text-base border-t pt-2 mt-2" style={{ borderColor: border, color: text }}>
                <span>আনুমানিক মোট</span><span style={{ color: primary }}>৳{total.toLocaleString()}+</span>
              </div>
              <p className="text-[10px] mt-1" style={{ color: muted }}>চেকআউটে সঠিক ডেলিভারি চার্জ নির্ধারিত হবে।</p>
            </div>
            <Link
              href={`/store/${slug}/checkout${appliedCode ? `?coupon=${appliedCode}&discount=${couponDiscount}` : ""}`}
              className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-bold"
              style={{ backgroundColor: primary }}>
              চেকআউট করুন <ChevronRight size={16} />
            </Link>
            <Link href={`/store/${slug}/products`} className="mt-2 block text-center text-xs" style={{ color: muted }}>
              কেনাকাটা চালিয়ে যান
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
