"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Plus, Minus, Tag, ChevronRight, ShoppingBag, ImageIcon } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { useParams } from "next/navigation";

export default function CartPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { items, removeItem, updateQty, getTotal } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [appliedCode, setAppliedCode] = useState("");

  const subtotal = getTotal();
  const shipping = 60;
  const discount = couponDiscount;
  const total = subtotal + shipping - discount;

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

  /* ── Empty state ── */
  if (items.length === 0) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <ShoppingBag size={72} className="text-gray-200 mx-auto mb-6" />
          <h2 className="font-extrabold text-2xl text-black mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven&apos;t added anything yet.</p>
          <Link
            href={`/store/${slug}/products`}
            className="inline-flex items-center gap-2 bg-black text-white font-semibold px-8 py-3.5 rounded-full hover:bg-gray-900 transition-colors"
          >
            Continue Shopping <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href={`/store/${slug}`} className="hover:text-black transition-colors">Home</Link>
          <ChevronRight size={14} />
          <span className="text-black font-medium">Cart</span>
        </nav>

        <h1 className="font-extrabold text-3xl sm:text-4xl text-black mb-8 tracking-tight">YOUR CART</h1>

        <div className="flex flex-col lg:flex-row gap-5">

          {/* ── LEFT: Cart items ── */}
          <div className="flex-1 min-w-0">
            <div className="border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
              {items.map((item, idx) => (
                <div key={`${item.productId}-${item.variantId}-${idx}`}
                  className="flex gap-4 p-5">

                  {/* Product image */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-xl overflow-hidden bg-[#F0EEED]">
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={28} className="text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-black text-base leading-tight line-clamp-2">
                          {item.productName}
                        </h3>
                        {item.variantName && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            Variant: <span className="font-medium text-black">{item.variantName}</span>
                          </p>
                        )}
                      </div>
                      {/* Delete */}
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="flex-shrink-0 text-red-500 hover:text-red-600 transition-colors mt-0.5"
                        aria-label="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Price */}
                      <span className="font-bold text-xl text-black">
                        ৳{(item.unitPrice * item.quantity).toLocaleString()}
                      </span>

                      {/* Quantity stepper */}
                      <div className="flex items-center gap-0 bg-[#F0F0F0] rounded-full overflow-hidden">
                        <button
                          onClick={() => updateQty(item.productId, item.variantId, item.quantity - 1)}
                          className="w-9 h-9 flex items-center justify-center hover:bg-gray-200 transition-colors rounded-full"
                        >
                          <Minus size={14} className="text-black" />
                        </button>
                        <span className="w-8 text-center font-semibold text-sm text-black">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.productId, item.variantId, item.quantity + 1)}
                          className="w-9 h-9 flex items-center justify-center hover:bg-gray-200 transition-colors rounded-full"
                        >
                          <Plus size={14} className="text-black" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Order Summary ── */}
          <div className="w-full lg:w-[400px] flex-shrink-0">
            <div className="border border-gray-200 rounded-2xl p-6">
              <h2 className="font-bold text-xl text-black mb-5">Order Summary</h2>

              {/* Summary rows */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-black">৳{subtotal.toLocaleString()}</span>
                </div>

                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Discount{appliedCode ? ` (${appliedCode})` : ""}
                    </span>
                    <span className="font-semibold text-red-500">-৳{discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Delivery Fee</span>
                  <span className="font-semibold text-black">৳{shipping}</span>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-3 flex items-center justify-between">
                  <span className="font-bold text-black">Total</span>
                  <span className="font-bold text-xl text-black">৳{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Promo code */}
              <div className="mt-5">
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2.5">
                    <Tag size={14} className="text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Add promo code"
                      className="flex-1 bg-transparent outline-none text-sm text-black placeholder:text-gray-400 min-w-0"
                      onKeyDown={e => e.key === "Enter" && couponCode && applyCoupon()}
                    />
                  </div>
                  <button
                    onClick={applyCoupon}
                    disabled={!couponCode || couponLoading}
                    className="px-5 py-2.5 rounded-full border border-black text-sm font-semibold text-black hover:bg-black hover:text-white transition-colors disabled:opacity-40 whitespace-nowrap"
                  >
                    {couponLoading ? "..." : "Apply"}
                  </button>
                </div>
                {couponSuccess && (
                  <p className="text-xs mt-2 text-green-600 font-medium pl-2">✓ {couponSuccess}</p>
                )}
                {couponError && (
                  <p className="text-xs mt-2 text-red-500 pl-2">{couponError}</p>
                )}
              </div>

              {/* Checkout button */}
              <Link
                href={`/store/${slug}/checkout${appliedCode ? `?coupon=${appliedCode}&discount=${couponDiscount}` : ""}`}
                className="mt-4 flex items-center justify-center gap-2 w-full bg-black text-white font-bold py-4 rounded-full text-sm hover:bg-gray-900 transition-colors"
              >
                Go to Checkout <ChevronRight size={16} />
              </Link>

              {/* Continue shopping */}
              <Link
                href={`/store/${slug}/products`}
                className="mt-3 block text-center text-xs text-gray-400 hover:text-black transition-colors"
              >
                ← Continue Shopping
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
              {["VISA", "Mastercard", "bKash", "Nagad", "COD"].map(badge => (
                <span
                  key={badge}
                  className="text-[10px] font-bold text-gray-400 border border-gray-200 px-2.5 py-1 rounded-md"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
