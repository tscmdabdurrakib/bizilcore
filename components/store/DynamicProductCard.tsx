"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { useStoreTheme } from "./ThemeProvider";

interface Product {
  id: string; name: string; description: string | null; category: string | null;
  sellPrice: number; stockQty: number; imageUrl: string | null; images: unknown;
  hasVariants: boolean; storeVisible: boolean; storeFeatured: boolean;
}

export function DynamicProductCard({ product: p, slug, showDiscount, fullWidth }: {
  product: Product; slug: string; showDiscount?: boolean; fullWidth?: boolean;
}) {
  const { primary } = useStoreTheme();
  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const [adding, setAdding] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const imgs = Array.isArray(p.images) ? p.images as string[] : [];
  const img = !imgErr && (p.imageUrl || imgs[0]);
  const discountPct = showDiscount ? 20 : 0;
  const origPrice = discountPct > 0 ? Math.round(p.sellPrice / (1 - discountPct / 100)) : null;
  const stars = 4 + (p.id.charCodeAt(0) % 2) * 0.5;
  const reviewCount = 50 + (p.id.charCodeAt(1) % 100);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    addItem(
      {
        productId: p.id,
        productName: p.name,
        productImage: p.imageUrl || null,
        variantId: null,
        variantName: null,
        unitPrice: p.sellPrice,
        quantity: 1,
      },
      slug
    );
    setTimeout(() => setAdding(false), 800);
  }

  return (
    <Link href={`/store/${slug}/products/${p.id}`}
      className={`group ${fullWidth ? "w-full" : "flex-shrink-0 w-[220px] sm:w-[250px]"}`}>
      {/* Image */}
      <div className="relative bg-[#F0EEED] rounded-2xl overflow-hidden mb-3"
        style={{ aspectRatio: "3/4" }}>
        {img ? (
          <img src={img as string} alt={p.name}
            onError={() => setImgErr(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart size={40} className="text-gray-300" />
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {p.storeFeatured && (
            <span className="bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded-full">New</span>
          )}
          {discountPct > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">-{discountPct}%</span>
          )}
        </div>
        {/* Add to cart button */}
        <button
          onClick={handleAdd}
          disabled={adding || p.stockQty === 0}
          className="absolute bottom-3 left-3 right-3 bg-black text-white text-xs font-semibold py-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-800 flex items-center justify-center gap-1.5">
          <ShoppingCart size={12} />
          {adding ? "Added!" : p.stockQty === 0 ? "Stock Out" : "Add to Cart"}
        </button>
      </div>

      {/* Info */}
      <div>
        <h3 className="font-semibold text-black text-sm leading-tight mb-1.5 line-clamp-1">{p.name}</h3>
        {/* Stars */}
        <div className="flex items-center gap-1 mb-1.5">
          <div className="flex">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={12}
                fill={i <= Math.floor(stars) ? "#FFC633" : "none"}
                stroke={i <= Math.floor(stars) ? "#FFC633" : "#D1D5DB"} />
            ))}
          </div>
          <span className="text-xs text-gray-500">{stars}/5</span>
          <span className="text-xs text-gray-400">({reviewCount})</span>
        </div>
        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-base text-black">৳{p.sellPrice.toLocaleString("bn-BD")}</span>
          {origPrice && (
            <>
              <span className="text-sm text-gray-400 line-through">৳{origPrice.toLocaleString("bn-BD")}</span>
              <span className="text-xs font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">-{discountPct}%</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
