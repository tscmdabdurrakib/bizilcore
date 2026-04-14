"use client";

import Link from "next/link";
import { ShoppingCart, ImageIcon, Heart } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { useStoreTheme } from "./ThemeProvider";

export interface ProductCardProduct {
  id: string;
  name: string;
  description?: string | null;
  sellPrice: number;
  imageUrl: string | null;
  stockQty: number;
  category: string | null;
  hasVariants: boolean;
  storeFeatured?: boolean;
}

interface Props {
  product: ProductCardProduct;
  slug: string;
  showDiscount?: boolean;
}

function useAddToCart(product: ProductCardProduct, slug: string) {
  const addItem = useCart((s) => s.addItem);
  return function handle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (product.stockQty <= 0 || product.hasVariants) return;
    addItem({
      productId: product.id, productName: product.name, productImage: product.imageUrl,
      variantId: null, variantName: null, unitPrice: product.sellPrice, quantity: 1,
    }, slug);
  };
}

function discountPct(id: string) {
  const n = (id.charCodeAt(0) + id.charCodeAt(id.length - 1)) % 4;
  return [10, 15, 20, 25][n];
}

export function DynamicProductCard({ product, slug, showDiscount = true }: Props) {
  const { primary } = useStoreTheme();
  const handleAddToCart = useAddToCart(product, slug);
  const { toggle, isWishlisted } = useWishlist();
  const inStock = product.stockQty > 0;
  const wishlisted = isWishlisted(product.id);
  const pct = showDiscount && product.storeFeatured ? discountPct(product.id) : 0;
  const originalPrice = pct > 0 ? Math.round(product.sellPrice / (1 - pct / 100)) : null;

  return (
    <Link
      href={`/store/${slug}/products/${product.id}`}
      className="group relative block bg-white border border-gray-100 hover:shadow-lg transition-all duration-300 flex-shrink-0"
      style={{ width: 200, borderRadius: 4 }}
    >
      {/* Image — portrait 3:4 */}
      <div className="relative overflow-hidden bg-gray-50" style={{ paddingBottom: "133%" }}>
        <div className="absolute inset-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl} alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <ImageIcon size={32} className="text-gray-300" />
            </div>
          )}
        </div>

        {/* Discount badge */}
        {pct > 0 && inStock && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-sm">
            -{pct}%
          </span>
        )}

        {/* Wishlist */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); toggle({ productId: product.id, productName: product.name, productImage: product.imageUrl, sellPrice: product.sellPrice, slug }); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center transition-transform hover:scale-110"
        >
          <Heart size={13} fill={wishlisted ? "#EF4444" : "none"} stroke={wishlisted ? "#EF4444" : "#9CA3AF"} />
        </button>

        {/* Out of stock */}
        {!inStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-white border border-red-200 text-red-500 text-xs font-bold px-3 py-1 rounded-sm">স্টক শেষ</span>
          </div>
        )}

        {/* Add to cart — appears on hover */}
        {inStock && (
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            {!product.hasVariants ? (
              <button onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-white"
                style={{ backgroundColor: primary }}>
                <ShoppingCart size={12} /> কার্টে যোগ
              </button>
            ) : (
              <div className="w-full flex items-center justify-center py-2.5 text-xs font-bold text-white" style={{ backgroundColor: primary }}>
                বিস্তারিত →
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-xs text-gray-800 font-medium leading-tight line-clamp-2 mb-1.5 group-hover:text-black transition-colors">
          {product.name}
        </p>
        <div className="flex items-center gap-2">
          <span className="font-black text-sm" style={{ color: primary }}>
            ৳{product.sellPrice.toLocaleString()}
          </span>
          {originalPrice && (
            <span className="text-xs text-gray-400 line-through">৳{originalPrice.toLocaleString()}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
