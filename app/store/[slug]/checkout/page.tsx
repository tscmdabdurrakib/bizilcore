"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/store/cart";
import { useStoreTheme } from "@/components/store/ThemeProvider";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { BD_DISTRICTS, BD_UPAZILAS, getShippingFee } from "@/lib/store/bangladesh";
import { ImageIcon, ChevronRight } from "lucide-react";

export default function CheckoutPage() {
  const { primary, theme, defaults } = useStoreTheme();
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug;

  const { items, getTotal, clearCart } = useCart();
  const subtotal = getTotal();

  const preAppliedCoupon = searchParams.get("coupon") || "";
  const preDiscount = parseFloat(searchParams.get("discount") || "0");

  const [form, setForm] = useState({
    name: "", phone: "", altPhone: "",
    district: "", upazila: "", address: "", note: "",
    payment: "cod" as "cod" | "bkash" | "nagad",
    transactionId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shopInfo, setShopInfo] = useState<{ storeBkashNumber: string | null; storeNagadNumber: string | null; storeCODEnabled: boolean; storeShippingFee: number; storeDhakaFee: number; storeFreeShipping: number | null } | null>(null);

  const text = defaults.text;
  const muted = defaults.muted;
  const border = defaults.border;
  const surface = defaults.surface;
  const bg = defaults.bg;

  useEffect(() => {
    fetch(`/api/store/${slug}`)
      .then(r => r.json())
      .then(d => {
        setShopInfo(d);
        if (!d.storeCODEnabled) {
          const firstAvailable = d.storeBkashNumber ? "bkash" : d.storeNagadNumber ? "nagad" : "cod";
          setForm(f => ({ ...f, payment: firstAvailable as "cod" | "bkash" | "nagad" }));
        }
      })
      .catch(() => {});
  }, [slug]);

  const shippingFee = form.district
    ? getShippingFee(form.district, shopInfo?.storeDhakaFee ?? 60, shopInfo?.storeShippingFee ?? 120)
    : (shopInfo?.storeDhakaFee ?? 60);

  const freeShipping = shopInfo?.storeFreeShipping;
  const effectiveShipping = freeShipping && subtotal >= freeShipping ? 0 : shippingFee;

  const total = subtotal + effectiveShipping - preDiscount;

  function updateField(k: string, v: string) {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === "district") next.upazila = "";
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.phone || !form.district || !form.address) {
      setError("সব প্রয়োজনীয় তথ্য পূরণ করুন।");
      return;
    }
    if (items.length === 0) {
      setError("কার্ট খালি।");
      return;
    }
    setLoading(true);
    const r = await fetch("/api/store/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        customerName: form.name,
        customerPhone: form.phone,
        customerAddress: form.address,
        customerDistrict: form.district,
        customerUpazila: form.upazila || null,
        customerNote: form.note || null,
        paymentMethod: form.payment,
        transactionId: form.transactionId || null,
        couponCode: preAppliedCoupon || null,
        items: items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      }),
    });
    const d = await r.json();
    if (r.ok) {
      clearCart();
      router.push(`/store/${slug}/order-success?order=${d.orderNumber}`);
    } else {
      setError(d.error || "অর্ডার তৈরি করা যায়নি।");
    }
    setLoading(false);
  }

  const inputCls = "w-full border rounded-xl px-3 py-2.5 text-sm outline-none";
  const inputStyle = { borderColor: border, backgroundColor: bg, color: text };
  const labelCls = "text-xs font-semibold mb-1 block";
  const labelStyle = { color: muted };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-lg font-bold mb-4" style={{ color: text }}>কার্ট খালি</p>
        <a href={`/store/${slug}/products`} className="text-sm" style={{ color: primary }}>কেনাকাটা করুন</a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6" style={{ color: text }}>চেকআউট</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-5">
            {/* Customer info */}
            <div className="p-4 rounded-2xl border" style={{ borderColor: border, backgroundColor: surface }}>
              <h2 className="font-semibold mb-4 text-sm" style={{ color: text }}>আপনার তথ্য</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} style={labelStyle}>নাম *</label>
                  <input required value={form.name} onChange={e => updateField("name", e.target.value)} className={inputCls} style={inputStyle} placeholder="আপনার নাম" />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>ফোন নম্বর *</label>
                  <input required value={form.phone} onChange={e => updateField("phone", e.target.value)} className={inputCls} style={inputStyle} placeholder="01XXXXXXXXX" />
                </div>
              </div>
            </div>

            {/* Delivery address */}
            <div className="p-4 rounded-2xl border" style={{ borderColor: border, backgroundColor: surface }}>
              <h2 className="font-semibold mb-4 text-sm" style={{ color: text }}>ডেলিভারি ঠিকানা</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls} style={labelStyle}>জেলা *</label>
                    <select required value={form.district} onChange={e => updateField("district", e.target.value)} className={inputCls} style={inputStyle}>
                      <option value="">জেলা বেছে নিন</option>
                      {BD_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>উপজেলা / থানা</label>
                    {BD_UPAZILAS[form.district] ? (
                      <select value={form.upazila} onChange={e => updateField("upazila", e.target.value)} className={inputCls} style={inputStyle}>
                        <option value="">উপজেলা বেছে নিন</option>
                        {BD_UPAZILAS[form.district].map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    ) : (
                      <input value={form.upazila} onChange={e => updateField("upazila", e.target.value)}
                        className={inputCls} style={inputStyle} placeholder="উপজেলা বা থানার নাম" />
                    )}
                  </div>
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>বিস্তারিত ঠিকানা *</label>
                  <textarea required value={form.address} onChange={e => updateField("address", e.target.value)} rows={3}
                    className={inputCls} style={{ ...inputStyle, resize: "none" }} placeholder="গ্রাম/মহল্লা, রাস্তা, বাড়ি নং..." />
                </div>
                {form.district && (
                  <p className="text-xs font-medium" style={{ color: effectiveShipping === 0 ? "#10B981" : primary }}>
                    ডেলিভারি চার্জ: {effectiveShipping === 0 ? "বিনামূল্যে ✓" : `৳${effectiveShipping}`}
                  </p>
                )}
              </div>
            </div>

            {/* Payment */}
            <div className="p-4 rounded-2xl border" style={{ borderColor: border, backgroundColor: surface }}>
              <h2 className="font-semibold mb-4 text-sm" style={{ color: text }}>পেমেন্ট পদ্ধতি</h2>
              <div className="space-y-3">
                {shopInfo?.storeCODEnabled !== false && (
                  <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer" style={{ borderColor: form.payment === "cod" ? primary : border, backgroundColor: form.payment === "cod" ? primary + "10" : "transparent" }}>
                    <input type="radio" name="payment" value="cod" checked={form.payment === "cod"} onChange={e => updateField("payment", e.target.value)} className="hidden" />
                    <span style={{ color: form.payment === "cod" ? primary : text }}>💵</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: form.payment === "cod" ? primary : text }}>Cash on Delivery (COD)</p>
                      <p className="text-xs" style={{ color: muted }}>পণ্য পেয়ে টাকা দিন</p>
                    </div>
                  </label>
                )}
                {shopInfo?.storeBkashNumber && (
                  <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer" style={{ borderColor: form.payment === "bkash" ? "#E2136E" : border, backgroundColor: form.payment === "bkash" ? "#FFE4F0" : "transparent" }}>
                    <input type="radio" name="payment" value="bkash" checked={form.payment === "bkash"} onChange={e => updateField("payment", e.target.value)} className="hidden" />
                    <span>📱</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: form.payment === "bkash" ? "#E2136E" : text }}>bKash</p>
                      <p className="text-xs" style={{ color: muted }}>বিকাশ নম্বর: {shopInfo.storeBkashNumber}</p>
                    </div>
                  </label>
                )}
                {shopInfo?.storeNagadNumber && (
                  <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer" style={{ borderColor: form.payment === "nagad" ? "#F26522" : border, backgroundColor: form.payment === "nagad" ? "#FFF0E8" : "transparent" }}>
                    <input type="radio" name="payment" value="nagad" checked={form.payment === "nagad"} onChange={e => updateField("payment", e.target.value)} className="hidden" />
                    <span>📱</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: form.payment === "nagad" ? "#F26522" : text }}>Nagad</p>
                      <p className="text-xs" style={{ color: muted }}>নগদ নম্বর: {shopInfo.storeNagadNumber}</p>
                    </div>
                  </label>
                )}
                {(form.payment === "bkash" || form.payment === "nagad") && (
                  <div className="mt-2">
                    <label className={labelCls} style={labelStyle}>Transaction ID *</label>
                    <input required value={form.transactionId} onChange={e => updateField("transactionId", e.target.value)}
                      className={inputCls} style={inputStyle} placeholder="Transaction ID দিন" />
                  </div>
                )}
              </div>
            </div>

            {/* Note */}
            <div className="p-4 rounded-2xl border" style={{ borderColor: border, backgroundColor: surface }}>
              <label className={labelCls} style={labelStyle}>অর্ডার নোট (ঐচ্ছিক)</label>
              <textarea value={form.note} onChange={e => updateField("note", e.target.value)} rows={2}
                className={inputCls} style={{ ...inputStyle, resize: "none" }}
                placeholder="বিশেষ কোনো নির্দেশনা থাকলে লিখুন..." />
            </div>
          </div>

          {/* Order summary */}
          <div>
            <div className="p-4 rounded-2xl border sticky top-20" style={{ borderColor: border, backgroundColor: surface }}>
              <h2 className="font-bold mb-4" style={{ color: text }}>আপনার অর্ডার</h2>
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex gap-2 items-center">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: bg }}>
                      {item.productImage ? <img src={item.productImage} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={14} style={{ color: muted }} /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: text }}>{item.productName}</p>
                      {item.variantName && <p className="text-[10px]" style={{ color: muted }}>{item.variantName}</p>}
                      <p className="text-xs" style={{ color: muted }}>x{item.quantity}</p>
                    </div>
                    <p className="text-xs font-bold flex-shrink-0" style={{ color: text }}>৳{(item.unitPrice * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-1.5 text-sm" style={{ borderColor: border }}>
                <div className="flex justify-between" style={{ color: muted }}><span>সাবটোটাল</span><span>৳{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between" style={{ color: muted }}><span>ডেলিভারি</span><span>{effectiveShipping === 0 ? "বিনামূল্যে" : `৳${effectiveShipping}`}</span></div>
                {preDiscount > 0 && <div className="flex justify-between text-green-600"><span>ছাড়</span><span>-৳{preDiscount.toLocaleString()}</span></div>}
                <div className="flex justify-between font-bold text-base border-t pt-2" style={{ borderColor: border, color: text }}>
                  <span>মোট</span><span style={{ color: primary }}>৳{total.toLocaleString()}</span>
                </div>
              </div>
              {error && <p className="mt-3 text-xs text-red-500 text-center">{error}</p>}
              <button type="submit" disabled={loading}
                className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-bold disabled:opacity-60"
                style={{ backgroundColor: primary }}>
                {loading ? "অর্ডার দেওয়া হচ্ছে..." : <><ChevronRight size={16} /> অর্ডার দিন</>}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
