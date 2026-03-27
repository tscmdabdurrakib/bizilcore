"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Search, CheckCircle, Circle, Loader2, Package } from "lucide-react";
import { useStoreTheme } from "@/components/store/ThemeProvider";

interface TimelineStep {
  status: string;
  label: string;
  done: boolean;
  active: boolean;
}

interface TrackResult {
  order: {
    orderNumber: string;
    status: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerDistrict: string | null;
    totalAmount: number;
    shippingFee: number;
    discountAmount: number;
    subtotal: number;
    paymentMethod: string;
    paymentStatus: string;
    createdAt: string;
    shop: { name: string; storeSlug: string };
    items: { productName: string; variantName: string | null; quantity: number; unitPrice: number; subtotal: number }[];
  };
  timeline: TimelineStep[];
}

export default function TrackPage() {
  const { primary, theme, defaults } = useStoreTheme();
  const params = useParams();
  const slug = params?.slug as string;
  const [phone, setPhone] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);

  const text = defaults.text;
  const muted = defaults.muted;
  const border = defaults.border;
  const surface = defaults.surface;
  const bg = defaults.bg;

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setResult(null); setLoading(true);
    const r = await fetch(`/api/store/track?phone=${encodeURIComponent(phone)}&orderNumber=${encodeURIComponent(orderNumber)}&slug=${encodeURIComponent(slug)}`);
    const d = await r.json();
    if (r.ok) setResult(d);
    else setError(d.error || "অর্ডার পাওয়া যায়নি।");
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <Package size={36} style={{ color: primary, margin: "0 auto 12px" }} />
        <h1 className="text-xl font-bold" style={{ color: text }}>অর্ডার ট্র্যাক করুন</h1>
        <p className="text-sm mt-1" style={{ color: muted }}>ফোন নম্বর ও অর্ডার নম্বর দিয়ে আপনার অর্ডার খুঁজুন</p>
      </div>

      <form onSubmit={handleTrack} className="p-5 rounded-2xl border mb-6" style={{ borderColor: border, backgroundColor: surface }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: muted }}>ফোন নম্বর</label>
            <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: border, backgroundColor: bg, color: text }} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: muted }}>অর্ডার নম্বর</label>
            <input type="text" required value={orderNumber} onChange={e => setOrderNumber(e.target.value.toUpperCase())}
              placeholder="ORD-XXXXXXXX-XXXX"
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: border, backgroundColor: bg, color: text }} />
          </div>
        </div>
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold disabled:opacity-60"
          style={{ backgroundColor: primary }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {loading ? "খোঁজা হচ্ছে..." : "ট্র্যাক করুন"}
        </button>
      </form>

      {result && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border" style={{ borderColor: border, backgroundColor: surface }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold" style={{ color: text }}>#{result.order.orderNumber}</p>
                <p className="text-xs" style={{ color: muted }}>{new Date(result.order.createdAt).toLocaleDateString("bn-BD")}</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full"
                style={{
                  backgroundColor:
                    result.order.status === "delivered" ? "#ECFDF5" :
                    result.order.status === "shipped" ? "#EFF6FF" :
                    result.order.status === "cancelled" ? "#FEF2F2" : "#FFFBEB",
                  color:
                    result.order.status === "delivered" ? "#059669" :
                    result.order.status === "shipped" ? "#2563EB" :
                    result.order.status === "cancelled" ? "#DC2626" : "#D97706",
                }}>
                {result.order.status === "pending" ? "অপেক্ষমান" :
                 result.order.status === "confirmed" ? "নিশ্চিত" :
                 result.order.status === "packed" ? "প্যাকিং" :
                 result.order.status === "shipped" ? "পাঠানো হয়েছে" :
                 result.order.status === "delivered" ? "পৌঁছে গেছে" : result.order.status}
              </span>
            </div>

            {/* Timeline */}
            <div className="space-y-0">
              {result.timeline.map((step, i) => (
                <div key={step.status} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{
                      backgroundColor: step.done ? primary : (defaults.bg),
                      border: `2px solid ${step.done ? primary : border}`
                    }}>
                      {step.done ? <CheckCircle size={14} color="white" fill="white" /> : <Circle size={10} style={{ color: border }} />}
                    </div>
                    {i < result.timeline.length - 1 && (
                      <div className="w-0.5 h-6 my-0.5" style={{ backgroundColor: step.done ? primary : border }} />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-semibold" style={{ color: step.done ? text : muted }}>{step.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl border" style={{ borderColor: border, backgroundColor: surface }}>
            <p className="text-sm font-semibold mb-3" style={{ color: text }}>অর্ডার বিস্তারিত</p>
            <div className="space-y-2">
              {result.order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span style={{ color: muted }}>{item.productName}{item.variantName ? ` (${item.variantName})` : ""} ×{item.quantity}</span>
                  <span style={{ color: text }}>৳{item.subtotal.toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold" style={{ borderColor: border, color: text }}>
                <span>মোট</span>
                <span style={{ color: primary }}>৳{result.order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
