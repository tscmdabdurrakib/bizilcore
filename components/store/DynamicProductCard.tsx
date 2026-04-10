"use client";

import Link from "next/link";
import { ShoppingCart, ImageIcon, Eye, Star, Heart } from "lucide-react";
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
}

function useAddToCart(product: ProductCardProduct, slug: string) {
  const addItem = useCart((s) => s.addItem);
  function handle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (product.stockQty <= 0 || product.hasVariants) return;
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
  return handle;
}

export function DynamicProductCard({ product, slug }: Props) {
  const { primary } = useStoreTheme();
  const handleAddToCart = useAddToCart(product, slug);
  const { toggle, isWishlisted } = useWishlist();
  const inStock = product.stockQty > 0;
  const wishlisted = isWishlisted(product.id);

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle({
      productId: product.id,
      productName: product.name,
      productImage: product.imageUrl,
      sellPrice: product.sellPrice,
      slug,
    });
  }

  return (
    <Link
      href={`/store/${slug}/products/${product.id}`}
      className="group relative block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300"
    >
      <div className="relative overflow-hidden aspect-square bg-gray-50">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={36} className="text-gray-300" />
          </div>
        )}

        {product.storeFeatured && inStock && (
          <span className="absolute top-2.5 left-2.5 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full text-white"
            style={{ backgroundColor: "#F59E0B" }}>
            <Star size={9} fill="white" /> জনপ্রিয়
          </span>
        )}

        {/* Wishlist heart button */}
        <button
          onClick={handleWishlist}
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center shadow-md backdrop-blur-sm transition-transform hover:scale-110"
          style={{ backgroundColor: "rgba(255,255,255,0.92)" }}
        >
          <Heart
            size={13}
            fill={wishlisted ? "#EF4444" : "none"}
            stroke={wishlisted ? "#EF4444" : "#9CA3AF"}
          />
        </button>

        {!inStock && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="px-3 py-1.5 rounded-full text-xs font-bold text-red-600 bg-red-50 border border-red-200">
              স্টক শেষ
            </span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 p-3 flex gap-2">
          {inStock && !product.hasVariants ? (
            <button
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: primary }}
            >
              <ShoppingCart size={13} /> কার্টে যোগ
            </button>
          ) : product.hasVariants ? (
            <div
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg"
              style={{ backgroundColor: primary }}
            >
              <Eye size={13} /> বিস্তারিত দেখুন
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-3.5">
        {product.category && (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">{product.category}</p>
        )}
        <p className="font-semibold text-sm text-gray-800 leading-tight mb-1 line-clamp-2 group-hover:text-gray-900 transition-colors">
          {product.name}
        </p>
        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-1 mb-2">{product.description}</p>
        )}

        <div className="flex items-center justify-between gap-2 mt-2">
          <p className="font-bold text-base" style={{ color: primary }}>
            ৳{product.sellPrice.toLocaleString()}
          </p>
          {inStock ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-green-700 bg-green-50">
              স্টকে আছে
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-red-600 bg-red-50">
              স্টক শেষ
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
