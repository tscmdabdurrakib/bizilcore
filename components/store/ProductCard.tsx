"use client";

import Link from "next/link";
import { ShoppingCart, ImageIcon } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { useStoreTheme } from "./ThemeProvider";

interface ProductCardProduct {
  id: string;
  name: string;
  sellPrice: number;
  imageUrl: string | null;
  stockQty: number;
  category: string | null;
  hasVariants: boolean;
}

interface Props {
  product: ProductCardProduct;
  slug: string;
  onAddToCart?: () => void;
}

export function ProductCard({ product, slug }: Props) {
  const { primary, accent, theme, defaults } = useStoreTheme();
  const addItem = useCart((s) => s.addItem);
  const bg = defaults.surface;
  const text = defaults.text;
  const muted = defaults.muted;
  const border = defaults.border;

  const inStock = product.stockQty > 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    if (product.hasVariants) return;
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.imageUrl,
      variantId: null,
      variantName: null,
      unitPrice: product.sellPrice,
      quantity: 1,
    }, slug);
  }

  return (
    <Link
      href={`/store/${slug}/products/${product.id}`}
      className="group block rounded-2xl border overflow-hidden transition-all hover:shadow-md"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: defaults.surface }}>
            <ImageIcon size={32} style={{ color: muted }} />
          </div>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xs font-bold bg-red-500 px-2 py-1 rounded-full">স্টক শেষ</span>
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="text-sm font-semibold leading-tight truncate mb-1" style={{ color: text }}>{product.name}</p>
        {product.category && (
          <p className="text-[11px] mb-1.5 truncate" style={{ color: muted }}>{product.category}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          <p className="text-base font-bold" style={{ color: primary }}>৳{product.sellPrice.toLocaleString()}</p>
          {product.hasVariants ? (
            <span className="text-xs font-semibold px-2.5 py-1.5 rounded-full border" style={{ borderColor: primary, color: primary }}>
              বেছে নিন
            </span>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full text-white disabled:opacity-40 transition-opacity"
              style={{ backgroundColor: inStock ? primary : "#9CA3AF" }}
            >
              <ShoppingCart size={12} />
              <span className="hidden sm:inline">যোগ</span>
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
