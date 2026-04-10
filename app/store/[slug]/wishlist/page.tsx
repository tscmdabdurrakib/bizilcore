"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2, ImageIcon, ShoppingBag } from "lucide-react";
import { useWishlist } from "@/lib/store/wishlist";
import { useCart } from "@/lib/store/cart";
import { useStoreTheme } from "@/components/store/ThemeProvider";
import { useParams } from "next/navigation";

export default function WishlistPage() {
  const { primary, defaults } = useStoreTheme();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { items, remove } = useWishlist();
  const addItem = useCart((s) => s.addItem);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  const text = defaults.text;
  const muted = defaults.muted;
  const border = defaults.border;
  const surface = defaults.surface;

  useEffect(() => { setMounted(true); }, []);

  function handleAddToCart(item: typeof items[0]) {
    addItem({
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      variantId: null,
      variantName: null,
      unitPrice: item.sellPrice,
      quantity: 1,
    }, slug);
    setAdded(prev => ({ ...prev, [item.productId]: true }));
    setTimeout(() => setAdded(prev => ({ ...prev, [item.productId]: false })), 2000);
  }

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Heart size={22} style={{ color: primary }} fill={primary} />
        <h1 className="text-xl font-bold" style={{ color: text }}>পছন্দের তালিকা</h1>
        {items.length > 0 && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: primary + "18", color: primary }}>
            {items.length}টি
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <Heart size={64} style={{ color: "#E5E7EB", margin: "0 auto 16px" }} />
          <p className="text-lg font-semibold mb-2" style={{ color: text }}>পছন্দের তালিকা খালি</p>
          <p className="text-sm mb-6" style={{ color: muted }}>পছন্দের পণ্যে হার্ট বাটন দিয়ে সেভ করুন</p>
          <Link
            href={`/store/${slug}/products`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold"
            style={{ backgroundColor: primary }}
          >
            <ShoppingBag size={16} />
            পণ্য দেখুন
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.productId} className="rounded-2xl border overflow-hidden flex flex-col" style={{ borderColor: border, backgroundColor: surface }}>
              <Link href={`/store/${slug}/products/${item.productId}`} className="block relative">
                <div className="aspect-square overflow-hidden" style={{ backgroundColor: defaults.bg }}>
                  {item.productImage ? (
                    <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={40} style={{ color: muted }} />
                    </div>
                  )}
                </div>
              </Link>
              <div className="p-3 flex-1 flex flex-col">
                <Link href={`/store/${slug}/products/${item.productId}`}>
                  <p className="font-semibold text-sm mb-1 line-clamp-2 hover:underline" style={{ color: text }}>{item.productName}</p>
                </Link>
                <p className="text-base font-bold mb-3" style={{ color: primary }}>৳{item.sellPrice.toLocaleString()}</p>
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-sm font-semibold"
                    style={{ backgroundColor: added[item.productId] ? "#10B981" : primary }}
                  >
                    <ShoppingCart size={14} />
                    {added[item.productId] ? "যোগ হয়েছে!" : "কার্টে যোগ"}
                  </button>
                  <button
                    onClick={() => remove(item.productId)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border"
                    style={{ borderColor: "#FECACA", color: "#EF4444" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-6 text-center">
          <Link href={`/store/${slug}/cart`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold"
            style={{ backgroundColor: primary }}>
            <ShoppingCart size={16} />
            কার্ট দেখুন
          </Link>
        </div>
      )}
    </div>
  );
}
